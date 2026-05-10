"""Fetch gym pricing pages and extract structured plans via LLM (best-effort)."""

from __future__ import annotations

import json
import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from app.core.config import settings
from app.services.llm_service import LLMService
from app.services.pricing_plans import normalize_pricing_plans
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class GymPricingImportError(Exception):
    """Raised when fetch / parse fails before LLM."""


def _http_url_ok(url: str) -> bool:
    p = urlparse(url.strip())
    return p.scheme in ("http", "https") and bool(p.netloc)


def _candidate_pricing_urls(seed: str) -> list[str]:
    """
    Gym websites from Google often point at a branch landing page without prices.
    Try the same origin + common Romanian / fitness paths.
    """
    seed = seed.strip()
    parsed = urlparse(seed)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return [seed]

    origin = f"{parsed.scheme}://{parsed.netloc}"
    extra_paths = (
        "/",
        "/abonamente",
        "/tarife",
        "/preturi",
        "/pret",
        "/membership",
        "/pricing",
        "/oferta",
        "/club/abonamente",
        "/inscrieri",
        "/planuri",
    )

    out: list[str] = []
    seen: set[str] = set()

    def add(u: str) -> None:
        u = u.strip()
        if not u or u in seen:
            return
        seen.add(u)
        out.append(u)

    add(seed)
    for path in extra_paths:
        add(urljoin(origin + "/", path.lstrip("/")))
    return out


def llm_usable_for_import() -> bool:
    p = settings.LLM_PROVIDER.lower()
    if p == "openai":
        return bool(settings.OPENAI_API_KEY)
    if p == "anthropic":
        return bool(settings.ANTHROPIC_API_KEY)
    if p == "ollama":
        return bool(settings.OLLAMA_BASE_URL)
    return False


def _looks_like_html(raw: bytes) -> bool:
    sample = raw[:4000].lstrip().lower()
    if sample.startswith(b"<!doctype html") or sample.startswith(b"<html"):
        return True
    head = sample[:3500]
    return (
        b"<body" in head
        or b"<main" in head
        or b"<article" in head
        or b"<section" in head
        or (b"<div" in head and len(sample) > 200)
    )


async def fetch_page_plain_text(url: str) -> str:
    """Download HTML and reduce to plain text (bounded size)."""
    max_bytes = settings.GYM_PRICING_IMPORT_MAX_BYTES
    max_chars = settings.GYM_PRICING_IMPORT_MAX_TEXT_CHARS
    headers = {
        # Many gym sites block non-browser clients; keep import identifiable but browser-like.
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FitPlusPricingImport/1.0"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
        looks_html = _looks_like_html(raw)
        if (
            ctype
            and "html" not in ctype
            and "text/plain" not in ctype
            and "xml" not in ctype
            and not looks_html
        ):
            raise GymPricingImportError(
                f"Raspunsul nu pare HTML (Content-Type: {ctype or 'lipsa'}). "
                "Foloseste un URL https care intoarce pagina de tarife, nu un fisier PDF/API."
            )

        encoding = response.encoding or "utf-8"
        html = raw.decode(encoding, errors="replace")
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript", "svg"]):
            tag.decompose()
        raw_text = soup.get_text(separator="\n")
        lines = (ln.strip() for ln in raw_text.splitlines())
        collapsed = "\n".join(ln for ln in lines if ln)
        out = collapsed[:max_chars]
        logger.debug("gym pricing import: fetched %s chars plain text from %s", len(out), url)
        return out


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


_SYSTEM_PROMPT = """You extract gym membership pricing from plain text scraped from one or more webpages (possibly Romanian).
Rules:
- Output ONLY a JSON array (no markdown fences, no commentary).
- Each element is an object with keys: "name" (string), "price_ron" (number only — Romanian lei per billing period),
  "period" (one of: "month", "year", "week", "day"), "features" (array of short strings).
- price_ron must be a JSON number like 199 or 249.5, never a string.
- Look for wording like: abonament, membru, membership, pret, tarif, lei, RON, lunar, anual, intrare, pachet.
- One object per distinct paid tier (e.g. Basic vs Premium). Merge duplicate lines.
- Include only plans clearly stated in the text. Never invent prices.
- If prices are only in EUR, convert approximately to RON and add "(approx EUR→RON)" in a feature string.
- If there are no membership prices in the text, output [].
"""


async def _collect_merged_page_text(seed_url: str) -> tuple[str, list[str]]:
    """Fetch seed URL plus common paths; merge longest excerpts for the LLM."""
    budget = settings.GYM_PRICING_IMPORT_MAX_TEXT_CHARS
    chunks: list[tuple[str, str]] = []
    last_errors: list[str] = []

    for u in _candidate_pricing_urls(seed_url):
        try:
            text = await fetch_page_plain_text(u)
            n = len(text.strip())
            if n >= 35:
                chunks.append((u, text))
                logger.info("gym pricing import: %s chars from %s", n, u)
        except GymPricingImportError as exc:
            last_errors.append(f"{u}: {exc}")

    if not chunks:
        tail = " | ".join(last_errors[:4]) if last_errors else "nicio pagina nu a putut fi citita"
        raise GymPricingImportError(
            "Nu s-a putut descarca continut HTML util de pe site sau din paginile uzuale "
            "(/abonamente, /tarife, /preturi). "
            f"Detalii: {tail}"
        )

    chunks.sort(key=lambda c: len(c[1]), reverse=True)
    merged_parts: list[str] = []
    total = 0
    used_urls: list[str] = []
    for u, text in chunks[:5]:
        header = f"\n\n=== SURSA: {u} ===\n\n"
        block = header + text
        room = budget - total
        if room <= 0:
            break
        if len(block) > room:
            block = block[:room]
        merged_parts.append(block)
        used_urls.append(u)
        total += len(block)
        if total >= budget:
            break

    merged = "".join(merged_parts).strip()
    return merged, used_urls


async def suggest_plans_from_page_text(*, page_text: str, source_url: str) -> list[dict[str, Any]]:
    llm = LLMService()
    user_content = f"Source URL: {source_url}\n\n--- PAGE TEXT ---\n{page_text}"
    reply = await llm.generate(_SYSTEM_PROMPT, [{"role": "user", "content": user_content}])
    try:
        parsed = parse_llm_json_plans(reply)
    except GymPricingImportError:
        logger.warning("gym pricing import: LLM JSON parse failed; preview=%r", reply[:600])
        raise
    normalized = normalize_pricing_plans(parsed)
    if parsed and not normalized:
        logger.warning(
            "gym pricing import: LLM returned %s row(s) but none normalized to valid RON prices",
            len(parsed),
        )
    return normalized


async def import_plans_from_url(url: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """
    Returns (normalized_plans, storage_rows).
    Raises GymPricingImportError or LLMProviderError.
    """
    if not _http_url_ok(url):
        raise GymPricingImportError("Invalid URL (only http/https allowed).")

    page_text, used_urls = await _collect_merged_page_text(url)
    stripped = page_text.strip()
    if len(stripped) < 70:
        raise GymPricingImportError(
            f"Dupa mai multe incercari pe site, textul extras ramane prea scurt ({len(stripped)} caractere). "
            "Probabil tarifele sunt doar in imagini sau incarcate cu JavaScript. "
            "Deschide in aplicatie un URL catre pagina unde preturile sunt text selectabil, sau completeaza manual in DB."
        )

    source_hint = url if url in used_urls else url
    pages_hint = ", ".join(used_urls[:6])
    normalized = await suggest_plans_from_page_text(
        page_text=page_text,
        source_url=f"{source_hint} | pagini folosite: {pages_hint}",
    )
    if not normalized:
        raise GymPricingImportError(
            "Nu s-au gasit planuri cu pret RON valid in textul extras. "
            "Continutul nu mentioneaza tarife clare (sau sunt doar in imagini). "
            f"Pagini incercate: {pages_hint}. "
            'Poti trimite in API corpul JSON {"url": "https://...pagina-tarife..."} catre o pagina concreta.'
        )

    storage = normalized_plans_to_storage_rows(normalized)
    return normalized, storage
