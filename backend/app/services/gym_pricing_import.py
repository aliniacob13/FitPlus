"""Fetch gym websites (crawl + optional headless), then extract pricing via LLM."""

from __future__ import annotations

import heapq
import json
import logging
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from app.core.config import settings
from app.services.gym_pricing_browser import (
    fetch_html_playwright,
    playwright_browser_session,
    playwright_package_installed,
)
from app.services.gym_pricing_crawl import (
    extract_same_site_links,
    html_to_plain_text,
    looks_like_html_bytes,
    looks_like_html_str,
    merge_page_texts_for_llm,
    normalize_host,
    normalize_http_url,
    path_score,
    same_site,
    should_skip_path,
    text_suggests_pricing,
)
from app.services.gym_pricing_heuristic import _heuristic_plans_from_plain_text
from app.services.llm_service import LLMService
from app.services.pricing_plans import normalize_pricing_plans

logger = logging.getLogger(__name__)


class GymPricingImportError(Exception):
    """Raised when fetch / parse fails before LLM."""


def _http_url_ok(url: str) -> bool:
    p = urlparse(url.strip())
    return p.scheme in ("http", "https") and bool(p.netloc)


def _candidate_pricing_urls(seed: str) -> list[str]:
    """
    Google Places often links a branch landing page without prices.
    Try the same origin plus common Romanian / fitness paths.
    """
    seed = seed.strip()
    parsed = urlparse(seed)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return [seed]

    origin = f"{parsed.scheme}://{parsed.netloc}"
    extra_paths = (
        "/",
        "/abonamente",
        "/abonamente/",
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


def _import_user_agent() -> str:
    return (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FitPlusPricingImport/2.0"
    )


async def _fetch_html_httpx(url: str) -> str | None:
    max_bytes = settings.GYM_PRICING_IMPORT_MAX_BYTES
    headers = {
        "User-Agent": _import_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=25.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            raw = response.content[:max_bytes]
            ctype = response.headers.get("content-type", "").lower()
            if not looks_like_html_str(ctype, raw) and not looks_like_html_bytes(raw):
                return None
            encoding = response.encoding or "utf-8"
            return raw.decode(encoding, errors="replace")
    except httpx.HTTPError as exc:
        logger.debug("httpx fetch failed %s: %s", url, exc)
        return None


async def fetch_page_plain_text(url: str) -> str:
    """Download HTML via HTTP only and reduce to plain text (bounded). Legacy helper."""
    max_chars = settings.GYM_PRICING_IMPORT_MAX_TEXT_CHARS
    html = await _fetch_html_httpx(url)
    if not html:
        raise GymPricingImportError(f"HTTP error or non-HTML response for {url}.")
    return html_to_plain_text(html, max_chars=max_chars)


async def _collect_merged_page_text(
    seed_url: str,
    *,
    use_playwright: bool,
    deep_crawl: bool,
) -> tuple[str, list[str]]:
    """
    Priority crawl on same site (www-normalized host): Playwright when enabled,
    HTTP HTML fallback, optional link expansion up to max_depth.
    """
    nu_seed = normalize_http_url(seed_url)
    if not nu_seed:
        raise GymPricingImportError("Invalid URL (only http/https allowed).")
    seed_host_norm = normalize_host(urlparse(nu_seed).netloc)

    max_pages = settings.GYM_PRICING_CRAWL_MAX_PAGES
    max_depth = settings.GYM_PRICING_CRAWL_MAX_DEPTH if deep_crawl else 0
    max_links = settings.GYM_PRICING_CRAWL_MAX_LINKS_PER_PAGE
    page_text_cap = settings.GYM_PRICING_IMPORT_PAGE_TEXT_CHARS
    merge_chunks = settings.GYM_PRICING_IMPORT_MERGE_MAX_CHUNKS
    budget = settings.GYM_PRICING_IMPORT_MAX_TEXT_CHARS
    timeout_ms = settings.GYM_PRICING_PLAYWRIGHT_TIMEOUT_MS
    settle_ms = settings.GYM_PRICING_PLAYWRIGHT_SETTLE_S

    seed_list = _candidate_pricing_urls(nu_seed)
    heap: list[tuple[int, int, str]] = []
    for u in seed_list:
        if normalize_http_url(u) and same_site(u, seed_host_norm) and not should_skip_path(u):
            heapq.heappush(heap, (-path_score(u), 0, u))

    chunks: list[tuple[str, str]] = []
    fetched: set[str] = set()
    last_errors: list[str] = []

    pw_requested = (
        use_playwright
        and settings.GYM_PRICING_PLAYWRIGHT_ENABLED
        and playwright_package_installed()
    )

    async def fetch_html_pair(
        url_norm: str, pw_context: object | None
    ) -> tuple[str | None, str | None]:
        """Returns (html_playwright_or_none, html_httpx_or_none)."""
        html_pw: str | None = None
        if pw_context is not None:
            try:
                settle = settle_ms
                ul = url_norm.lower()
                if any(
                    x in ul
                    for x in ("abonament", "tarif", "pret", "membership", "pricing", "preturi")
                ):
                    settle = max(float(settle_ms), 2.25)
                html_pw = await fetch_html_playwright(
                    pw_context,
                    url_norm,
                    timeout_ms=timeout_ms,
                    settle_ms=settle,
                )
            except Exception as exc:  # pragma: no cover - browser/runtime
                logger.warning("Playwright fetch error for %s: %s", url_norm, exc)
        html_http = await _fetch_html_httpx(url_norm)
        return html_pw, html_http

    def pick_best_html(_url_norm: str, html_pw: str | None, html_http: str | None) -> str | None:
        if html_pw and len(html_pw) >= 80:
            return html_pw
        if html_http and len(html_http) >= 80:
            return html_http
        return html_pw or html_http

    async def run_crawl(pw_context: object | None) -> None:
        while heap and len(fetched) < max_pages:
            _neg_sc, depth, url = heapq.heappop(heap)
            nu = normalize_http_url(url)
            if not nu or nu in fetched:
                continue
            if not same_site(nu, seed_host_norm) or should_skip_path(nu):
                continue
            fetched.add(nu)

            html_pw, html_http = await fetch_html_pair(nu, pw_context if pw_requested else None)
            html = pick_best_html(nu, html_pw, html_http)
            if not html:
                last_errors.append(f"{nu}: no HTML retrieved")
                continue

            plain = html_to_plain_text(html, max_chars=page_text_cap)
            n = len(plain.strip())
            min_chars = (
                22
                if path_score(nu) >= 95 and text_suggests_pricing(plain)
                else 35
            )
            if n >= min_chars:
                chunks.append((nu, plain))
                logger.info("gym pricing import: %s chars from %s (depth=%s)", n, nu, depth)

            if not deep_crawl or depth >= max_depth:
                continue
            links = extract_same_site_links(html, nu, seed_host_norm)
            links.sort(key=path_score, reverse=True)
            for link in links[:max_links]:
                nl = normalize_http_url(link)
                if nl and nl not in fetched:
                    sc = path_score(nl) - (depth + 1) * 8
                    heapq.heappush(heap, (-sc, depth + 1, nl))

    async def boost_canonical_pricing_pages(pw_context: object | None) -> None:
        """Re-fetch known pricing paths if missing from chunks (SPA sites often skip them in crawl)."""
        parsed = urlparse(nu_seed)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        have = {normalize_http_url(u) for u, _ in chunks if normalize_http_url(u)}
        suffixes = (
            "abonamente/",
            "abonamente",
            "tarife/",
            "tarife",
            "preturi/",
            "preturi",
            "membership",
            "pricing",
        )
        for suf in suffixes:
            u = normalize_http_url(urljoin(origin.rstrip("/") + "/", suf))
            if not u or not same_site(u, seed_host_norm) or should_skip_path(u):
                continue
            if u in have:
                continue
            html_pw, html_http = await fetch_html_pair(u, pw_context if pw_requested else None)
            html = pick_best_html(u, html_pw, html_http)
            if not html:
                continue
            plain = html_to_plain_text(html, max_chars=page_text_cap)
            n = len(plain.strip())
            min_chars = (
                22
                if path_score(u) >= 95 and text_suggests_pricing(plain)
                else 35
            )
            if n >= min_chars:
                chunks.append((u, plain))
                have.add(u)
                logger.info("gym pricing import (pricing boost): %s chars from %s", n, u)

    async def crawl_then_boost(pw_context: object | None) -> None:
        await run_crawl(pw_context)
        await boost_canonical_pricing_pages(pw_context)

    if pw_requested:
        try:
            async with playwright_browser_session(
                timeout_ms=timeout_ms,
                user_agent=_import_user_agent(),
            ) as pw_ctx:
                await crawl_then_boost(pw_ctx)
        except Exception as exc:
            logger.warning(
                "Playwright unavailable (%s); continuing with HTTP fetch only.", exc
            )
            await crawl_then_boost(None)
    else:
        await crawl_then_boost(None)

    if not chunks:
        tail = " | ".join(last_errors[:6]) if last_errors else "no pages could be read"
        raise GymPricingImportError(
            "Could not download useful HTML from the site or common pricing paths. "
            f"Details: {tail}"
        )

    merged, used_urls = merge_page_texts_for_llm(
        chunks, budget_chars=budget, max_chunks=merge_chunks
    )
    stripped = merged.strip()
    if len(stripped) < 70:
        raise GymPricingImportError(
            f"Crawled text is too short ({len(stripped)} chars) — "
            "prices are likely loaded by client-side JavaScript. "
            'Try POST {"url": "<direct-pricing-page>", "use_playwright": true} '
            "or add plans manually."
        )
    return merged, used_urls


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
    """Persist shape readable by normalize_pricing_plans (amount_cents + currency preferred)."""
    rows: list[dict[str, Any]] = []
    for item in normalized:
        cents = int(item["amount_cents"])
        cur = str(item.get("currency") or "ron").lower()
        feats = item.get("features") if isinstance(item.get("features"), list) else []
        row: dict[str, Any] = {
            "name": item["name"],
            "amount_cents": cents,
            "currency": cur,
            "period": item["period"],
            "features": [str(x) for x in feats],
        }
        # Legacy field for older readers / debugging (major units, wrong name if EUR)
        if cur == "ron":
            row["price_ron"] = round(cents / 100.0, 2)
        rows.append(row)
    return rows


_SYSTEM_PROMPT = """You extract gym membership pricing from plain text scraped from one or more webpages (Romanian, English, or mixed).

IMPORTANT OUTPUT RULE: Your ENTIRE response must be a valid JSON array and nothing else.
Do NOT write any explanation, commentary, apology, or text before or after the JSON.
If no membership prices are visible in the text, respond with ONLY: []

Rules:
- Output ONLY a JSON array (no markdown fences, no prose, no commentary).
- Each element is an object with keys: "name" (string), "period" (one of: "month", "year", "week", "day"),
  "features" (array of short strings), and exactly ONE price form:
  • "price_ron": number — Romanian lei (RON) per billing period in major units (e.g. 199, 249.5, or "249,50" as string if needed), OR
  • "price_eur": number — euro (EUR) per billing period in major units (e.g. 39, 49.99, "59" as string if needed), OR
  • "price" + "currency": "ron" or "eur" (or synonyms below), OR
  • "amount_cents" (integer) + "currency" ("ron" or "eur").
- Currency synonyms you may use in "currency": ron, RON, Ron, lei, LEI, Lei, leu, LEU; eur, EUR, EURO, euro, €, unicode euro U+20AC.
- Prefer **price_eur** when the page shows €, EUR, EURO, "euro", "€/lună", "EUR/lună".
- Prefer **price_ron** when the page shows lei, RON, Ron, "lei/lună", "RON/lună", "preț în lei".
- If the same plan shows both RON and EUR, use the main advertised column only.
- Numbers may be JSON numbers OR strings that contain only digits and one optional decimal separator (comma or dot).
- Look for: abonament, abonamente, membru, membership, pret, preț, tarif, lunar, anual, plată, plata.
- Euro on site may look like: €59, 59€, 59 €, 49,99 EUR, 49.99 euro.
- Lei on site may look like: 199 lei, 199 LEI, 249,50 Ron, RON 199, 199 RON, 189ron, 265ron.
- One object per distinct paid tier. Never invent prices; only values clearly in the text.
- If there are no membership prices in the text, output []. Do NOT explain why — just output [].
"""


async def suggest_plans_from_page_text(*, page_text: str, source_url: str) -> list[dict[str, Any]]:
    llm = LLMService()
    user_content = f"Source URL: {source_url}\n\n--- PAGE TEXT ---\n{page_text}"
    reply = await llm.generate(_SYSTEM_PROMPT, [{"role": "user", "content": user_content}])
    try:
        parsed = parse_llm_json_plans(reply)
    except GymPricingImportError:
        logger.warning(
            "gym pricing import: LLM returned non-JSON; falling back to heuristic. preview=%r",
            reply[:200],
        )
        parsed = []
    normalized = normalize_pricing_plans(parsed)
    if not normalized and page_text.strip():
        fb = _heuristic_plans_from_plain_text(page_text)
        normalized = normalize_pricing_plans(fb)
        if normalized:
            logger.info("gym pricing import: %s plan(s) from text heuristic fallback", len(normalized))
    if parsed and not normalized:
        logger.warning(
            "gym pricing import: LLM returned %s row(s) but none normalized to valid EUR/RON prices",
            len(parsed),
        )
    return normalized


async def import_plans_from_url(
    url: str,
    *,
    use_playwright: bool | None = None,
    deep_crawl: bool | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """
    Returns (normalized_plans, storage_rows).
    Raises GymPricingImportError or LLMProviderError.
    """
    if not _http_url_ok(url):
        raise GymPricingImportError("Invalid URL (only http/https allowed).")

    uw = True if use_playwright is None else use_playwright
    dc = True if deep_crawl is None else deep_crawl

    page_text, used_urls = await _collect_merged_page_text(
        url, use_playwright=uw, deep_crawl=dc
    )

    pages_hint = ", ".join(used_urls[:10])
    source_hint = normalize_http_url(url.strip()) or url.strip()
    normalized = await suggest_plans_from_page_text(
        page_text=page_text,
        source_url=f"{source_hint} | pages used: {pages_hint}",
    )
    if not normalized:
        raise GymPricingImportError(
            "No plans with a valid EUR or RON price were found in the extracted text. "
            "Prices may be image-only or rendered by client-side JavaScript. "
            f"Pages tried: {pages_hint}. "
            "To fix: (1) POST with a direct pricing page URL, "
            'e.g. {"url": "https://example.com/abonamente"}; '
            '(2) add "use_playwright": true for JS-rendered sites; '
            "(3) add plans manually."
        )

    storage = normalized_plans_to_storage_rows(normalized)
    return normalized, storage
