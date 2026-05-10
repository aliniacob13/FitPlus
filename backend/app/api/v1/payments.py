"""Stripe Checkout + webhook — subscriptions & payment rows."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from typing import Any

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.users import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.gym import Gym
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.payments import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    ConfirmCheckoutSessionRequest,
    ConfirmCheckoutSessionResponse,
)
from app.services.pricing_plans import effective_pricing_plans

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

stripe.api_key = settings.STRIPE_SECRET_KEY or None


def _stripe_enabled() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


def _stripe_obj_id(val: object | None) -> str | None:
    if val is None:
        return None
    if isinstance(val, str):
        return val
    sid = getattr(val, "id", None)
    return str(sid) if sid else None


def _checkout_session_as_handler_dict(sess: object) -> dict[str, Any]:
    """Shape expected by _handle_checkout_session_completed (Stripe webhook payload subset)."""
    meta_raw = getattr(sess, "metadata", None) or {}
    if hasattr(meta_raw, "to_dict"):
        meta = meta_raw.to_dict()
    elif isinstance(meta_raw, dict):
        meta = dict(meta_raw)
    else:
        try:
            meta = dict(meta_raw)
        except (TypeError, ValueError):
            meta = {}

    return {
        "id": getattr(sess, "id", None),
        "metadata": meta,
        "subscription": _stripe_obj_id(getattr(sess, "subscription", None)),
        "amount_total": getattr(sess, "amount_total", None),
        "currency": getattr(sess, "currency", None),
        "payment_intent": _stripe_obj_id(getattr(sess, "payment_intent", None)),
        "payment_status": getattr(sess, "payment_status", None),
    }


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

    plans = effective_pricing_plans(
        gym.pricing_plans,
        fallback=settings.subscription_pricing_fallback_enabled,
    )
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
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Stripe returned no checkout URL."
        )

    return CheckoutSessionResponse(checkout_url=url, session_id=sid)


@router.post("/checkout/confirm-session", response_model=ConfirmCheckoutSessionResponse)
async def confirm_checkout_session(
    body: ConfirmCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConfirmCheckoutSessionResponse:
    """
    Persist subscription after Checkout completes. Use when Stripe webhooks cannot reach your server
    (typical local dev). Safe to call twice (idempotent on checkout session id).
    """
    if not _stripe_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured (STRIPE_SECRET_KEY).",
        )

    try:
        sess = await asyncio.to_thread(stripe.checkout.Session.retrieve, body.session_id)
    except stripe.error.InvalidRequestError as e:
        logger.info("confirm-session: session not found: %s", e)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Checkout session not found."
        ) from e
    except stripe.error.StripeError as e:
        logger.warning("confirm-session: Stripe error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=getattr(e, "user_message", None) or str(e),
        ) from e

    if getattr(sess, "mode", None) != "subscription":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Checkout session is not in subscription mode.",
        )

    payload = _checkout_session_as_handler_dict(sess)
    meta = payload.get("metadata") or {}
    if str(meta.get("user_id", "")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This checkout session does not belong to the current user.",
        )

    if payload.get("payment_status") != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not completed yet.",
        )

    try:
        await _handle_checkout_session_completed(db, payload)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.info("confirm-session: duplicate / race (IntegrityError), treating as ok.")

    return ConfirmCheckoutSessionResponse(ok=True)


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
) -> dict[str, str]:
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook secret not configured."
        )

    payload = await request.body()
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe-Signature header."
        )

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload."
        ) from e
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature."
        ) from e

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook processing failed."
        )

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
    row = await db.scalar(
        select(Subscription).where(Subscription.stripe_subscription_id == str(stripe_sub_id))
    )
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
    row = await db.scalar(
        select(Subscription).where(Subscription.stripe_subscription_id == str(stripe_sub_id))
    )
    if row:
        row.status = "canceled"
