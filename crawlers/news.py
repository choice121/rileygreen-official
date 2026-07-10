"""
News crawler — crawl4ai on multiple country music news sites.

Sources:
  • Taste of Country  — tasteofcountry.com/tags/riley-green/
  • Country Now       — countrynow.com/?s=morgan+wallen
  • Rolling Stone     — rollingstone.com/t/riley-green/
  • Billboard         — billboard.com/t/riley-green/

Populates:
  • news_posts (title, slug, excerpt, content, cover_image,
                category, is_published, published_at)
"""

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timezone

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

from config import Config
from supabase_client import SupabaseClient
from utils import slugify, truncate, retry

logger = logging.getLogger(__name__)

MAX_ARTICLES_PER_SOURCE = 12
MAX_CONTENT_LENGTH = 8000

# ── Source definitions ─────────────────────────────────────────────────────────

SOURCES = [
    {
        "name": "Taste of Country",
        "url": "https://tasteofcountry.com/tags/riley-green/",
        "listing_schema": {
            "name": "Articles",
            "baseSelector": "article, .article-list-item, .post",
            "fields": [
                {"name": "title", "selector": "h2, h3, .article-title, .entry-title", "type": "text"},
                {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
                {"name": "excerpt", "selector": "p, .excerpt, .article-excerpt", "type": "text"},
                {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
                {"name": "date", "selector": "time, .date, .published, [datetime]", "type": "attribute", "attribute": "datetime"},
            ],
        },
        "category": "news",
        "domain": "tasteofcountry.com",
    },
    {
        "name": "Country Now",
        "url": "https://countrynow.com/?s=morgan+wallen",
        "listing_schema": {
            "name": "Articles",
            "baseSelector": "article, .post, .entry",
            "fields": [
                {"name": "title", "selector": "h2, h3, .entry-title", "type": "text"},
                {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
                {"name": "excerpt", "selector": "p, .entry-summary", "type": "text"},
                {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
                {"name": "date", "selector": "time, .entry-date, [datetime]", "type": "attribute", "attribute": "datetime"},
            ],
        },
        "category": "news",
        "domain": "countrynow.com",
    },
    {
        "name": "Rolling Stone",
        "url": "https://www.rollingstone.com/t/riley-green/",
        "listing_schema": {
            "name": "Articles",
            "baseSelector": "article, .c-card, .c-featured-card",
            "fields": [
                {"name": "title", "selector": "h2, h3, .c-title", "type": "text"},
                {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
                {"name": "excerpt", "selector": "p, .c-dek", "type": "text"},
                {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
                {"name": "date", "selector": "time, .c-timestamp, [datetime]", "type": "attribute", "attribute": "datetime"},
            ],
        },
        "category": "news",
        "domain": "rollingstone.com",
    },
    {
        "name": "Billboard",
        "url": "https://www.billboard.com/t/riley-green/",
        "listing_schema": {
            "name": "Articles",
            "baseSelector": "article, .article-item, .lrv-a-grid-item",
            "fields": [
                {"name": "title", "selector": "h2, h3, .article__title", "type": "text"},
                {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
                {"name": "excerpt", "selector": "p, .article__description", "type": "text"},
                {"name": "image", "selector": "img", "type": "attribute", "attribute": "src"},
                {"name": "date", "selector": "time, .article__timestamp, [datetime]", "type": "attribute", "attribute": "datetime"},
            ],
        },
        "category": "news",
        "domain": "billboard.com",
    },
]


# ── Date parsing ───────────────────────────────────────────────────────────────

# Extra formats news sites commonly emit in <time datetime="...">
_DATE_FORMATS = [
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%MZ",
    "%Y-%m-%d",
    "%B %d, %Y",
    "%b %d, %Y",
    "%b. %d, %Y",
    "%d %B %Y",
    "%B %Y",
]


def _parse_article_date(raw: str | None) -> str | None:
    """
    Parse a date string from a news article into ISO YYYY-MM-DD.
    Handles ISO 8601, US formats, and short relative strings.
    Returns None if nothing matches.
    """
    if not raw:
        return None
    raw = raw.strip()

    # Quick check: already YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", raw):
        return raw

    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(raw[:len(fmt) + 6], fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Regex fallback: grab YYYY-MM-DD from any ISO-ish string
    m = re.search(r"(\d{4}-\d{2}-\d{2})", raw)
    if m:
        return m.group(1)

    # "X hours/days ago" — not precise enough to store
    return None


def _extract_date_from_markdown(markdown: str) -> str | None:
    """
    Scan article markdown for a date. Looks for ISO dates and common patterns.
    """
    # ISO date in text
    m = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", markdown)
    if m:
        return m.group(1)
    # "Month DD, YYYY" pattern
    m = re.search(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+(\d{1,2}),?\s+(\d{4})\b",
        markdown
    )
    if m:
        try:
            dt = datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%B %d %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass
    return None


# ── Category inference ─────────────────────────────────────────────────────────

def _infer_category(title: str) -> str:
    title = title.lower()
    if any(k in title for k in ["tour", "concert", "ticket", "show", "perform"]):
        return "tour"
    if any(k in title for k in ["album", "song", "music", "track", "release", "single", "ep"]):
        return "music"
    if any(k in title for k in ["video", "watch", "mv", "clip"]):
        return "video"
    if any(k in title for k in ["award", "grammy", "cma", "acm"]):
        return "news"
    return "news"


# ── Parse listing page ─────────────────────────────────────────────────────────

def _normalize_url(url: str, domain: str) -> str | None:
    if not url:
        return None
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return f"https://www.{domain}{url}"
    if url.startswith("http"):
        return url
    return None


def _parse_listing_markdown(markdown: str, domain: str) -> list[dict]:
    links = []
    pattern = re.compile(r"\[([^\]]{10,200})\]\((https?://[^\)]+)\)")
    for m in pattern.finditer(markdown):
        title = m.group(1).strip()
        url = m.group(2).strip()
        if domain in url and "morgan" in (title + url).lower():
            links.append({"title": title, "url": url, "excerpt": "", "image": None, "date": None})
    return links[:MAX_ARTICLES_PER_SOURCE]


# ── Crawl full article ─────────────────────────────────────────────────────────

async def _crawl_article(crawler: AsyncWebCrawler, url: str) -> dict | None:
    try:
        result = await crawler.arun(
            url=url,
            config=CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                word_count_threshold=50,
            ),
        )
        if not result.success:
            return None
        md = result.markdown or ""
        lines = [l for l in md.split("\n") if len(l.strip()) > 30]
        content = "\n\n".join(lines)[:MAX_CONTENT_LENGTH]
        # Try to extract a date from the article body
        date_from_body = _extract_date_from_markdown(md)
        return {"content": content, "markdown": md, "date_from_body": date_from_body}
    except Exception as exc:
        logger.warning("Article crawl failed for %s: %s", url, exc)
        return None


# ── Main ──────────────────────────────────────────────────────────────────────

async def run() -> dict:
    db = SupabaseClient()
    stats = {"news_posts": 0, "errors": []}

    browser_config = BrowserConfig(headless=True, verbose=False)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for source in SOURCES:
            logger.info("Crawling %s…", source["name"])
            try:
                strategy = JsonCssExtractionStrategy(source["listing_schema"], verbose=False)
                listing_result = await crawler.arun(
                    url=source["url"],
                    config=CrawlerRunConfig(
                        extraction_strategy=strategy,
                        cache_mode=CacheMode.BYPASS,
                        wait_for="css:article, .post, .entry, .article",
                        page_timeout=20000,
                    ),
                )

                articles: list[dict] = []
                if listing_result.success and listing_result.extracted_content:
                    import json as _json
                    try:
                        raw = _json.loads(listing_result.extracted_content)
                        articles = [a for a in raw if a.get("url") and a.get("title")][:MAX_ARTICLES_PER_SOURCE]
                    except Exception:
                        pass

                if not articles and listing_result.markdown:
                    articles = _parse_listing_markdown(listing_result.markdown, source["domain"])

                logger.info("  Found %d articles on %s", len(articles), source["name"])

                records = []
                for article in articles:
                    url = _normalize_url(article.get("url", ""), source["domain"])
                    title = (article.get("title") or "").strip()
                    if not url or not title or len(title) < 5:
                        continue

                    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
                    slug = slugify(title)[:80] + "-" + url_hash
                    excerpt = truncate((article.get("excerpt") or "").strip(), 280)

                    # Crawl full article for content + date extraction
                    full = await _crawl_article(crawler, url)
                    content = full["content"] if full else excerpt

                    # Parse published_at: try listing date first, then body
                    raw_date = article.get("date") or ""
                    published_at = _parse_article_date(raw_date)
                    if not published_at and full and full.get("date_from_body"):
                        published_at = full["date_from_body"]

                    records.append({
                        "title": title,
                        "slug": slug,
                        "excerpt": excerpt or truncate(content, 280),
                        "content": content,
                        "cover_image": article.get("image") or None,
                        "category": _infer_category(title),
                        "is_published": True,
                        "published_at": published_at,
                    })

                    await asyncio.sleep(Config.CRAWL_DELAY)

                if records:
                    upserted = await db.upsert("news_posts", records, on_conflict="slug")
                    stats["news_posts"] += len(upserted)
                    logger.info("  ↳ Upserted %d posts from %s", len(upserted), source["name"])

            except Exception as exc:
                logger.error("Source %s failed: %s", source["name"], exc)
                stats["errors"].append(f"{source['name']}: {exc}")

            await asyncio.sleep(2)

    logger.info("News done: %d posts total", stats["news_posts"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
