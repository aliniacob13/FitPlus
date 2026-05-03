from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.api.v1.users import get_current_user
from app.core.database import get_db
from app.core.prompts import DIET_SYSTEM_PROMPT, WORKOUT_SYSTEM_PROMPT, build_system_prompt
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    ConversationSummaryResponse,
    MessageResponse,
)
from app.services.health_context import UserHealthContext, get_user_health_context_for_ai
from app.services.llm_service import LLMProviderError, llm_service

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/workout/chat", response_model=AIChatResponse)
async def workout_chat(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIChatResponse:
    return await _chat(
        payload=payload,
        current_user=current_user,
        db=db,
        agent_type="workout",
        prompt_template=WORKOUT_SYSTEM_PROMPT,
    )


@router.post("/diet/chat", response_model=AIChatResponse)
async def diet_chat(
    payload: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIChatResponse:
    return await _chat(
        payload=payload,
        current_user=current_user,
        db=db,
        agent_type="diet",
        prompt_template=DIET_SYSTEM_PROMPT,
    )


@router.get("/workout/chat/stream")
async def workout_chat_stream(
    message: str = Query(min_length=1, max_length=4000),
    conversation_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    return await _chat_stream(
        message=message,
        conversation_id=conversation_id,
        current_user=current_user,
        db=db,
        agent_type="workout",
        prompt_template=WORKOUT_SYSTEM_PROMPT,
    )


@router.get("/diet/chat/stream")
async def diet_chat_stream(
    message: str = Query(min_length=1, max_length=4000),
    conversation_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    return await _chat_stream(
        message=message,
        conversation_id=conversation_id,
        current_user=current_user,
        db=db,
        agent_type="diet",
        prompt_template=DIET_SYSTEM_PROMPT,
    )


@router.get("/conversations", response_model=list[ConversationSummaryResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationSummaryResponse]:
    result = await db.scalars(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(desc(Conversation.created_at)),
    )
    conversations = result.all()
    return [
        ConversationSummaryResponse(
            id=conversation.id,
            agent_type=conversation.agent_type,
            title=conversation.title,
            created_at=conversation.created_at,
        )
        for conversation in conversations
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MessageResponse]:
    conversation = await _get_conversation_or_404(conversation_id, current_user.id, db)
    result = await db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc(), Message.id.asc()),
    )
    messages = result.all()
    return [
        MessageResponse(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
    ]


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    conversation = await _get_conversation_or_404(conversation_id, current_user.id, db)
    await db.execute(delete(Conversation).where(Conversation.id == conversation.id))
    await db.commit()


async def _chat(
    payload: AIChatRequest,
    current_user: User,
    db: AsyncSession,
    agent_type: str,
    prompt_template: str,
) -> AIChatResponse:
    conversation = await _resolve_conversation(
        db=db,
        user_id=current_user.id,
        agent_type=agent_type,
        conversation_id=payload.conversation_id,
        title=_build_conversation_title(payload.message),
    )
    history = await _get_recent_history(db, conversation.id)
    health_context = (
        await get_user_health_context_for_ai(current_user.id, db)
        if agent_type == "diet"
        else UserHealthContext()
    )
    system_prompt = build_system_prompt(
        prompt_template,
        current_user,
        additional_context=_build_health_context_for_prompt(agent_type, health_context),
    )
    llm_messages = _build_llm_messages(history, payload.message)
    try:
        assistant_response = await llm_service.generate(system_prompt, llm_messages)
    except LLMProviderError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM provider error: {exc.message}",
        ) from exc

    db.add(Message(conversation_id=conversation.id, role="user", content=payload.message))
    db.add(Message(conversation_id=conversation.id, role="assistant", content=assistant_response))
    await db.commit()

    return AIChatResponse(
        response=assistant_response,
        conversation_id=conversation.id,
    )


async def _chat_stream(
    message: str,
    conversation_id: int | None,
    current_user: User,
    db: AsyncSession,
    agent_type: str,
    prompt_template: str,
) -> EventSourceResponse:
    conversation = await _resolve_conversation(
        db=db,
        user_id=current_user.id,
        agent_type=agent_type,
        conversation_id=conversation_id,
        title=_build_conversation_title(message),
    )
    history = await _get_recent_history(db, conversation.id)
    health_context = (
        await get_user_health_context_for_ai(current_user.id, db)
        if agent_type == "diet"
        else UserHealthContext()
    )
    system_prompt = build_system_prompt(
        prompt_template,
        current_user,
        additional_context=_build_health_context_for_prompt(agent_type, health_context),
    )
    llm_messages = _build_llm_messages(history, message)

    async def stream_events() -> AsyncIterator[dict[str, str]]:
        full_response = ""
        try:
            async for chunk in llm_service.generate_stream(system_prompt, llm_messages):
                full_response += chunk
                yield {"event": "chunk", "data": chunk}

            db.add(Message(conversation_id=conversation.id, role="user", content=message))
            db.add(Message(conversation_id=conversation.id, role="assistant", content=full_response.strip()))
            await db.commit()

            yield {"event": "meta", "data": str(conversation.id)}
            yield {"event": "done", "data": "[DONE]"}
        except LLMProviderError as exc:
            await db.rollback()
            yield {"event": "error", "data": f"LLM provider error: {exc.message}"}
        except Exception as exc:
            await db.rollback()
            yield {"event": "error", "data": str(exc)}

    return EventSourceResponse(stream_events())


async def _resolve_conversation(
    db: AsyncSession,
    user_id: int,
    agent_type: str,
    conversation_id: int | None,
    title: str,
) -> Conversation:
    if conversation_id is not None:
        conversation = await db.get(Conversation, conversation_id)
        if not conversation or conversation.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )
        if conversation.agent_type != agent_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Conversation belongs to '{conversation.agent_type}' agent.",
            )
        return conversation

    conversation = Conversation(
        user_id=user_id,
        agent_type=agent_type,
        title=title,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def _get_conversation_or_404(conversation_id: int, user_id: int, db: AsyncSession) -> Conversation:
    conversation = await db.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )
    return conversation


async def _get_recent_history(db: AsyncSession, conversation_id: int, limit: int = 12) -> list[Message]:
    result = await db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit),
    )
    # Query is desc; reverse to keep chronological context for the LLM.
    return list(reversed(result.all()))


def _build_llm_messages(history: list[Message], latest_user_message: str) -> list[dict[str, str]]:
    history_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in history
        if msg.role in {"user", "assistant"}
    ]
    history_messages.append({"role": "user", "content": latest_user_message})
    return history_messages


def _build_conversation_title(message: str) -> str:
    cleaned = " ".join(message.split())
    return (cleaned[:77] + "...") if len(cleaned) > 80 else cleaned


def _build_health_context_for_prompt(agent_type: str, context: UserHealthContext) -> str:
    if agent_type != "diet":
        return ""

    return (
        "DATELE UTILIZATORULUI (ia-le in considerare, dar nu le repeta inutil):\n"
        f"- Alergii: {context.allergies}\n"
        f"- Preferinte alimentare: {context.preferences}\n"
        f"- Greutate curenta: {context.current_weight}\n"
        f"- Greutate tinta: {context.target_weight}\n"
        f"- Prescriptii medicale: {context.prescription_references}"
    )
