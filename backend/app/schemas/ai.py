from datetime import datetime

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: int | None = None


class AIChatResponse(BaseModel):
    response: str
    conversation_id: int


class ConversationSummaryResponse(BaseModel):
    id: int
    agent_type: str
    title: str
    created_at: datetime


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
