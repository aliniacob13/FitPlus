from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class GymPricingPlanResponse(BaseModel):
    key: str
    name: str
    amount_cents: int = Field(ge=1)
    currency: str
    period: str
    period_days: int = Field(ge=1)
    features: list[str] = Field(default_factory=list)


class GymPricingImportRequest(BaseModel):
    """Body for importing plans from a public pricing page."""

    url: HttpUrl | None = Field(
        default=None,
        description="Full https URL of the pricing/membership page. Omit to use the gym's saved website.",
    )
    persist: bool = Field(
        default=True, description="If true, overwrite gym.pricing_plans in the database."
    )
    use_playwright: bool = Field(
        default=True,
        description="If true, use headless Chromium when available (better for JS-rendered prices).",
    )
    deep_crawl: bool = Field(
        default=True,
        description="If true, follow same-site links (pricing-related paths prioritized) up to crawl limits.",
    )


class GymPricingImportResponse(BaseModel):
    plans: list[GymPricingPlanResponse]
    source_url: str
    persisted: bool
    is_default: bool = Field(
        default=False,
        description="True when no prices were detected and FitPlus default plans were used.",
    )
    note: str | None = Field(
        default=None,
        description="Optional hint (e.g. respect site terms / verify prices).",
    )


class CheckoutSessionRequest(BaseModel):
    gym_id: int = Field(ge=1)
    plan_index: int = Field(
        ge=0, description="Index in normalized pricing_plans list from GET /gyms/{id}/pricing"
    )


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str


class ConfirmCheckoutSessionRequest(BaseModel):
    """After Stripe redirects the customer, call this so the app can persist the subscription without a webhook (e.g. localhost dev)."""

    session_id: str = Field(..., min_length=8, description="Stripe Checkout Session id (cs_...)")


class ConfirmCheckoutSessionResponse(BaseModel):
    ok: bool = True


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
