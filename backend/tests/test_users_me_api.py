"""Tests for authenticated user profile endpoints."""

from __future__ import annotations

from app.models.user import User
from httpx import AsyncClient


class TestUsersMe:
    async def test_get_me_requires_auth(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401

    async def test_get_me_returns_profile(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ) -> None:
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == test_user.email
        assert body["name"] == test_user.name

    async def test_put_me_updates_name(
        self, client: AsyncClient, auth_headers: dict, test_user: User
    ) -> None:
        response = await client.put(
            "/api/v1/users/me",
            headers=auth_headers,
            json={"name": "Updated Tester"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Tester"
