"""Headless Chromium fetch for gym pricing pages (JS-rendered content)."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


def playwright_package_installed() -> bool:
    try:
        import playwright  # noqa: F401

        return True
    except ImportError:
        return False


@asynccontextmanager
async def playwright_browser_session(
    *,
    timeout_ms: int,
    user_agent: str,
) -> AsyncIterator[object]:
    """One Chromium context for multiple navigations (reuse cookies / warm cache)."""
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
            ],
        )
        context = await browser.new_context(
            user_agent=user_agent,
            locale="ro-RO",
            viewport={"width": 1280, "height": 900},
        )
        context.set_default_navigation_timeout(timeout_ms)
        try:
            yield context
        finally:
            await context.close()
            await browser.close()


async def fetch_html_playwright(
    context: object,
    url: str,
    *,
    timeout_ms: int,
    settle_ms: float,
) -> str | None:
    from playwright.async_api import Error as PlaywrightError

    page = await context.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        if settle_ms > 0:
            await asyncio.sleep(settle_ms)
        return await page.content()
    except PlaywrightError as exc:
        logger.debug("playwright goto failed %s: %s", url, exc)
        return None
    finally:
        await page.close()
