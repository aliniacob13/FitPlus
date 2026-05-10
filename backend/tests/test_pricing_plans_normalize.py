"""pricing_plans normalization edge cases (strings, Romanian hints)."""

from app.services.pricing_plans import normalize_pricing_plans


def test_normalize_price_ron_from_string_with_currency() -> None:
    raw = [{"name": "Basic", "price_ron": "199 lei", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 19900


def test_normalize_price_ron_comma_decimal() -> None:
    raw = [{"name": "Pro", "price_ron": "249,50 RON", "period": "lunar", "features": []}]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 24950


def test_normalize_empty_when_price_unparseable() -> None:
    raw = [{"name": "X", "price_ron": "gratis", "period": "month", "features": []}]
    assert normalize_pricing_plans(raw) == []
