"""Unit tests for gym_pricing_import helpers (no network, no LLM)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from app.services.gym_pricing_import import (
    GymPricingImportError,
    parse_llm_json_plans,
    suggest_plans_from_page_text,
)


def test_parse_llm_json_plans_plain_array() -> None:
    raw = '[{"name":"Basic","price_ron":199,"period":"month","features":[]}]'
    result = parse_llm_json_plans(raw)
    assert len(result) == 1
    assert result[0]["price_ron"] == 199


def test_parse_llm_json_plans_markdown_fence() -> None:
    raw = '```json\n[{"name":"X","price_eur":49.99,"period":"month","features":[]}]\n```'
    result = parse_llm_json_plans(raw)
    assert result[0]["price_eur"] == 49.99


def test_parse_llm_json_plans_bracket_fallback() -> None:
    """Bracket extraction handles LLM adding a leading sentence."""
    raw = 'Here are the plans: [{"name":"A","price_ron":99,"period":"month","features":[]}]'
    result = parse_llm_json_plans(raw)
    assert result[0]["name"] == "A"


def test_parse_llm_json_plans_invalid_raises() -> None:
    with pytest.raises(GymPricingImportError):
        parse_llm_json_plans("Sorry, I cannot find any prices on this page.")


@pytest.mark.asyncio
async def test_suggest_plans_llm_prose_falls_to_heuristic() -> None:
    """When LLM returns prose (not JSON), heuristic must be tried before giving up."""
    page_text = "Abonamente fitness club\n199 lei lunar Basic\n299 lei lunar Premium\n"

    mock_llm = AsyncMock()
    mock_llm.generate = AsyncMock(
        return_value="I'm sorry, I could not find any pricing information in the text."
    )

    with patch("app.services.gym_pricing_import.LLMService", return_value=mock_llm):
        result = await suggest_plans_from_page_text(
            page_text=page_text, source_url="https://example.com"
        )

    assert result, "heuristic should have found prices when LLM returned prose"
    amounts = sorted(p["amount_cents"] for p in result)
    assert 19900 in amounts
    assert 29900 in amounts


@pytest.mark.asyncio
async def test_suggest_plans_llm_empty_array_returns_empty() -> None:
    """LLM returning [] means no prices on page — result should be empty."""
    page_text = "Welcome to our club. Visit us at str. Exemplu 5."

    mock_llm = AsyncMock()
    mock_llm.generate = AsyncMock(return_value="[]")

    with patch("app.services.gym_pricing_import.LLMService", return_value=mock_llm):
        result = await suggest_plans_from_page_text(
            page_text=page_text, source_url="https://example.com"
        )

    assert result == []
