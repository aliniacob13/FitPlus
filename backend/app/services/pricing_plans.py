"""Normalize gym.pricing_plans JSON for checkout and API responses."""

from __future__ import annotations

from typing import Any


def _period_to_days(period: str) -> int:
    p = period.lower().strip()
    if p in ("year", "annual", "yearly"):
        return 365
    if p in ("week", "weekly"):
        return 7
    if p in ("day", "daily"):
        return 1
    return 30


def normalize_pricing_plans(raw: Any) -> list[dict[str, Any]]:
    """
    Turn gym.pricing_plans JSON into a list of dicts with:
    key, name, amount_cents, currency, period, period_days, features.

    Supports seed shape: {"name", "price_ron", "period", "features"}.
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
        elif p.get("price_ron") is not None:
            try:
                cents = int(round(float(p["price_ron"]) * 100))
            except (TypeError, ValueError):
                cents = None
        if cents is None or cents <= 0:
            continue

        currency = str(p.get("currency") or "ron").lower()
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
