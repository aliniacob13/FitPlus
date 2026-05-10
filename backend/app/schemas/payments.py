from datetime import datetime

from pydantic import BaseModel, Field


class GymPricingPlanResponse(BaseModel):
    key: str
    name: str
    amount_cents: int = Field(ge=1)
    currency: str
    period: str
    period_days: int = Field(ge=1)
    features: list[str] = Field(default_factory=list)


class CheckoutSessionRequest(BaseModel):
    gym_id: int = Field(ge=1)
    plan_index: int = Field(ge=0, description="Index in normalized pricing_plans list from GET /gyms/{id}/pricing")


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class UserSubscriptionResponse(BaseModel):
    id: int
    gym_id: int
    gym_name: str
    plan_name: str
    status: str
    stripe_subscription_id: str | None
    started_at: datetime | None
    expires_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": False}


class PaymentRecordResponse(BaseModel):
    id: int
    gym_id: int
    amount: int
    currency: str
    status: str
    stripe_payment_intent_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
