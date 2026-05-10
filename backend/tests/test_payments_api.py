"""Stripe routes: configuration guards and mocked Stripe SDK."""

from __future__ import annotations

import time
from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient

from sqlalchemy import select

from app.models.gym import Gym
from app.models.subscription import Subscription
from app.models.user import User


class TestPaymentsUnavailable:
    async def test_checkout_without_stripe_key_returns_503(self, client: AsyncClient, auth_headers: dict) -> None:
        response = await client.post(
            "/api/v1/payments/checkout",
            headers=auth_headers,
            json={"gym_id": 1, "plan_index": 0},
        )
        assert response.status_code == 503
        assert "stripe" in response.json()["detail"].lower()

    async def test_confirm_without_stripe_key_returns_503(self, client: AsyncClient, auth_headers: dict) -> None:
        response = await client.post(
            "/api/v1/payments/checkout/confirm-session",
            headers=auth_headers,
            json={"session_id": "cs_test_any"},
        )
        assert response.status_code == 503


class TestPaymentsCheckoutMocked:
    async def test_checkout_returns_session_when_stripe_create_succeeds(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr("app.api.v1.payments._stripe_enabled", lambda: True)

        fake_session = MagicMock()
        fake_session.id = "cs_test_fitplus"
        fake_session.url = "https://checkout.stripe.test/session/cs_test_fitplus"

        monkeypatch.setattr("stripe.checkout.Session.create", lambda **kwargs: fake_session)

        response = await client.post(
            "/api/v1/payments/checkout",
            headers=auth_headers,
            json={"gym_id": test_gym.id, "plan_index": 0},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["session_id"] == "cs_test_fitplus"
        assert body["checkout_url"].startswith("https://")


class TestPaymentsConfirmMocked:
    async def test_confirm_paid_session_creates_subscription_row(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        test_gym: Gym,
        db,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr("app.api.v1.payments._stripe_enabled", lambda: True)

        cpe = int(time.time()) + 86_400

        def fake_retrieve(_sid: str) -> MagicMock:
            m = MagicMock()
            m.mode = "subscription"
            m.metadata = {
                "user_id": str(test_user.id),
                "gym_id": str(test_gym.id),
                "plan_name": "Basic (demo)",
            }
            m.payment_status = "paid"
            m.id = "cs_confirm_test"
            m.subscription = "sub_test_1"
            m.amount_total = 9900
            m.currency = "ron"
            m.payment_intent = None
            return m

        monkeypatch.setattr("stripe.checkout.Session.retrieve", fake_retrieve)
        monkeypatch.setattr(
            "stripe.Subscription.retrieve",
            lambda _sub_id: {"current_period_end": cpe},
        )

        response = await client.post(
            "/api/v1/payments/checkout/confirm-session",
            headers=auth_headers,
            json={"session_id": "cs_confirm_test"},
        )
        assert response.status_code == 200
        assert response.json()["ok"] is True

        rows = (
            await db.scalars(
                select(Subscription)
                .where(
                    Subscription.user_id == test_user.id,
                    Subscription.gym_id == test_gym.id,
                )
                .order_by(Subscription.id.asc()),
            )
        ).all()
        assert len(rows) >= 1
        assert rows[-1].stripe_checkout_session_id == "cs_confirm_test"


class TestStripeWebhookGuards:
    async def test_webhook_without_secret_returns_503(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/payments/webhook",
            content=b"{}",
            headers={"stripe-signature": "v1,x"},
        )
        assert response.status_code == 503
