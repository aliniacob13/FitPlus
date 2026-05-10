"""Fetch gym pricing pages and extract structured plans via LLM (best-effort)."""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.config import settings
from app.services.llm_service import LLMService
from app.services.pricing_plans import normalize_pricing_plans


class GymPricingImportError(Exception):
    """Raised when fetch / parse fails before LLM."""


def _http_url_ok(url: str) -> bool:
    p = urlparse(url.strip())
    return p.scheme in ("http", "https") and bool(p.netloc)


def llm_usable_for_import() -> bool:
    p = settings.LLM_PROVIDER.lower()
    if p == "openai":
        return bool(settings.OPENAI_API_KEY)
    if p == "anthropic":
        return bool(settings.ANTHROPIC_API_KEY)
    if p == "ollama":
        return bool(settings.OLLAMA_BASE_URL)
    return False


async def fetch_page_plain_text(url: str) -> str:
    """Download HTML and reduce to plain text (bounded size)."""
    max_bytes = settings.GYM_PRICING_IMPORT_MAX_BYTES
    max_chars = settings.GYM_PRICING_IMPORT_MAX_TEXT_CHARS
    headers = {
        "User-Agent": (
            "FitPlusPricingImport/1.0 (+https://github.com/) "
            "backend-only extraction for displayed membership info"
        ),
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=25.0) as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise GymPricingImportError(f"HTTP {exc.response.status_code} fetching page.") from exc
        except httpx.HTTPError as exc:
            raise GymPricingImportError(f"Download failed: {exc}") from exc

        raw = response.content[:max_bytes]
        ctype = response.headers.get("content-type", "").lower()
        if "html" not in ctype and "text/" not in ctype and ctype:
            raise GymPricingImportError("URL did not return HTML/text content.")

    html = raw.decode(response.encoding or "utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    text = soup.get_text(separator="\n")
    lines = (ln.strip() for ln in text.splitlines())
    collapsed = "\n".join(ln for ln in lines if ln)
    return collapsed[:max_chars]


def _strip_markdown_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        if len(lines) >= 2 and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        t = "\n".join(lines).strip()
    return t


def parse_llm_json_plans(raw_reply: str) -> list[Any]:
    """Parse LLM output into a list of plan dicts."""
    t = _strip_markdown_fence(raw_reply)
    try:
        data = json.loads(t)
    except json.JSONDecodeError:
        start = t.find("[")
        end = t.rfind("]")
        if start >= 0 and end > start:
            try:
                data = json.loads(t[start : end + 1])
            except json.JSONDecodeError as exc:
                raise GymPricingImportError("LLM did not return valid JSON.") from exc
        else:
            raise GymPricingImportError("LLM did not return valid JSON.")

    if isinstance(data, dict):
        nested = data.get("plans")
        data = nested if isinstance(nested, list) else []
    if not isinstance(data, list):
        raise GymPricingImportError("LLM JSON must be an array of plans.")
    return data


def normalized_plans_to_storage_rows(normalized: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Persist shape compatible with normalize_pricing_plans on read."""
    rows: list[dict[str, Any]] = []
    for item in normalized:
        cents = int(item["amount_cents"])
        price_ron = round(cents / 100.0, 2)
        feats = item.get("features") if isinstance(item.get("features"), list) else []
        rows.append(
            {
                "name": item["name"],
                "price_ron": price_ron,
                "period": item["period"],
                "features": [str(x) for x in feats],
            }
        )
    return rows


_SYSTEM_PROMPT = """You extract gym membership pricing from plain text scraped from a webpage.
Rules:
- Output ONLY a JSON array (no markdown fences, no commentary).
- Each element is an object with keys: "name" (string), "price_ron" (number in Romanian lei),
  "period" (one of: "month", "year", "week", "day"), "features" (array of short strings).
- Include only plans clearly stated in the text. Never invent prices.
- If prices are only in EUR, convert approximately to RON using a reasonable rate and mention "(approx EUR→RON)" in a feature string.
- If there are no membership prices in the text, output [].
"""


async def suggest_plans_from_page_text(*, page_text: str, source_url: str) -> list[dict[str, Any]]:
    llm = LLMService()
    user_content = f"Source URL: {source_url}\n\n--- PAGE TEXT ---\n{page_text}"
    reply = await llm.generate(_SYSTEM_PROMPT, [{"role": "user", "content": user_content}])
    parsed = parse_llm_json_plans(reply)
    normalized = normalize_pricing_plans(parsed)
    return normalized


async def import_plans_from_url(url: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """
    Returns (normalized_plans, storage_rows).
    Raises GymPricingImportError or LLMProviderError.
    """
    if not _http_url_ok(url):
        raise GymPricingImportError("Invalid URL (only http/https allowed).")

    page_text = await fetch_page_plain_text(url)
    if len(page_text.strip()) < 80:
        raise GymPricingImportError("Page text too short — page may be empty or JavaScript-only.")

    normalized = await suggest_plans_from_page_text(page_text=page_text, source_url=url)
    if not normalized:
        raise GymPricingImportError("No valid membership plans could be extracted.")

    storage = normalized_plans_to_storage_rows(normalized)
    return normalized, storage
