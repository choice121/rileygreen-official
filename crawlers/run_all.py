"""
Main orchestrator — runs all crawlers and reports results.

Usage:
  python run_all.py                    # run everything
  python run_all.py --crawler albums   # run one crawler
  python run_all.py --crawler news,tour  # run multiple

GitHub Actions passes --crawler via workflow_dispatch input.
"""

import argparse
import asyncio
import logging
import sys
import time
from typing import Callable, Awaitable

from config import Config
from utils import setup_logging

logger = logging.getLogger(__name__)


# ── Crawler registry ──────────────────────────────────────────────────────────

def _load_crawlers() -> dict[str, Callable[[], Awaitable[dict]]]:
    import albums, tour, news, merch, videos, gallery
    return {
        "albums": albums.run,
        "tour": tour.run,
        "news": news.run,
        "merch": merch.run,
        "videos": videos.run,
        "gallery": gallery.run,
    }


# ── Runner ────────────────────────────────────────────────────────────────────

async def run_crawler(name: str, fn: Callable[[], Awaitable[dict]]) -> dict:
    logger.info("=" * 60)
    logger.info("▶  Starting: %s", name.upper())
    logger.info("=" * 60)
    t0 = time.monotonic()
    try:
        result = await fn()
        elapsed = time.monotonic() - t0
        logger.info("✅ %s completed in %.1fs — %s", name.upper(), elapsed, result)
        return {"crawler": name, "status": "ok", "elapsed": round(elapsed, 1), **result}
    except Exception as exc:
        elapsed = time.monotonic() - t0
        logger.error("❌ %s FAILED in %.1fs: %s", name.upper(), elapsed, exc, exc_info=True)
        return {"crawler": name, "status": "error", "elapsed": round(elapsed, 1), "error": str(exc)}


async def main(selected: list[str]) -> None:
    setup_logging()

    # Validate env
    missing = Config.validate()
    if missing:
        logger.warning("Missing env vars (some crawlers may be skipped): %s", missing)

    crawlers = _load_crawlers()

    # Filter to selected
    if selected and selected != ["all"]:
        unknown = [s for s in selected if s not in crawlers]
        if unknown:
            logger.error("Unknown crawlers: %s. Valid: %s", unknown, list(crawlers))
            sys.exit(1)
        to_run = {k: v for k, v in crawlers.items() if k in selected}
    else:
        to_run = crawlers

    logger.info("Running %d crawler(s): %s", len(to_run), ", ".join(to_run))
    t_start = time.monotonic()

    results = []
    for name, fn in to_run.items():
        result = await run_crawler(name, fn)
        results.append(result)
        await asyncio.sleep(1)   # brief pause between crawlers

    total = time.monotonic() - t_start
    ok = [r for r in results if r["status"] == "ok"]
    failed = [r for r in results if r["status"] == "error"]

    logger.info("\n" + "=" * 60)
    logger.info("CRAWL COMPLETE — %.1fs total", total)
    logger.info("✅ Success: %d  ❌ Failed: %d", len(ok), len(failed))
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        logger.info("  %s %s — %.1fs", icon, r["crawler"], r["elapsed"])
    if failed:
        logger.error("Failures: %s", [r["crawler"] for r in failed])
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Riley Green site content crawlers")
    parser.add_argument(
        "--crawler",
        default="all",
        help="Comma-separated list of crawlers to run, or 'all' (default: all). "
             "Options: albums, tour, news, merch, videos, gallery",
    )
    args = parser.parse_args()
    selected = [c.strip() for c in args.crawler.split(",")]
    asyncio.run(main(selected))
