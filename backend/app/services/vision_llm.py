"""Vision-capable LLM calls for plate photo analysis.

Separate from llm_service.py because the message format differs: content is a
list of image + text blocks rather than a plain string.
"""
import base64
import json

import httpx

from app.core.config import settings
from app.services.llm_service import LLMService


class VisionLLMError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


async def analyze_image(
    image_bytes: bytes,
    system_prompt: str,
    user_text: str = "Analyze this plate and return JSON.",
    media_type: str = "image/jpeg",
) -> str:
    """Send an image to the configured vision-capable LLM, return raw JSON string."""
    b64 = base64.b64encode(image_bytes).decode()
    provider = settings.LLM_PROVIDER.lower()
    model = settings.VISION_LLM_MODEL

    if provider == "anthropic":
        return await _call_anthropic(b64, media_type, system_prompt, user_text, model)
    return await _call_openai(b64, media_type, system_prompt, user_text, model)


async def _call_openai(
    b64: str,
    media_type: str,
    system_prompt: str,
    user_text: str,
    model: str,
) -> str:
    if not settings.OPENAI_API_KEY:
        return _fallback_json()

    payload: dict = {
        "model": model,
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 900,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{b64}",
                            "detail": "high",
                        },
                    },
                    {"type": "text", "text": user_text},
                ],
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise VisionLLMError(f"OpenAI vision error {exc.response.status_code}") from exc
        except httpx.HTTPError as exc:
            raise VisionLLMError(f"OpenAI request failed: {exc}") from exc

        return resp.json()["choices"][0]["message"]["content"].strip()


async def _call_anthropic(
    b64: str,
    media_type: str,
    system_prompt: str,
    user_text: str,
    model: str,
) -> str:
    if not settings.ANTHROPIC_API_KEY:
        return _fallback_json()

    payload: dict = {
        "model": model,
        "max_tokens": 900,
        "system": system_prompt,
        "temperature": 0.2,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": b64},
                    },
                    {"type": "text", "text": user_text},
                ],
            }
        ],
    }
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = (
                LLMService._extract_provider_error_message(exc.response)
                if exc.response is not None
                else "unknown error"
            )
            raise VisionLLMError(
                f"Anthropic vision error {exc.response.status_code if exc.response is not None else 'unknown'}: {detail}"
            ) from exc
        except httpx.HTTPError as exc:
            raise VisionLLMError(f"Anthropic request failed: {exc}") from exc

        content = resp.json().get("content", [])
        return "".join(block.get("text", "") for block in content).strip()


def _fallback_json() -> str:
    return json.dumps(
        {
            "items": [],
            "total_kcal_estimate": 0,
            "assumptions": "Vision LLM not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.",
            "needs_clarification": [],
        }
    )