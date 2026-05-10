"""Lightweight gym listing/detail tests (no external Places calls)."""

from __future__ import annotations

from app.models.gym import Gym
from httpx import AsyncClient


class TestGymDetailAndPricing:
    async def test_get_gym_by_id(self, client: AsyncClient, test_gym: Gym) -> None:
        response = await client.get(f"/api/v1/gyms/{test_gym.id}")
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == test_gym.id
        assert body["name"] == test_gym.name

    async def test_get_gym_unknown_returns_404(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/gyms/99999999")
        assert response.status_code == 404

    async def test_pricing_endpoint_returns_list(self, client: AsyncClient, test_gym: Gym) -> None:
        response = await client.get(f"/api/v1/gyms/{test_gym.id}/pricing")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
