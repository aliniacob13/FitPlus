"""Unit tests for gym_pricing_import helpers (no network, no LLM)."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from app.services.gym_pricing_import import (
    _DEFAULT_FITPLUS_PLANS,
    GymPricingImportError,
    import_plans_from_url,
    parse_llm_json_plans,
    suggest_plans_from_page_text,
)
from app.services.pricing_plans import normalize_pricing_plans


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


# ── Default FitPlus fallback ──────────────────────────────────────────────────


def test_default_fitplus_plans_normalize_correctly() -> None:
    """Default plans must pass through normalize_pricing_plans without errors."""
    result = normalize_pricing_plans(_DEFAULT_FITPLUS_PLANS)
    assert len(result) == 2
    names = {p["name"] for p in result}
    assert "Day Pass" in names
    assert "Monthly Standard" in names
    assert all(p["amount_cents"] > 0 for p in result)
    assert all(p["currency"] == "ron" for p in result)
    periods = {p["period"] for p in result}
    assert "day" in periods
    assert "month" in periods


@pytest.mark.asyncio
async def test_import_plans_returns_default_when_no_prices_found() -> None:
    """When LLM + heuristic both yield nothing, import_plans_from_url returns default plans."""
    with (
        patch(
            "app.services.gym_pricing_import._collect_merged_page_text",
            new=AsyncMock(
                return_value=("Bine ati venit la clubul nostru.", ["https://example.com/"])
            ),
        ),
        patch(
            "app.services.gym_pricing_import.suggest_plans_from_page_text",
            new=AsyncMock(return_value=[]),
        ),
    ):
        normalized, storage, is_default = await import_plans_from_url("https://example.com/")

    assert is_default is True
    assert len(normalized) >= 2
    assert all(p["amount_cents"] > 0 for p in normalized)
    names = {p["name"] for p in normalized}
    assert "Day Pass" in names
    assert "Monthly Standard" in names


@pytest.mark.asyncio
async def test_import_plans_is_default_false_when_prices_found() -> None:
    """When extraction succeeds, is_default must be False."""
    real_plan = {
        "key": "plan_0",
        "name": "Basic",
        "amount_cents": 19900,
        "currency": "ron",
        "period": "month",
        "period_days": 30,
        "features": [],
    }
    with (
        patch(
            "app.services.gym_pricing_import._collect_merged_page_text",
            new=AsyncMock(return_value=("199 lei abonament lunar.", ["https://example.com/"])),
        ),
        patch(
            "app.services.gym_pricing_import.suggest_plans_from_page_text",
            new=AsyncMock(return_value=[real_plan]),
        ),
    ):
        normalized, storage, is_default = await import_plans_from_url("https://example.com/")

    assert is_default is False
    assert normalized[0]["amount_cents"] == 19900
