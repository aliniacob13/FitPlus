"""Plate Coach API — Phase 4.

POST /ai/nutrition/plate/analyze  — upload image, get food item estimates.
POST /ai/nutrition/plate/clarify  — answer LLM questions, get refined estimates.
"""
import io
import json
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.prompts import PLATE_COACH_SYSTEM_PROMPT
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.plate import (
    ClarificationRequest,
    PlateAnalysisResponse,
    PlateItem,
    ClarificationQuestion,
)
from app.services.llm_service import LLMProviderError, llm_service
from app.services.vision_llm import VisionLLMError, analyze_image

router = APIRouter(prefix="/ai/nutrition/plate", tags=["Plate Coach"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


# ── helpers ──────────────────────────────────────────────────────────────────


def _prepare_image_for_vision(image_bytes: bytes) -> tuple[bytes, str]:
    """Resize/re-encode to keep vision LLM requests within practical limits."""
    max_edge = settings.NUTRITION_PLATE_VISION_MAX_EDGE_PX
    if max_edge <= 0:
        return image_bytes, "image/jpeg"

    try:
        from PIL import Image  # type: ignore[import-untyped]
    except ImportError:
        return image_bytes, "image/jpeg"

    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        w, h = img.size
        longest = max(w, h)
        if longest > max_edge:
            scale = max_edge / longest
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=82, optimize=True)
        return buf.getvalue(), "image/jpeg"
    except Exception:
        return image_bytes, "image/jpeg"


def _parse_llm_json(raw: str) -> dict:
    """Extract JSON from LLM output, tolerating minor formatting noise."""
    raw = raw.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    raw = raw.strip()

    # Strip ```json ... ``` without requiring it to start at column 0
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw, flags=re.IGNORECASE)
    if fence:
        raw = fence.group(1).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try extracting the first {...} block (models sometimes add preamble text)
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = raw[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            raise ValueError(f"LLM returned non-JSON: {raw[:200]}") from exc

    raise ValueError(f"LLM returned non-JSON: {raw[:200]}")


def _guess_item_index_from_question(text: str) -> int | None:
    m = re.search(r"\bitem\s*#?\s*(\d+)\b", text, flags=re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r"\b(?:for|about)\s+item\s*#?\s*(\d+)\b", text, flags=re.IGNORECASE)
    if m:
        return int(m.group(1))
    return None


def _normalize_clarifications(raw: object) -> list[ClarificationQuestion]:
    if raw is None:
        return []
    if not isinstance(raw, list):
        return []

    out: list[ClarificationQuestion] = []
    fallback_index = 0
    for q in raw:
        if isinstance(q, str):
            question = q.strip()
            if not question:
                continue
            idx = _guess_item_index_from_question(question)
            if idx is None:
                idx = fallback_index
                fallback_index += 1
            out.append(ClarificationQuestion(index=int(idx), question=question))
            continue

        if isinstance(q, dict):
            idx_raw = q.get("index", 0)
            try:
                idx = int(idx_raw)  # type: ignore[arg-type]
            except (TypeError, ValueError):
                idx = 0
            question = str(q.get("question", "")).strip()
            if question:
                out.append(ClarificationQuestion(index=idx, question=question))
            continue

        # Unknown shape — skip rather than 500 the whole request
        continue

    return out


def _dict_to_response(data: dict, conversation_id: int) -> PlateAnalysisResponse:
    items = [
        PlateItem(
            index=it.get("index", i),
            food_name_estimate=str(it.get("food_name_estimate", "Unknown")),
            grams_estimate=float(it.get("grams_estimate") or 0),
            kcal_estimate=float(it.get("kcal_estimate") or 0),
            protein_g_estimate=float(it.get("protein_g_estimate") or it.get("protein_g") or 0),
            carbs_g_estimate=float(it.get("carbs_g_estimate") or it.get("carbs_g") or 0),
            fat_g_estimate=float(it.get("fat_g_estimate") or it.get("fat_g") or 0),
            confidence=float(it.get("confidence") or 0),
        )
        for i, it in enumerate(data.get("items", []))
    ]
    clarifications = _normalize_clarifications(data.get("needs_clarification", []))
    return PlateAnalysisResponse(
        items=items,
        total_kcal_estimate=float(data.get("total_kcal_estimate") or 0),
        assumptions=str(data.get("assumptions", "")),
        needs_clarification=clarifications,
        conversation_id=conversation_id,
    )


async def _get_plate_conversation(
    conversation_id: int,
    user_id: int,
    db: AsyncSession,
) -> Conversation:
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if conv.agent_type != "nutrition_vision":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation is not a plate coach conversation.",
        )
    return conv


async def _get_recent_messages(db: AsyncSession, conversation_id: int, limit: int = 10) -> list[Message]:
    result = await db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    )
    return list(reversed(result.all()))


# ── endpoints ────────────────────────────────────────────────────────────────


@router.post("/analyze", response_model=PlateAnalysisResponse)
async def analyze_plate(
    image: UploadFile = File(...),
    conversation_id: int | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlateAnalysisResponse:
    if image.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported type '{image.content_type}'. Send JPEG, PNG, or WebP.",
        )
    image_bytes = await image.read()
    max_mb = settings.NUTRITION_PLATE_MAX_IMAGE_MB
    if max_mb > 0:
        max_bytes = max_mb * 1024 * 1024
        if len(image_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image must be under {max_mb} MB.",
            )

    # Create or reuse a conversation
    if conversation_id is not None:
        conv = await _get_plate_conversation(conversation_id, current_user.id, db)
    else:
        conv = Conversation(
            user_id=current_user.id,
            agent_type="nutrition_vision",
            title="Plate analysis",
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

    # Call vision LLM
    vision_bytes, vision_media_type = _prepare_image_for_vision(image_bytes)
    try:
        raw_json = await analyze_image(
            image_bytes=vision_bytes,
            system_prompt=PLATE_COACH_SYSTEM_PROMPT,
            media_type=vision_media_type,
        )
    except VisionLLMError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    # Parse and persist
    try:
        data = _parse_llm_json(raw_json)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    db.add(Message(conversation_id=conv.id, role="user", content="[Plate photo uploaded for analysis]"))
    db.add(Message(conversation_id=conv.id, role="assistant", content=raw_json))
    await db.commit()

    return _dict_to_response(data, conv.id)


@router.post("/clarify", response_model=PlateAnalysisResponse)
async def clarify_plate(
    payload: ClarificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlateAnalysisResponse:
    conv = await _get_plate_conversation(payload.conversation_id, current_user.id, db)
    history = await _get_recent_messages(db, conv.id)

    answers_text = "\n".join(
        f"Item {a.index}: {a.answer}" for a in payload.answers
    )
    user_message = (
        "I can clarify the following items:\n"
        f"{answers_text}\n\n"
        "Please update your analysis with these clarifications and return the same JSON "
        "format with empty needs_clarification."
    )

    # Build message list for text LLM (conversation context + new user message)
    llm_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
        if msg.role in {"user", "assistant"}
    ]
    llm_messages.append({"role": "user", "content": user_message})

    try:
        raw_json = await llm_service.generate(PLATE_COACH_SYSTEM_PROMPT, llm_messages)
    except LLMProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=exc.message) from exc

    try:
        data = _parse_llm_json(raw_json)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    db.add(Message(conversation_id=conv.id, role="user", content=user_message))
    db.add(Message(conversation_id=conv.id, role="assistant", content=raw_json))
    await db.commit()

    return _dict_to_response(data, conv.id)