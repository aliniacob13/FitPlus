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


def _parse_price_major_value(val: Any) -> float | None:
    """Parse a major-unit price from numbers or strings like '199 lei', '49,99 EUR', '39 €'."""
    if val is None or isinstance(val, bool):
        return None
    if isinstance(val, int | float):
        x = float(val)
        return x if x > 0 else None
    s = str(val).strip().replace("\u00a0", " ")
    s = re.sub(r"(?i)\s*(ron|lei|eur|€|euro|\$|usd)\s*", " ", s)
    s = s.replace(",", ".")
    m = re.search(r"\d+(?:\.\d+)?", s.replace(" ", ""))
    if not m:
        return None
    try:
        x = float(m.group(0))
        return x if x > 0 else None
    except ValueError:
        return None


def normalize_pricing_plans(raw: Any) -> list[dict[str, Any]]:
    """
    Turn gym.pricing_plans JSON into a list of dicts with:
    key, name, amount_cents, currency, period, period_days, features.

    Supports seed shape: {"name", "price_ron", "period", "features"}.
    Also: {"name", "price_eur", ...} for euro-denominated sites.
    Also: amount_cents, currency, key, period_days.
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
        if p.get("amount_cents") is not None:
            try:
                cents = int(p["amount_cents"])
            except (TypeError, ValueError):
                cents = None
            currency = str(p.get("currency") or "ron").lower()
        elif p.get("price_eur") is not None:
            parsed = _parse_price_major_value(p.get("price_eur"))
            cents = int(round(parsed * 100)) if parsed is not None else None
            currency = "eur"
        elif p.get("price_ron") is not None:
            parsed = _parse_price_major_value(p.get("price_ron"))
            cents = int(round(parsed * 100)) if parsed is not None else None
            currency = "ron"
        else:
            cents = None
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
