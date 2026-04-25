from fastapi import APIRouter

from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["AI"])

WORKOUT_PROMPT = (
    "You are a workout coach. Keep responses practical and concise. "
    "Ask one relevant follow-up if user context is missing."
)
DIET_PROMPT = (
    "You are a diet counselor. Respect restrictions and keep suggestions budget-aware. "
    "Ask one relevant follow-up if user context is missing."
)


@router.post("/workout/chat", response_model=AIChatResponse)
async def workout_chat(payload: AIChatRequest) -> AIChatResponse:
    response = await llm_service.generate(WORKOUT_PROMPT, payload.message)
    return AIChatResponse(response=response, conversation_id=payload.conversation_id)


@router.post("/diet/chat", response_model=AIChatResponse)
async def diet_chat(payload: AIChatRequest) -> AIChatResponse:
    response = await llm_service.generate(DIET_PROMPT, payload.message)
    return AIChatResponse(response=response, conversation_id=payload.conversation_id)
