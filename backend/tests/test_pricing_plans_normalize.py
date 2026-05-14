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


def test_normalize_price_and_currency_strings() -> None:
    raw = [
        {
            "name": "Gold",
            "price": "49,99",
            "currency": "EUR",
            "period": "month",
            "features": [],
        }
    ]
    out = normalize_pricing_plans(raw)
    assert len(out) == 1
    assert out[0]["amount_cents"] == 4999
    assert out[0]["currency"] == "eur"


def test_normalize_price_ron_as_plain_string() -> None:
    raw = [{"name": "Basic", "price_ron": "199,50", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert out[0]["amount_cents"] == 19950
    assert out[0]["currency"] == "ron"


def test_normalize_eur_49_99_string() -> None:
    raw = [{"name": "Silver", "price_eur": "49,99", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert out[0]["amount_cents"] == 4999
    assert out[0]["currency"] == "eur"


def test_normalize_price_currency_eur_synonym() -> None:
    """'€' in currency field must be resolved to 'eur'."""
    raw = [{"name": "Gold", "price": "59", "currency": "€", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert out[0]["currency"] == "eur"
    assert out[0]["amount_cents"] == 5900


def test_normalize_ron_price_string_with_ron_suffix() -> None:
    """'249,50 Ron' as price_ron string (comma decimal, currency suffix)."""
    raw = [{"name": "Pro", "price_ron": "249,50 Ron", "period": "month", "features": []}]
    out = normalize_pricing_plans(raw)
    assert out[0]["amount_cents"] == 24950
    assert out[0]["currency"] == "ron"


def test_normalize_glued_ron_via_heuristic_then_normalize() -> None:
    """End-to-end: heuristic extracts 189ron → normalize_pricing_plans produces 18900 cents RON."""
    from app.services.gym_pricing_heuristic import _heuristic_plans_from_plain_text

    text = "Abonamente\n189ron lunar\n265ron premium\n"
    raw = _heuristic_plans_from_plain_text(text)
    out = normalize_pricing_plans(raw)
    amounts = sorted(p["amount_cents"] for p in out)
    assert 18900 in amounts
    assert 26500 in amounts
    assert all(p["currency"] == "ron" for p in out)
