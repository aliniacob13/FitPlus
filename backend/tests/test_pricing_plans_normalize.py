"""pricing_plans normalization edge cases (strings, Romanian hints)."""

from app.services.pricing_plans import normalize_pricing_plans


def test_normalize_price_ron_from_string_with_currency() -> None:
    raw = [{"name": "Basic", "price_ron": "199 lei", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 19900
    assert out[0]["currency"] == "ron"


def test_normalize_price_ron_comma_decimal() -> None:
    raw = [{"name": "Pro", "price_ron": "249,50 RON", "period": "lunar", "features": []}]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 24950
    assert out[0]["currency"] == "ron"


def test_normalize_empty_when_price_unparseable() -> None:
    raw = [{"name": "X", "price_ron": "gratis", "period": "month", "features": []}]
    assert normalize_pricing_plans(raw) == []


def test_normalize_price_eur() -> None:
    raw = [{"name": "Gold", "price_eur": "49,99 EUR", "period": "month", "features": ["Pool"]}]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 4999
    assert out[0]["currency"] == "eur"


def test_normalize_round_trip_amount_cents_eur() -> None:
    raw = [
        {
            "name": "Gold",
            "amount_cents": 4500,
            "currency": "eur",
            "period": "month",
            "features": [],
        }
    ]
    out = normalize_pricing_plans(raw)
    assert out[0]["amount_cents"] == 4500
    assert out[0]["currency"] == "eur"
