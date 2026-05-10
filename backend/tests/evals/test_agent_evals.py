"""
Agent evaluation harness (CI-safe).

Loads declarative cases from `golden_cases.yaml`, mocks `llm_service.generate`,
and asserts persistence + response contracts. These are not live LLM quality
judges — they lock in integration behavior and prompt plumbing.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock

import pytest
import yaml
from app.models.conversation import Conversation
from httpx import AsyncClient
from sqlalchemy import select

_GOLDEN_PATH = Path(__file__).resolve().parent / "golden_cases.yaml"


def _load_cases() -> list[dict[str, Any]]:
    raw = yaml.safe_load(_GOLDEN_PATH.read_text(encoding="utf-8"))
    cases = raw.get("cases") if isinstance(raw, dict) else None
    if not isinstance(cases, list):
        raise RuntimeError("golden_cases.yaml must contain a top-level 'cases' list.")
    return cases


def pytest_generate_tests(metafunc: pytest.Metafunc) -> None:
    if "golden_case" in metafunc.fixturenames:
        cases = _load_cases()
        metafunc.parametrize(
            "golden_case",
            cases,
            ids=[str(c.get("id", f"case-{i}")) for i, c in enumerate(cases)],
        )


@pytest.fixture
def patched_llm_generate(golden_case: dict[str, Any], monkeypatch: pytest.MonkeyPatch) -> None:
    reply = golden_case.get("mock_assistant_reply", "")
    monkeypatch.setattr(
        "app.api.v1.ai.llm_service.generate",
        AsyncMock(return_value=reply.strip()),
    )


class TestGoldenAgentEvals:
    async def test_golden_chat_contract(
        self,
        patched_llm_generate: None,
        client: AsyncClient,
        auth_headers: dict,
        golden_case: dict[str, Any],
    ) -> None:
        agent = golden_case["agent"]
        message = golden_case["user_message"]
        path = f"/api/v1/ai/{agent}/chat"

        response = await client.post(path, headers=auth_headers, json={"message": message})
        assert response.status_code == 200, response.text
        body = response.json()

        needle = golden_case.get("response_must_contain")
        if needle:
            assert needle in body["response"]

        for fragment in golden_case.get("assistant_must_contain") or []:
            assert fragment in body["response"]

        conv_id = body["conversation_id"]

        history = await client.get(
            f"/api/v1/ai/conversations/{conv_id}/messages",
            headers=auth_headers,
        )
        assert history.status_code == 200
        msgs = history.json()
        assert msgs[-2]["role"] == "user"
        assert msgs[-2]["content"] == message
        assert msgs[-1]["role"] == "assistant"
        assert msgs[-1]["content"] == body["response"]

        title_needle = golden_case.get("list_conversations_title_contains")
        if title_needle:
            listed = await client.get("/api/v1/ai/conversations", headers=auth_headers)
            assert listed.status_code == 200
            titles = [c["title"].lower() for c in listed.json()]
            assert any(title_needle.lower() in t for t in titles)

    async def test_golden_db_agent_type_matches_route(
        self,
        patched_llm_generate: None,
        client: AsyncClient,
        auth_headers: dict,
        golden_case: dict[str, Any],
        db,
    ) -> None:
        agent = golden_case["agent"]
        message = golden_case["user_message"]

        response = await client.post(
            f"/api/v1/ai/{agent}/chat",
            headers=auth_headers,
            json={"message": message},
        )
        assert response.status_code == 200
        conv_id = response.json()["conversation_id"]

        row = await db.get(Conversation, conv_id)
        assert row is not None
        assert row.agent_type == agent

        result = await db.scalars(select(Conversation).where(Conversation.user_id == row.user_id))
        assert len(result.all()) >= 1
