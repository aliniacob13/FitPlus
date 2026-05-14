"""Unit tests for gym pricing crawl helpers (no network)."""

from app.services.gym_pricing_crawl import (
    budget_plain_text_for_pricing,
    extract_same_site_links,
    html_to_plain_text,
    merge_page_texts_for_llm,
    normalize_host,
    normalize_http_url,
    path_score,
    same_site,
    should_skip_path,
)


def test_normalize_host_strips_www() -> None:
    assert normalize_host("WWW.Example.COM") == "example.com"


def test_same_site_www_insensitive() -> None:
    seed = "example.com"
    assert same_site("https://www.example.com/abonamente", seed) is True
    assert same_site("https://other.com/tarife", seed) is False


def test_should_skip_pdf() -> None:
    assert should_skip_path("https://gym.com/files/price.pdf") is True
    assert should_skip_path("https://gym.com/abonamente") is False


def test_path_score_prefers_pricing_paths() -> None:
    assert path_score("https://gym.com/abonamente") > path_score("https://gym.com/contact")


def test_extract_same_site_links() -> None:
    html = """
    <html><body>
    <a href="/tarife">T</a>
    <a href="https://evil.com/x">X</a>
    <a href="/abonamente#top">A</a>
    </body></html>
    """
    links = extract_same_site_links(html, "https://gym.com/club/", "gym.com")
    assert "https://gym.com/tarife" in links
    assert "https://gym.com/abonamente" in links
    assert all("evil.com" not in x for x in links)


def test_html_to_plain_text_strips_scripts() -> None:
    html = "<html><script>x</script><body><p>Hello  <b>World</b></p></body></html>"
    out = html_to_plain_text(html, max_chars=5000)
    assert "Hello" in out
    assert "World" in out
    assert "script" not in out.lower()


def test_budget_plain_text_keeps_tarife_after_long_nav() -> None:
    nav = ("Meniu cluburi București\n" * 500)
    tail = "## Tarife\n### Super Active\n**189ron**\nabonament plată\n### Plus\n**265ron**\n"
    text = nav + tail
    out = budget_plain_text_for_pricing(text, max_chars=3500)
    assert "189ron" in out
    assert "265ron" in out
    assert "Tarife" in out


def test_budget_plain_text_tarife_heading_without_early_price() -> None:
    filler = "x" * 12000 + "\n## Tarife\n(vino la sală)\n**240ron**\nabonament\n"
    out = budget_plain_text_for_pricing(filler, max_chars=2000)
    assert "240ron" in out


def test_merge_page_texts_respects_budget() -> None:
    chunks = [
        ("https://a/x", "short"),
        ("https://b/y", "y" * 500),
        ("https://c/z", "z" * 200),
    ]
    merged, used = merge_page_texts_for_llm(chunks, budget_chars=400, max_chunks=5)
    assert "SOURCE: https://b/y" in merged
    assert len(merged) <= 400
    assert used


def test_normalize_http_url_strips_fragment() -> None:
    assert normalize_http_url("https://x.com/p#frag") == "https://x.com/p"


def test_path_score_penalizes_map_pages() -> None:
    assert path_score("https://gym.ro/harta-cluburi") < path_score("https://gym.ro/abonamente/")


def test_merge_prefers_pricing_path_over_long_map_text() -> None:
    chunks = [
        ("https://example.com/harta-cluburi", "z" * 8000),
        ("https://example.com/abonamente/", "Flexible 59 € lunar Bronze"),
    ]
    _merged, used = merge_page_texts_for_llm(chunks, budget_chars=6000, max_chunks=2)
    assert used[0] == "https://example.com/abonamente/"


def test_budget_plain_text_centers_on_eur_price() -> None:
    """EUR-only pages (49 EUR, 59 euro) must trigger price-centering, not head+tail."""
    nav = "Bine ati venit la clubul nostru de fitness!\n" * 400
    tail = "Abonamente anuale\n49 EUR / luna\nBronze\n79 EUR / luna\nSilver\n"
    text = nav + tail
    out = budget_plain_text_for_pricing(text, max_chars=3000)
    assert "EUR" in out
    assert "49" in out


def test_budget_plain_text_plain_tarife_heading() -> None:
    """Standalone plain-text 'Tarife' line (no markdown) must act as anchor."""
    filler = "y" * 14000 + "\n"
    tail = "Tarife\nBasic 199 lei\nPremium 299 lei\n"
    text = filler + tail
    out = budget_plain_text_for_pricing(text, max_chars=2000)
    assert "199" in out
    assert "lei" in out.lower()


def test_budget_plain_text_eur_suffix_glued() -> None:
    """49,99EUR (no space) should be detected and the pricing block preserved."""
    nav = "Nav item\n" * 600
    tail = "Abonamente Club\n49,99EUR Bronze\n79,99EUR Silver\n"
    text = nav + tail
    out = budget_plain_text_for_pricing(text, max_chars=3000)
    assert "49,99EUR" in out or "49,99" in out


def test_html_to_plain_text_large_html_not_truncated() -> None:
    """BeautifulSoup must parse the full HTML even when it is large."""
    big_nav = "<nav>" + "<p>Link</p>" * 10_000 + "</nav>"
    pricing = "<section><h2>Tarife</h2><p>199 lei lunar</p></section>"
    html = f"<html><body>{big_nav}{pricing}</body></html>"
    out = html_to_plain_text(html, max_chars=4000)
    assert "199" in out
    assert "lei" in out.lower()
