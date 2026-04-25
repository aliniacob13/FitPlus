from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None


class AIChatResponse(BaseModel):
    response: str
    conversation_id: str | None = None
