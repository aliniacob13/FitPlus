"""HTTP integration tests for `/api/v1/auth/*`."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.models.user import User


class TestAuthRegister:
    async def test_register_returns_tokens(self, client: AsyncClient) -> None:
        email = f"register_{uuid.uuid4().hex[:12]}@fitplus.test"
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "SecurePass123!"},
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body and "refresh_token" in body
        assert len(body["access_token"]) > 20

    async def test_register_duplicate_email_returns_409(self, client: AsyncClient, test_user: User) -> None:
        response = await client.post(
            "/api/v1/auth/register",
            json={"email": test_user.email, "password": "AnotherPass123!"},
        )
        assert response.status_code == 409
        assert "already" in response.json()["detail"].lower()


class TestAuthLogin:
    async def test_login_success(self, client: AsyncClient, test_user: User) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "TestPass123!"},
        )
        assert response.status_code == 200
        assert response.json()["access_token"]

    async def test_login_wrong_password_returns_401(self, client: AsyncClient, test_user: User) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "WrongPassword!!!"},
        )
        assert response.status_code == 401


class TestAuthRefresh:
    async def test_refresh_returns_new_access_token(self, client: AsyncClient, test_user: User) -> None:
        login = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "TestPass123!"},
        )
        refresh_token = login.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        assert response.json()["access_token"]

    async def test_refresh_invalid_token_returns_401(self, client: AsyncClient) -> None:
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "not-a-valid-jwt"},
        )
        assert response.status_code == 401


@pytest.mark.parametrize(
    "payload",
    [
        pytest.param({"email": "not-an-email", "password": "x"}, id="bad-email"),
        pytest.param({"email": "a@b.co", "password": "short"}, id="weak-password-schema"),
    ],
)
async def test_register_validation_errors(client: AsyncClient, payload: dict) -> None:
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
