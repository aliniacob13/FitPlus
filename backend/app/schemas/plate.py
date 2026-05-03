from pydantic import BaseModel, Field


class PlateItem(BaseModel):
    index: int
    food_name_estimate: str
    grams_estimate: float = Field(ge=0)
    kcal_estimate: float = Field(ge=0)
    protein_g_estimate: float = Field(default=0, ge=0)
    carbs_g_estimate: float = Field(default=0, ge=0)
    fat_g_estimate: float = Field(default=0, ge=0)
    confidence: float = Field(ge=0.0, le=1.0)


class ClarificationQuestion(BaseModel):
    index: int
    question: str


class PlateAnalysisResponse(BaseModel):
    items: list[PlateItem]
    total_kcal_estimate: float
    assumptions: str
    needs_clarification: list[ClarificationQuestion]
    conversation_id: int
    disclaimer: str = (
        "These are rough estimates only — not medical or dietetic advice. "
        "Always verify quantities before relying on them for health decisions."
    )


class ClarificationAnswer(BaseModel):
    index: int
    answer: str = Field(min_length=1, max_length=500)


class ClarificationRequest(BaseModel):
    conversation_id: int
    answers: list[ClarificationAnswer] = Field(min_length=1)