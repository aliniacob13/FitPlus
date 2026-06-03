"""
Live LLM agent evaluations.

These tests make real API calls to Anthropic/OpenAI and are skipped automatically
when the API key is not set (e.g. in forks or local runs without credentials).
They run in CI only when ANTHROPIC_API_KEY (or OPENAI_API_KEY) is available as a
repository secret.

Checks are intentionally loose (keyword presence) so they don't break on minor
model output variation, but tight enough to catch prompt-plumbing regressions.
"""

from __future__ import annotations

import os

import pytest
from httpx import AsyncClient

_LIVE_LLM_REASON = (
    "ANTHROPIC_API_KEY and OPENAI_API_KEY are both unset — skipping live LLM eval"
)

_has_key = bool(os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY"))

pytestmark = pytest.mark.live_llm


def _skip_if_no_key() -> None:
    if not _has_key:
        pytest.skip(_LIVE_LLM_REASON)


# ---------------------------------------------------------------------------
# Workout agent
# ---------------------------------------------------------------------------


async def test_live_workout_agent_responds(client: AsyncClient, auth_headers: dict) -> None:
    _skip_if_no_key()

    response = await client.post(
        "/api/v1/ai/workout/chat",
        headers=auth_headers,
        json={"message": "Dă-mi 3 exerciții simple pentru încălzire."},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert "response" in body
    assert "conversation_id" in body

    reply = body["response"].lower()
    assert any(kw in reply for kw in ["exerciți", "încălzire", "mișcare", "warm", "exercise"]), (
        f"Workout agent reply missing expected keywords: {body['response'][:300]}"
    )


async def test_live_workout_agent_persists_conversation(
    client: AsyncClient, auth_headers: dict
) -> None:
    _skip_if_no_key()

    r1 = await client.post(
        "/api/v1/ai/workout/chat",
        headers=auth_headers,
        json={"message": "Am nevoie de un exercițiu pentru spate."},
    )
    assert r1.status_code == 200
    conv_id = r1.json()["conversation_id"]

    r2 = await client.post(
        "/api/v1/ai/workout/chat",
        headers=auth_headers,
        json={"message": "Câte seturi recomandai?", "conversation_id": conv_id},
    )
    assert r2.status_code == 200
    assert r2.json()["conversation_id"] == conv_id

    history = await client.get(
        f"/api/v1/ai/conversations/{conv_id}/messages",
        headers=auth_headers,
    )
    assert history.status_code == 200
    msgs = history.json()
    assert len(msgs) >= 4  # 2 user + 2 assistant turns


# ---------------------------------------------------------------------------
# Diet agent
# ---------------------------------------------------------------------------


async def test_live_diet_agent_responds(client: AsyncClient, auth_headers: dict) -> None:
    _skip_if_no_key()

    response = await client.post(
        "/api/v1/ai/diet/chat",
        headers=auth_headers,
        json={"message": "Ce pot mânca la micul dejun bogat în proteine?"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    reply = body["response"].lower()
    assert any(kw in reply for kw in ["proteină", "proteine", "protein", "ouă", "ou", "egg"]), (
        f"Diet agent reply missing expected keywords: {body['response'][:300]}"
    )


async def test_live_diet_agent_conversation_listed(
    client: AsyncClient, auth_headers: dict
) -> None:
    _skip_if_no_key()

    r = await client.post(
        "/api/v1/ai/diet/chat",
        headers=auth_headers,
        json={"message": "Sugerează-mi un meniu pentru o zi cu 2000 kcal."},
    )
    assert r.status_code == 200
    conv_id = r.json()["conversation_id"]

    listed = await client.get("/api/v1/ai/conversations", headers=auth_headers)
    assert listed.status_code == 200
    ids = [c["id"] for c in listed.json()]
    assert conv_id in ids
