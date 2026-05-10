"""Stripe Checkout + webhook — subscriptions & payment rows."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.api.v1.users import get_current_user
from app.models.gym import Gym
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.payments import CheckoutSessionRequest, CheckoutSessionResponse
from app.services.pricing_plans import normalize_pricing_plans

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY or None


def _stripe_enabled() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    body: CheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutSessionResponse:
    if not _stripe_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured (STRIPE_SECRET_KEY).",
        )

    gym = await db.get(Gym, body.gym_id)
    if not gym:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gym not found.")

    plans = normalize_pricing_plans(gym.pricing_plans)
    if not plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This gym has no pricing plans configured.",
        )
    if body.plan_index >= len(plans):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_index for this gym.",
        )

    plan = plans[body.plan_index]
    amount_cents = int(plan["amount_cents"])
    currency = str(plan["currency"])
    plan_name = str(plan["name"])

    success_url = settings.STRIPE_CHECKOUT_SUCCESS_URL.strip()
    cancel_url = settings.STRIPE_CHECKOUT_CANCEL_URL.strip()
    if not success_url or not cancel_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe redirect URLs are not configured.",
        )

    metadata = {
        "user_id": str(current_user.id),
        "gym_id": str(gym.id),
        "plan_name": plan_name,
        "plan_index": str(body.plan_index),
    }

    def _create_session() -> stripe.checkout.Session:
        return stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer_email=current_user.email,
            client_reference_id=str(current_user.id),
            line_items=[
                {
                    "price_data": {
                        "currency": currency,
                        "product_data": {
                            "name": f"{gym.name} — {plan_name}",
                            "metadata": {"gym_id": str(gym.id)},
                        },
                        "unit_amount": amount_cents,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
            subscription_data={
                "metadata": {
                    "user_id": str(current_user.id),
                    "gym_id": str(gym.id),
                    "plan_name": plan_name,
                }
            },
        )

    try:
        session = await asyncio.to_thread(_create_session)
    except stripe.error.StripeError as e:
        logger.warning("Stripe checkout failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=getattr(e, "user_message", None) or str(e),
        ) from e

    url = session.url
    sid = session.id
    if not url or not sid:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe returned no checkout URL.")

    return CheckoutSessionResponse(checkout_url=url, session_id=sid)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
) -> dict[str, str]:
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook secret not configured.")

    payload = await request.body()
    if not stripe_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe-Signature header.")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload.") from e
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature.") from e

    etype = event["type"]

    try:
        if etype == "checkout.session.completed":
            await _handle_checkout_session_completed(db, event["data"]["object"])
        elif etype == "customer.subscription.updated":
            await _handle_subscription_updated(db, event["data"]["object"])
        elif etype == "customer.subscription.deleted":
            await _handle_subscription_deleted(db, event["data"]["object"])
        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.info("Webhook idempotent skip / duplicate (IntegrityError).")
    except Exception:
        await db.rollback()
        logger.exception("Stripe webhook handler failed")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook processing failed.")

    return {"status": "ok"}


async def _handle_checkout_session_completed(db: AsyncSession, session: dict) -> None:
    meta = session.get("metadata") or {}
    try:
        user_id = int(meta.get("user_id", 0))
        gym_id = int(meta.get("gym_id", 0))
    except (TypeError, ValueError):
        user_id, gym_id = 0, 0

    plan_name = str(meta.get("plan_name") or "Membership")
    session_id = session.get("id")
    stripe_sub_id = session.get("subscription")

    if not user_id or not gym_id or not session_id:
        logger.warning("checkout.session.completed missing metadata: %s", meta)
        return

    existing = await db.scalar(
        select(Subscription).where(Subscription.stripe_checkout_session_id == session_id)
    )
    if existing:
        return

    started_at = datetime.now(UTC)
    expires_at: datetime | None = None
    if stripe_sub_id:
        try:
            sub_obj = await asyncio.to_thread(stripe.Subscription.retrieve, stripe_sub_id)
            cpe = sub_obj["current_period_end"]
            if cpe:
                expires_at = datetime.fromtimestamp(int(cpe), tz=UTC)
        except (stripe.error.StripeError, KeyError, TypeError):
            expires_at = started_at

    row = Subscription(
        user_id=user_id,
        gym_id=gym_id,
        plan_name=plan_name,
        status="active",
        stripe_subscription_id=str(stripe_sub_id) if stripe_sub_id else None,
        stripe_checkout_session_id=str(session_id),
        started_at=started_at,
        expires_at=expires_at,
    )
    db.add(row)
    await db.flush()

    amount_total = session.get("amount_total")
    currency = (session.get("currency") or "ron").lower()
    pi = session.get("payment_intent")
    pi_id = str(pi) if isinstance(pi, str) else None

    pay = Payment(
        user_id=user_id,
        gym_id=gym_id,
        subscription_id=row.id,
        amount=int(amount_total or 0),
        currency=str(currency)[:3],
        stripe_payment_intent_id=pi_id,
        stripe_checkout_session_id=str(session_id),
        status="succeeded" if session.get("payment_status") == "paid" else "pending",
    )
    db.add(pay)


async def _handle_subscription_updated(db: AsyncSession, sub: dict) -> None:
    stripe_sub_id = sub.get("id")
    if not stripe_sub_id:
        return
    row = await db.scalar(select(Subscription).where(Subscription.stripe_subscription_id == str(stripe_sub_id)))
    if not row:
        return

    st = sub.get("status") or row.status
    row.status = str(st)

    cpe = sub.get("current_period_end")
    if cpe:
        row.expires_at = datetime.fromtimestamp(int(cpe), tz=UTC)


async def _handle_subscription_deleted(db: AsyncSession, sub: dict) -> None:
    stripe_sub_id = sub.get("id")
    if not stripe_sub_id:
        return
    row = await db.scalar(select(Subscription).where(Subscription.stripe_subscription_id == str(stripe_sub_id)))
    if row:
        row.status = "canceled"
