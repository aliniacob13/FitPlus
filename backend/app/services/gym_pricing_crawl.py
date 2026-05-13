"""Same-site link discovery, URL scoring, and HTML → plain text for gym pricing import."""

from __future__ import annotations

import logging
from urllib.parse import urldefrag, urljoin, urlparse

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

_SKIP_PATH_SUFFIXES = (
    ".pdf",
    ".zip",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".mp4",
    ".mp3",
    ".css",
    ".js",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
)

_PRICING_PATH_KEYWORDS: tuple[tuple[str, int], ...] = (
    ("abonament", 120),
    ("abonamente", 120),
    ("tarif", 110),
    ("tarife", 110),
    ("pret", 100),
    ("preț", 100),
    ("prețuri", 100),
    ("membership", 95),
    ("pricing", 95),
    ("oferta", 70),
    ("ofertă", 70),
    ("inscriere", 65),
    ("înscriere", 65),
    ("planuri", 80),
    ("pachet", 60),
    ("fitness", 35),
    ("gym", 30),
    ("subscription", 85),
    ("join", 50),
    ("offer", 55),
)

# Deprioritize paths that add lots of boilerplate (maps, rules) and crowd out /abonamente in merge.
_NOISE_PATH_FRAGMENTS: tuple[tuple[str, int], ...] = (
    ("harta", 130),
    ("harta-", 130),
    ("?city=", 90),
    ("reguli", 110),
    ("group-fitness", 100),
    ("clase-group", 100),
    ("/clase/", 85),
    ("cookie", 200),
    ("/blog", 90),
    ("cariere", 70),
    ("/contact", 60),
    ("revista", 50),
    ("corporate", 40),
)


def normalize_host(netloc: str) -> str:
    h = (netloc or "").lower().split("@")[-1].split(":")[0]
    if h.startswith("www."):
        return h[4:]
    return h


def normalize_http_url(url: str) -> str | None:
    u = url.strip()
    if not u:
        return None
    parsed = urlparse(u)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    u2, _frag = urldefrag(u)
    return u2


def same_site(url: str, seed_host_norm: str) -> bool:
    nu = normalize_http_url(url)
    if not nu:
        return False
    return normalize_host(urlparse(nu).netloc) == seed_host_norm


def path_score(url: str) -> int:
    nu = normalize_http_url(url)
    if not nu:
        return 0
    parsed = urlparse(nu)
    path = parsed.path.lower()
    query = (parsed.query or "").lower()
    blob = f"{path}?{query}"
    score = 5
    for kw, w in _PRICING_PATH_KEYWORDS:
        if kw in path:
            score += w
    for frag, pen in _NOISE_PATH_FRAGMENTS:
        if frag in blob:
            score -= pen
    return max(score, 0)


def should_skip_path(url: str) -> bool:
    nu = normalize_http_url(url)
    if not nu:
        return True
    low = nu.lower().split("?", maxsplit=1)[0]
    return any(low.endswith(suf) for suf in _SKIP_PATH_SUFFIXES)


def extract_same_site_links(html: str, base_url: str, seed_host_norm: str) -> list[str]:
    """Absolute http(s) links on the same registrable host (www-insensitive)."""
    base = normalize_http_url(base_url) or base_url
    out: list[str] = []
    seen: set[str] = set()
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug("extract_same_site_links: BeautifulSoup failed: %s", exc)
        return []

    for tag in soup.find_all("a", href=True):
        raw = str(tag.get("href") or "").strip()
        if not raw or raw.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        joined = urljoin(base, raw)
        nu = normalize_http_url(joined)
        if not nu or should_skip_path(nu):
            continue
        if not same_site(nu, seed_host_norm):
            continue
        if nu in seen:
            continue
        seen.add(nu)
        out.append(nu)
    return out


def html_to_plain_text(html: str, *, max_chars: int) -> str:
    """Strip scripts/styles and collapse whitespace (bounded)."""
    sample = html[:4000].lower()
    if "<html" not in sample and "<body" not in sample and "<div" not in sample:
        # Plain text or tiny fragment
        lines = (ln.strip() for ln in html.splitlines())
        return "\n".join(ln for ln in lines if ln)[:max_chars]

    soup = BeautifulSoup(html[: max_chars * 4], "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    raw_text = soup.get_text(separator="\n")
    lines = (ln.strip() for ln in raw_text.splitlines())
    collapsed = "\n".join(ln for ln in lines if ln)
    return collapsed[:max_chars]


def text_suggests_pricing(plain: str) -> bool:
    """Heuristic: tiny pages that still mention money or membership."""
    low = plain[:12000].lower()
    return any(
        x in low
        for x in (
            "€",
            "eur",
            " euro",
            " lei",
            " ron",
            "abonament",
            "membership",
            "/lun",
            "lunar",
            "anual",
            "plat",
            "preț",
            "pret ",
        )
    )


def merge_page_texts_for_llm(
    chunks: list[tuple[str, str]],
    *,
    budget_chars: int,
    max_chunks: int,
) -> tuple[str, list[str]]:
    """Prefer high path_score (pricing paths) so map/rules pages do not crowd out /abonamente."""
    ranked = sorted(
        chunks,
        key=lambda c: (path_score(c[0]), len(c[1]), c[0]),
        reverse=True,
    )
    merged_parts: list[str] = []
    used_urls: list[str] = []
    total = 0
    for u, text in ranked[:max_chunks]:
        header = f"\n\n=== SOURCE: {u} ===\n\n"
        block = header + text
        room = budget_chars - total
        if room <= 0:
            break
        if len(block) > room:
            block = block[:room]
        merged_parts.append(block)
        used_urls.append(u)
        total += len(block)
        if total >= budget_chars:
            break
    return "".join(merged_parts).strip(), used_urls


def looks_like_html_bytes(raw: bytes) -> bool:
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


def looks_like_html_str(content_type: str, raw: bytes) -> bool:
    ctype = (content_type or "").lower()
    looks = looks_like_html_bytes(raw)
    if ctype and "html" not in ctype and "text/plain" not in ctype and "xml" not in ctype and not looks:
        return False
    return True
