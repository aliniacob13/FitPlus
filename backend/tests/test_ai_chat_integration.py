"""End-to-end AI chat routes against the test DB (LLM mocked or fallback)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


class TestWorkoutChatJson:
    async def test_workout_chat_fallback_without_api_key(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        response = await client.post(
            "/api/v1/ai/workout/chat",
            headers=auth_headers,
            json={"message": "Salut, vreau cardio"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "Salut, vreau cardio" in data["response"]

    async def test_workout_chat_with_mock_llm_persists_turns(
        self,
        client: AsyncClient,
        auth_headers: dict,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr(
            "app.api.v1.ai.llm_service.generate",
            AsyncMock(return_value="Răspuns mock antrenor."),
        )

        response = await client.post(
            "/api/v1/ai/workout/chat",
            headers=auth_headers,
            json={"message": "Întrebare despre gantere"},
        )
        assert response.status_code == 200
        conv_id = response.json()["conversation_id"]
        assert response.json()["response"] == "Răspuns mock antrenor."

        msgs = await client.get(
            f"/api/v1/ai/conversations/{conv_id}/messages",
            headers=auth_headers,
        )
        assert msgs.status_code == 200
        roles = [m["role"] for m in msgs.json()]
        assert roles == ["user", "assistant"]
        assert msgs.json()[1]["content"] == "Răspuns mock antrenor."


class TestDietChatJson:
    async def test_diet_chat_reuses_conversation_when_id_sent(
        self,
        client: AsyncClient,
        auth_headers: dict,
        db,
        test_user: User,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr(
            "app.api.v1.ai.llm_service.generate",
            AsyncMock(side_effect=["Prima.", "A doua."]),
        )

        first = await client.post(
            "/api/v1/ai/diet/chat",
            headers=auth_headers,
            json={"message": "Ce mănânc la mic dejun?"},
        )
        assert first.status_code == 200
        cid = first.json()["conversation_id"]

        second = await client.post(
            "/api/v1/ai/diet/chat",
            headers=auth_headers,
            json={"message": "Și la prânz?", "conversation_id": cid},
        )
        assert second.status_code == 200
        assert second.json()["conversation_id"] == cid

        result = await db.scalars(
            select(Message).where(Message.conversation_id == cid).order_by(Message.id.asc()),
        )
        messages = result.all()
        assert len(messages) == 4
        assert [m.role for m in messages] == ["user", "assistant", "user", "assistant"]


class TestConversationGuards:
    async def test_chat_with_wrong_agent_conversation_returns_400(
        self,
        client: AsyncClient,
        auth_headers: dict,
        test_user: User,
        db,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setattr(
            "app.api.v1.ai.llm_service.generate",
            AsyncMock(return_value="ok"),
        )
        conv = Conversation(user_id=test_user.id, agent_type="diet", title="Diet thread")
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

        response = await client.post(
            "/api/v1/ai/workout/chat",
            headers=auth_headers,
            json={"message": "Salut", "conversation_id": conv.id},
        )
        assert response.status_code == 400
        assert "workout" in response.json()["detail"].lower() or "agent" in response.json()["detail"].lower()

    async def test_messages_for_other_users_conversation_returns_404(
        self,
        client: AsyncClient,
        second_auth_headers: dict,
        test_user: User,
        db,
    ) -> None:
        conv = Conversation(user_id=test_user.id, agent_type="workout", title="Private")
        db.add(conv)
        await db.commit()
        await db.refresh(conv)

        response = await client.get(
            f"/api/v1/ai/conversations/{conv.id}/messages",
            headers=second_auth_headers,
        )
        assert response.status_code == 404


class TestWorkoutChatStream:
    async def test_stream_completes_with_meta_and_done(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ) -> None:
        collected = []
        async with client.stream(
            "GET",
            "/api/v1/ai/workout/chat/stream",
            params={"message": "stream test"},
            headers=auth_headers,
            timeout=30.0,
        ) as response:
            assert response.status_code == 200
            async for line in response.aiter_lines():
                if line.startswith("event:"):
                    collected.append(line.split(":", 1)[1].strip())
                elif line.startswith("data:"):
                    collected.append(line.split(":", 1)[1].strip())

        assert "chunk" in collected
        assert "meta" in collected
        assert "done" in collected
