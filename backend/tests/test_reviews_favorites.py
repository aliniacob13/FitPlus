"""
Integration tests for the Reviews & Favorites feature.

Each test runs against the real PostgreSQL database but inside a transaction
that is rolled back automatically by the `db` fixture in conftest.py.
"""
import pytest
from httpx import AsyncClient

from app.models.gym import Gym
from app.models.user import User


class TestReviews:
    async def test_add_review_success_returns_201(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 5, "comment": "Excellent gym!"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        body = response.json()
        assert body["rating"] == 5
        assert body["comment"] == "Excellent gym!"
        assert body["gym_id"] == test_gym.id

    async def test_add_review_without_comment(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 3},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["comment"] is None

    async def test_add_review_invalid_rating_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 6},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_add_review_duplicate_returns_409(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 4, "comment": "First review"},
            headers=auth_headers,
        )
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 2, "comment": "Duplicate attempt"},
            headers=auth_headers,
        )
        assert response.status_code == 409
        assert "already reviewed" in response.json()["detail"].lower()

    async def test_add_review_unauthenticated_returns_401(
        self,
        client: AsyncClient,
        test_gym: Gym,
    ) -> None:
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 5},
        )
        assert response.status_code == 401

    async def test_add_review_nonexistent_gym_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        response = await client.post(
            "/api/v1/gyms/999999/reviews",
            json={"rating": 5},
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_reviews_returns_list(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 4, "comment": "Good"},
            headers=auth_headers,
        )
        await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 2, "comment": "Meh"},
            headers=second_auth_headers,
        )

        response = await client.get(f"/api/v1/gyms/{test_gym.id}/reviews")
        assert response.status_code == 200
        reviews = response.json()
        assert isinstance(reviews, list)
        assert len(reviews) == 2
        ratings = {r["rating"] for r in reviews}
        assert ratings == {4, 2}

    async def test_gym_detail_includes_reviews_and_average_rating(
        self,
        client: AsyncClient,
        auth_headers: dict,
        second_auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 4},
            headers=auth_headers,
        )
        await client.post(
            f"/api/v1/gyms/{test_gym.id}/reviews",
            json={"rating": 2},
            headers=second_auth_headers,
        )

        response = await client.get(f"/api/v1/gyms/{test_gym.id}")
        assert response.status_code == 200
        body = response.json()
        assert body["average_rating"] == pytest.approx(3.0)
        assert len(body["reviews"]) == 2

    async def test_gym_detail_no_reviews_average_is_none(
        self,
        client: AsyncClient,
        test_gym: Gym,
    ) -> None:
        response = await client.get(f"/api/v1/gyms/{test_gym.id}")
        assert response.status_code == 200
        assert response.json()["average_rating"] is None
        assert response.json()["reviews"] == []


class TestFavorites:
    async def test_toggle_favorite_adds_gym(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/favorite",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_favorited"] is True

    async def test_toggle_favorite_removes_gym_on_second_call(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(f"/api/v1/gyms/{test_gym.id}/favorite", headers=auth_headers)

        response = await client.post(
            f"/api/v1/gyms/{test_gym.id}/favorite",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_favorited"] is False

    async def test_toggle_favorite_flips_state_repeatedly(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        for expected in [True, False, True]:
            r = await client.post(
                f"/api/v1/gyms/{test_gym.id}/favorite",
                headers=auth_headers,
            )
            assert r.json()["is_favorited"] is expected

    async def test_toggle_favorite_unauthenticated_returns_401(
        self,
        client: AsyncClient,
        test_gym: Gym,
    ) -> None:
        response = await client.post(f"/api/v1/gyms/{test_gym.id}/favorite")
        assert response.status_code == 401

    async def test_toggle_favorite_nonexistent_gym_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        response = await client.post(
            "/api/v1/gyms/999999/favorite",
            headers=auth_headers,
        )
        assert response.status_code == 404

    async def test_get_my_favorites_returns_favorited_gyms(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(f"/api/v1/gyms/{test_gym.id}/favorite", headers=auth_headers)

        response = await client.get("/api/v1/users/me/favorites", headers=auth_headers)
        assert response.status_code == 200
        favorites = response.json()
        assert isinstance(favorites, list)
        assert any(f["gym_id"] == test_gym.id for f in favorites)

    async def test_get_my_favorites_empty_when_none(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        response = await client.get("/api/v1/users/me/favorites", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    async def test_gym_detail_is_favorited_reflects_state(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        detail = await client.get(f"/api/v1/gyms/{test_gym.id}", headers=auth_headers)
        assert detail.json()["is_favorited"] is False

        await client.post(f"/api/v1/gyms/{test_gym.id}/favorite", headers=auth_headers)

        detail = await client.get(f"/api/v1/gyms/{test_gym.id}", headers=auth_headers)
        assert detail.json()["is_favorited"] is True

        await client.post(f"/api/v1/gyms/{test_gym.id}/favorite", headers=auth_headers)

        detail = await client.get(f"/api/v1/gyms/{test_gym.id}", headers=auth_headers)
        assert detail.json()["is_favorited"] is False

    async def test_gym_detail_is_favorited_false_when_unauthenticated(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_gym: Gym,
    ) -> None:
        await client.post(f"/api/v1/gyms/{test_gym.id}/favorite", headers=auth_headers)

        detail = await client.get(f"/api/v1/gyms/{test_gym.id}")
        assert detail.json()["is_favorited"] is False
