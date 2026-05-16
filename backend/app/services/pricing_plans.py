"""Normalize gym.pricing_plans JSON for checkout and API responses."""

from __future__ import annotations

import re
from typing import Any

# Used when gym.pricing_plans is null/empty and fallback is enabled (DEBUG or SUBSCRIPTION_FALLBACK_PRICING).
_DEFAULT_DEMO_RAW_PLANS: list[dict[str, Any]] = [
    {
        "name": "Basic (demo)",
        "price_ron": 99,
        "period": "month",
        "features": ["Placeholder — set pricing_plans on the gym for real prices"],
    },
    {
        "name": "Plus (demo)",
        "price_ron": 149,
        "period": "month",
        "features": ["Placeholder — configure gym.pricing_plans in DB or admin"],
    },
]


def _period_to_days(period: str) -> int:
    p = period.lower().strip()
    if p in ("year", "annual", "yearly", "anual", "an"):
        return 365
    if p in ("week", "weekly", "saptamana", "săptămână"):
        return 7
    if p in ("day", "daily", "zi"):
        return 1
    if p in ("month", "monthly", "lunar", "luna", "lună"):
        return 30
    return 30


def _dict_get_ci(d: dict[str, Any], *candidates: str) -> Any:
    """Case-insensitive key lookup (first match)."""
    lower = {str(k).lower(): v for k, v in d.items()}
    for c in candidates:
        if c.lower() in lower and lower[c.lower()] is not None:
            return lower[c.lower()]
    return None


_CURRENCY_STRIP = re.compile(
    r"(?i)[\s.]*(?:"
    r"ron|lei|leu|leí|new\s*lei|"
    r"eur|euro|"
    r"€|\u20ac|\u00a3|£|usd|\$"
    r")\b[\s.]*"
)


def _parse_european_number_token(s: str) -> float | None:
    """
    Parse a single price token: supports 199, 199.5, 199,5, 1.234,56 and 1,234.56 heuristics.
    """
    s = s.strip().replace("\u00a0", " ").replace(" ", "")
    if not s:
        return None
    s = _CURRENCY_STRIP.sub("", s)
    s = s.strip()
    if not s:
        return None
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s and s.count(",") == 1:
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1]) <= 2 and parts[1].isdigit():
            s = f"{parts[0]}.{parts[1]}"
        else:
            s = s.replace(",", ".")
    try:
        x = float(s)
        return x if x > 0 else None
    except ValueError:
        return None


def _parse_price_major_value(val: Any) -> float | None:
    """Parse a major-unit price from numbers or strings (RON/EUR symbols and Romanian wording)."""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, int | float):
        x = float(val)
        return x if x > 0 else None
    s = str(val).strip().replace("\u00a0", " ")
    s = _CURRENCY_STRIP.sub(" ", s)
    s = re.sub(r"\s+", "", s)
    return _parse_european_number_token(s)


def _normalize_currency_token(raw: Any) -> str | None:
    if raw is None:
        return None
    t = str(raw).strip().lower().replace(" ", "")
    if t in (
        "eur",
        "euro",
        "€",
        "\u20ac",
        "euro/luna",
        "eur/luna",
        "eur/lună",
    ):
        return "eur"
    if t in (
        "ron",
        "lei",
        "leu",
        "lei.",
        "ron.",
        "newlei",
        "lei/zi",
        "lei/luna",
        "lei/lună",
        "lei/lunar",
        "ron/luna",
    ):
        return "ron"
    if "eur" in t or "euro" in t or "€" in t or "\u20ac" in t:
        return "eur"
    if "lei" in t or "ron" in t or "leu" in t:
        return "ron"
    return None


def _parse_amount_cents_field(val: Any) -> int | None:
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, int):
        return val if val > 0 else None
    if isinstance(val, float):
        return int(round(val)) if val > 0 else None
    s = str(val).strip().replace("\u00a0", "").replace(" ", "")
    if not s.isdigit():
        return None
    n = int(s)
    return n if n > 0 else None


def normalize_pricing_plans(raw: Any) -> list[dict[str, Any]]:
    """
    Turn gym.pricing_plans JSON into a list of dicts with:
    key, name, amount_cents, currency, period, period_days, features.

    Supports seed shape: {"name", "price_ron", "period", "features"}.
    Also: {"name", "price_eur", ...}, {"price", "currency"}, amount_cents + currency.
    Keys are matched case-insensitively where noted.
    """
    if raw is None:
        return []

    items: list[Any]
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        nested = raw.get("plans")
        items = nested if isinstance(nested, list) else []
    else:
        return []

    out: list[dict[str, Any]] = []
    for i, p in enumerate(items):
        if not isinstance(p, dict):
            continue
        name = str(p.get("name") or p.get("plan_name") or f"Plan {i + 1}")
        cents: int | None = None
        currency = "ron"

        ac = _dict_get_ci(p, "amount_cents", "AmountCents", "amount_in_cents")
        if ac is not None:
            cents = _parse_amount_cents_field(ac)
            cur_raw = _dict_get_ci(p, "currency", "Currency", "curr")
            currency = _normalize_currency_token(cur_raw) or str(cur_raw or "ron").lower()[:3]
            if currency not in ("ron", "eur"):
                currency = "ron"

        price_generic = _dict_get_ci(p, "price", "Price", "pret", "Pret", "preț")
        cur_generic = _dict_get_ci(p, "currency", "Currency", "moneda", "Moneda", "curr", "unit")
        if cents is None and price_generic is not None:
            inferred = _normalize_currency_token(cur_generic)
            parsed = _parse_price_major_value(price_generic)
            if parsed is not None and inferred in ("ron", "eur"):
                cents = int(round(parsed * 100))
                currency = inferred

        if cents is None:
            pe = _dict_get_ci(
                p,
                "price_eur",
                "PriceEur",
                "priceEUR",
                "eur_price",
                "pret_eur",
                "pretEUR",
            )
            if pe is not None:
                parsed = _parse_price_major_value(pe)
                if parsed is not None:
                    cents = int(round(parsed * 100))
                    currency = "eur"

        if cents is None:
            pr = _dict_get_ci(
                p,
                "price_ron",
                "PriceRon",
                "priceRON",
                "price_lei",
                "PriceLei",
                "pret_ron",
                "pret_lei",
                "pretRon",
            )
            if pr is not None:
                parsed = _parse_price_major_value(pr)
                if parsed is not None:
                    cents = int(round(parsed * 100))
                    currency = "ron"

        if cents is None or cents <= 0:
            continue

        period = str(p.get("period") or "month")
        period_days = p.get("period_days")
        try:
            pd = int(period_days) if period_days is not None else _period_to_days(period)
        except (TypeError, ValueError):
            pd = _period_to_days(period)

        key = str(p.get("key") or f"plan_{i}")
        features = p.get("features") if isinstance(p.get("features"), list) else []

        out.append(
            {
                "key": key,
                "name": name,
                "amount_cents": cents,
                "currency": currency,
                "period": period,
                "period_days": pd,
                "features": features,
            }
        )

    return out


def effective_pricing_plans(raw: Any, *, fallback: bool) -> list[dict[str, Any]]:
    """
    Normalized plans from DB JSON, or demo placeholder plans when empty and fallback is True.
    """
    normalized = normalize_pricing_plans(raw)
    if normalized:
        return normalized
    if fallback:
        return normalize_pricing_plans(_DEFAULT_DEMO_RAW_PLANS)
    return []
