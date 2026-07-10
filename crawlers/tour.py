"""
Tour Dates crawler — scrapes multiple public sources.

Primary: rileygreen.com official tour page
Fallback: Bandsintown artist page (web, not API — Bandsintown REST API requires key as of 2026)
Fallback: Songkick artist page

Populates:
  • tour_dates (event_date, event_time, city, state, country,
                venue, ticket_url, is_sold_out, is_cancelled)
"""

import asyncio
import logging
import re
from datetime import datetime

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

from config import Config
from supabase_client import SupabaseClient

logger = logging.getLogger(__name__)

TOUR_SOURCES = [
    {
        "name": "Riley Green Official",
        "url": "https://www.rileygreenmusic.com/tour",
        "fallback_url": "https://www.rileygreenmusic.com/",
    },
    {
        "name": "Bandsintown (web)",
        "url": "https://www.bandsintown.com/a/1316779-riley-green",
    },
    {
        "name": "Songkick",
        "url": "https://www.songkick.com/artists/9016389-riley-green",
    },
]

# CSS schemas for different sites
OFFICIAL_SCHEMA = {
    "name": "TourDates",
    "baseSelector": ".tour-date, .event, [class*='tour'], [class*='event'], li[class*='show']",
    "fields": [
        {"name": "date",   "selector": "[class*='date'], time, .date",          "type": "text"},
        {"name": "venue",  "selector": "[class*='venue'], .venue",               "type": "text"},
        {"name": "city",   "selector": "[class*='city'], .city, [class*='location']", "type": "text"},
        {"name": "ticket", "selector": "a[href*='ticket'], a[href*='buy']",     "type": "attribute", "attribute": "href"},
        {"name": "status", "selector": "[class*='sold'], [class*='cancel']",    "type": "text"},
    ],
}

MONTH_MAP = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    "january": 1, "february": 2, "march": 3, "april": 4, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}

DATE_FORMATS = [
    "%B %d, %Y", "%b %d, %Y", "%b. %d, %Y",
    "%m/%d/%Y", "%Y-%m-%d", "%d %B %Y",
    "%B %d", "%b %d",
]


def _parse_date(raw: str) -> str | None:
    """Parse various date formats into YYYY-MM-DD."""
    if not raw:
        return None
    raw = raw.strip()

    # ISO date
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", raw)
    if m:
        return m.group(1)

    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(raw[:40], fmt)
            year = dt.year if dt.year != 1900 else datetime.now().year
            return f"{year}-{dt.month:02d}-{dt.day:02d}"
        except ValueError:
            continue

    # "Jul 18", "July 18 2026", etc.
    m = re.search(
        r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:[,\s]+(\d{4}))?",
        raw.lower()
    )
    if m:
        mon = MONTH_MAP.get(m.group(1), 1)
        day = int(m.group(2))
        year = int(m.group(3)) if m.group(3) else datetime.now().year
        return f"{year}-{mon:02d}-{day:02d}"

    return None


def _extract_state(city_str: str) -> tuple[str, str]:
    """Split 'Nashville, TN' → ('Nashville', 'TN')."""
    if not city_str:
        return "", ""
    parts = [p.strip() for p in city_str.split(",")]
    if len(parts) >= 2:
        return parts[0], parts[-1][:2].upper()
    return city_str.strip(), ""


def _parse_markdown_events(markdown: str) -> list[dict]:
    """
    Fallback: extract structured event data from page markdown.
    Looks for date-venue-city patterns in the rendered text.
    """
    events = []
    lines = [l.strip() for l in markdown.split("\n") if l.strip()]

    i = 0
    while i < len(lines):
        line = lines[i]
        date = _parse_date(line)
        if date:
            # Collect next few lines for venue/city
            venue = ""
            city = ""
            ticket = ""
            for j in range(i + 1, min(i + 5, len(lines))):
                nxt = lines[j]
                if not venue and len(nxt) > 3 and not _parse_date(nxt):
                    venue = nxt[:100]
                elif not city and len(nxt) > 3 and not _parse_date(nxt) and nxt != venue:
                    city = nxt[:100]
                if "ticket" in nxt.lower() or "buy" in nxt.lower():
                    url_match = re.search(r"https?://[^\s\)]+", nxt)
                    if url_match:
                        ticket = url_match.group()

            if venue:
                city_name, state = _extract_state(city or venue)
                events.append({
                    "event_date": date,
                    "event_time": None,
                    "city": city_name,
                    "state": state,
                    "country": "United States",
                    "venue": venue,
                    "ticket_url": ticket or None,
                    "is_sold_out": False,
                    "is_cancelled": False,
                })
        i += 1

    return events


async def _crawl_source(crawler: AsyncWebCrawler, url: str, name: str) -> list[dict]:
    """Crawl a tour source URL and extract events."""
    events = []
    logger.info("Crawling %s (%s)…", name, url)

    try:
        # CSS extraction attempt
        strategy = JsonCssExtractionStrategy(OFFICIAL_SCHEMA, verbose=False)
        result = await crawler.arun(
            url=url,
            config=CrawlerRunConfig(
                extraction_strategy=strategy,
                cache_mode=CacheMode.BYPASS,
                wait_for="css:[class*='tour'], [class*='event'], [class*='date']",
                page_timeout=25000,
                js_code="window.scrollTo(0, document.body.scrollHeight);",
            ),
        )

        if result.success and result.extracted_content:
            import json as _json
            try:
                items = _json.loads(result.extracted_content)
                for item in items:
                    date = _parse_date(item.get("date", ""))
                    if not date:
                        continue
                    venue = (item.get("venue") or "").strip()
                    city_raw = (item.get("city") or "").strip()
                    city_name, state = _extract_state(city_raw or venue)
                    ticket = item.get("ticket", "") or ""
                    status = (item.get("status") or "").lower()
                    events.append({
                        "event_date": date,
                        "event_time": None,
                        "city": city_name,
                        "state": state,
                        "country": "United States",
                        "venue": venue or city_name,
                        "ticket_url": ticket if ticket.startswith("http") else None,
                        "is_sold_out": "sold" in status,
                        "is_cancelled": "cancel" in status,
                    })
            except Exception:
                pass

        # Markdown fallback
        if not events and result.success and result.markdown:
            events = _parse_markdown_events(result.markdown)

        logger.info("  %s: found %d events", name, len(events))

    except Exception as exc:
        logger.warning("Source %s failed: %s", name, exc)

    return events


def _dedup(events: list[dict]) -> list[dict]:
    """Deduplicate by event_date + venue (case-insensitive)."""
    seen: set[tuple] = set()
    unique = []
    for e in events:
        key = (e.get("event_date", ""), (e.get("venue") or "").lower().strip()[:30])
        if key not in seen:
            seen.add(key)
            unique.append(e)
    return unique


async def run() -> dict:
    db = SupabaseClient()
    stats = {"tour_dates": 0, "errors": []}

    browser_config = BrowserConfig(headless=True, verbose=False)
    all_events: list[dict] = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for source in TOUR_SOURCES:
            try:
                url = source["url"]
                events = await _crawl_source(crawler, url, source["name"])

                # Try fallback URL if primary gave nothing
                if not events and source.get("fallback_url"):
                    events = await _crawl_source(crawler, source["fallback_url"], source["name"] + " (fallback)")

                all_events.extend(events)

                # If we have enough from the official site, stop
                if len(all_events) >= 5 and source["name"] == "Riley Green Official":
                    logger.info("Got sufficient events from official site — skipping fallback sources")
                    break

            except Exception as exc:
                logger.error("Source %s error: %s", source["name"], exc)
                stats["errors"].append(str(exc))

            await asyncio.sleep(2)

    events = _dedup(all_events)
    # Filter past dates and invalid entries
    from datetime import date as dt_date
    today = dt_date.today().isoformat()
    valid = [
        e for e in events
        if e.get("event_date", "") >= today and e.get("venue")
    ]

    logger.info("Found %d valid upcoming events after dedup + filter", len(valid))

    if valid:
        upserted = await db.upsert("tour_dates", valid, on_conflict="event_date,venue")
        stats["tour_dates"] = len(upserted)
    else:
        logger.warning("No new tour dates found — existing DB data preserved")

    logger.info("Tour done: %d dates upserted", stats["tour_dates"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
