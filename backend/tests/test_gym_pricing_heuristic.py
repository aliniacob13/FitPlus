"""Heuristic pricing extraction when LLM JSON does not normalize."""

from app.services.gym_pricing_heuristic import _heuristic_plans_from_plain_text
from app.services.pricing_plans import normalize_pricing_plans


def test_heuristic_finds_lei_near_abonament() -> None:
    text = (
        "ABONAMENTE fitness\n"
        "Pentru membri activi doar 199 LEI pe luna\n"
        "249,50 Ron lunar pentru premium\n"
    )
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    amounts = sorted(p["amount_cents"] for p in out)
    assert 19900 in amounts
    assert 24950 in amounts


def test_heuristic_finds_glued_euro() -> None:
    text = "Abonamente sala — pret lunar Flexible59€ pentru membri\n"
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    assert any(p["currency"] == "eur" and p["amount_cents"] == 5900 for p in out)


def test_heuristic_currency_before_amount() -> None:
    text = "Abonamente fitness club\nRON 199 lunar\nEUR 49,00 pentru membru\n"
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    assert any(p["currency"] == "ron" and p["amount_cents"] == 19900 for p in out)
    assert any(p["currency"] == "eur" and p["amount_cents"] == 4900 for p in out)


def test_heuristic_glued_lei() -> None:
    text = "Tarife gym: doar 299lei/luna pentru acces full\n"
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    assert any(p["currency"] == "ron" and p["amount_cents"] == 29900 for p in out)


def test_heuristic_keyword_far_from_price() -> None:
    """Keyword 'Tarife' is ~200 chars before the price — expanded window must catch it."""
    filler = "Alegerea noastra pentru tine.\n\nDescoperiti beneficiile unui abonament.\n\n"
    tarife_header = "Tarife\n\n"
    plan_block = "A" * 150 + "\n199 lei\n"
    text = filler + tarife_header + plan_block
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    assert any(p["currency"] == "ron" and p["amount_cents"] == 19900 for p in out)


def test_heuristic_stayfit_bold_markdown_style() -> None:
    """**189ron** markdown-bold style from CMS pages must be parsed."""
    text = (
        "Abonamente\n"
        "### Super Active\n"
        "**189ron**\n"
        "abonament lunar plata card\n"
        "### Plus\n"
        "**265ron**\n"
    )
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    amounts = sorted(p["amount_cents"] for p in out)
    assert 18900 in amounts
    assert 26500 in amounts


def test_heuristic_eur_spaced_suffix() -> None:
    """49 EUR / luna near 'abonament' must be extracted."""
    text = "Abonamente club fitness\n49 EUR / luna Bronze\n79 EUR / luna Silver\n"
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    assert any(p["currency"] == "eur" and p["amount_cents"] == 4900 for p in out)
    assert any(p["currency"] == "eur" and p["amount_cents"] == 7900 for p in out)
