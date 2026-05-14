"""Lightweight price extraction from plain page text (no httpx / LLM imports)."""

from __future__ import annotations

import re
from typing import Any

from app.services.pricing_plans import _parse_price_major_value


def _heuristic_plans_from_plain_text(text: str) -> list[dict[str, Any]]:
    """
    Extract likely membership prices from raw page text when structured LLM output fails.
    Conservative: only matches near pricing-related vocabulary.
    """
    sample = text[:36000]
    kw = (
        "abonament",
        "abonamente",
        "membru",
        "membership",
        "lunar",
        "anual",
        "lună",
        "luna",
        "preț",
        "pret",
        "tarif",
        "fitness",
        "gym",
        "acces",
        "access",
        "viva",
        "club",
    )
    pat = re.compile(
        r"(?i)(?P<num>\d{1,4}(?:[.,]\d{1,2})?)\s*(?P<c>€|EUR|EURO|euro|\u20ac|LEI|Lei|lei|RON|Ron|LEU|Leu|leu)\b"
    )
    pat_currency_first = re.compile(
        r"(?i)(?P<c>ron|lei|leu|€|\u20ac|eur|euro)\s+(?P<num>\d{1,4}(?:[.,]\d{1,2})?)\b"
    )
    pat_glued_eur = re.compile(
        r"(?i)(?P<num>\d{1,4}(?:[.,]\d{1,2})?)(?P<c>€|\u20ac)(?=\s|$)"
    )
    pat_glued_lei = re.compile(
        r"(?i)(?P<num>\d{1,4}(?:[.,]\d{1,2})?)(?P<c>lei)(?=\s|$|[,.;:!?\)\]]|/|-)"
    )
    pat_glued_ron = re.compile(r"(?i)(?P<num>\d{1,4}(?:[.,]\d{1,2})?)(?P<c>ron)\b")
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, int]] = set()
    for rx in (pat, pat_currency_first, pat_glued_eur, pat_glued_lei, pat_glued_ron):
        for m in rx.finditer(sample):
            lo = max(0, m.start() - 300)
            hi = min(len(sample), m.end() + 150)
            window = sample[lo:hi].lower()
            if not any(k in window for k in kw):
                continue
            parsed = _parse_price_major_value(m.group("num"))
            if parsed is None or parsed <= 0 or parsed > 50_000:
                continue
            raw_c = m.group("c")
            if raw_c in ("€", "\u20ac") or raw_c.lower() in ("eur", "euro"):
                cur = "eur"
                field = "price_eur"
            else:
                cur = "ron"
                field = "price_ron"
            cents = int(round(parsed * 100))
            sig = (cur, cents)
            if sig in seen:
                continue
            seen.add(sig)
            hint = sample[max(0, m.start() - 60) : m.start()].strip()
            hint = re.sub(r"[\s|\-:/]+$", "", hint)
            if len(hint) < 2 or len(hint) > 72:
                hint = f"Plan {len(out) + 1}"
            out.append(
                {
                    "name": hint[:80],
                    "period": "month",
                    "features": [],
                    field: parsed,
                }
            )
            if len(out) >= 20:
                return out
    return out
