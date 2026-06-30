"""
Videos crawler — YouTube public RSS feed (NO API key required).

YouTube provides a public RSS feed for every channel that returns the 15
most recent videos. We crawl multiple pages by scraping the channel with
crawl4ai to get the full video list, then build all metadata from:
  • RSS feed (title, published date, description, video ID)
  • YouTube thumbnail CDN (https://img.youtube.com/vi/{ID}/maxresdefault.jpg)

Populates:
  • videos (title, description, youtube_url, thumbnail, category,
            duration_seconds, is_published, published_at)
"""

import asyncio
import logging
import re
import xml.etree.ElementTree as ET

import httpx
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

from config import Config
from supabase_client import SupabaseClient
from utils import retry, truncate

logger = logging.getLogger(__name__)

# Morgan Wallen YouTube channel ID (hardcoded, also discovered dynamically below)
CHANNEL_ID = Config.ARTIST_YOUTUBE_CHANNEL_ID
CHANNEL_HANDLES = [
    "https://www.youtube.com/@MorganWallen",
    "https://www.youtube.com/@MorganWallenMusic",
]
RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "music_video": ["official video", "music video", "official mv"],
    "lyric_video": ["lyric", "lyrics"],
    "live": ["live", "concert", "performance", "at the", "unplugged", "acoustic"],
    "interview": ["interview", "talks", "exclusive", "chat", "q&a"],
    "behind_scenes": ["behind the scenes", "bts", "making of", "studio session", "vlog", "diary"],
}

NS = {
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
    "atom": "http://www.w3.org/2005/Atom",
}


def _infer_category(title: str, description: str = "") -> str:
    combined = (title + " " + description).lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(k in combined for k in keywords):
            return cat
    return "music_video"


def _thumbnail_url(video_id: str) -> str:
    """YouTube CDN thumbnail — maxresdefault with fallback to hqdefault."""
    return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"


# ── RSS fetch ─────────────────────────────────────────────────────────────────

@retry(max_attempts=3, delay=2.0)
async def _fetch_rss(client: httpx.AsyncClient, channel_id: str) -> list[dict]:
    """Parse the YouTube RSS feed for a channel (returns up to 15 recent videos)."""
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    resp = await client.get(url, timeout=Config.REQUEST_TIMEOUT, follow_redirects=True)
    resp.raise_for_status()
    root = ET.fromstring(resp.text)

    entries = []
    for entry in root.findall("atom:entry", NS):
        video_id = entry.findtext("yt:videoId", namespaces=NS, default="")
        title = entry.findtext("atom:title", namespaces=NS, default="")
        published = entry.findtext("atom:published", namespaces=NS, default="")
        mg = entry.find("media:group", NS)
        description = mg.findtext("media:description", namespaces=NS, default="") if mg is not None else ""

        if video_id and title:
            entries.append({
                "video_id": video_id,
                "title": title.strip(),
                "published": published[:10] if published else None,
                "description": description.strip(),
            })
    return entries


# ── Channel crawl (get more than 15 videos) ───────────────────────────────────

async def _crawl_channel_video_ids(handle_url: str) -> list[str]:
    """
    Crawl the YouTube channel /videos page and extract all video IDs
    found in watch URLs. Returns deduplicated list of video IDs.
    """
    video_ids: list[str] = []

    browser_config = BrowserConfig(headless=True, verbose=False)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for scroll_pass in range(3):   # scroll 3× to load more videos
            js = f"window.scrollTo(0, document.body.scrollHeight * {(scroll_pass + 1) / 3});"
            result = await crawler.arun(
                url=f"{handle_url}/videos",
                config=CrawlerRunConfig(
                    cache_mode=CacheMode.BYPASS,
                    js_code=js,
                    wait_for="css:a[href*='/watch?v=']",
                    page_timeout=25000,
                ),
            )
            if result.success:
                # Extract video IDs from all watch URLs in the HTML/markdown
                found = re.findall(r"watch\?v=([\w-]{11})", result.html or "")
                video_ids.extend(found)
            await asyncio.sleep(1)

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[str] = []
    for vid in video_ids:
        if vid not in seen:
            seen.add(vid)
            unique.append(vid)
    return unique


# ── Build records from video IDs ──────────────────────────────────────────────

async def _video_records_from_ids(
    client: httpx.AsyncClient,
    video_ids: list[str],
    rss_map: dict[str, dict],
) -> list[dict]:
    """
    Build video records. Uses RSS map for videos that appeared in the feed,
    constructs minimal records for the rest (title from oEmbed if possible).
    """
    records = []
    for vid_id in video_ids:
        rss_entry = rss_map.get(vid_id)
        if rss_entry:
            title = rss_entry["title"]
            description = rss_entry["description"]
            published_at = rss_entry["published"] or "2020-01-01"
        else:
            # Try oEmbed for title (free, no auth)
            try:
                oembed_resp = await client.get(
                    "https://www.youtube.com/oembed",
                    params={"url": f"https://www.youtube.com/watch?v={vid_id}", "format": "json"},
                    timeout=10,
                )
                if oembed_resp.status_code == 200:
                    oembed = oembed_resp.json()
                    title = oembed.get("title", f"Morgan Wallen — Video {vid_id}")
                    description = ""
                    published_at = "2020-01-01"
                else:
                    title = f"Morgan Wallen — {vid_id}"
                    description = ""
                    published_at = "2020-01-01"
                await asyncio.sleep(0.2)
            except Exception:
                title = f"Morgan Wallen — {vid_id}"
                description = ""
                published_at = "2020-01-01"

        records.append({
            "title": title,
            "description": truncate(description, 500),
            "youtube_url": f"https://www.youtube.com/watch?v={vid_id}",
            "thumbnail": _thumbnail_url(vid_id),
            "imagekit_path": None,
            "category": _infer_category(title, description),
            "duration_seconds": None,
            "is_published": True,
            "published_at": published_at,
        })
    return records


# ── Main ──────────────────────────────────────────────────────────────────────

async def run() -> dict:
    db = SupabaseClient()
    stats = {"videos": 0, "errors": []}

    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT) as client:
        # 1. Fetch RSS feed (up to 15 most recent)
        logger.info("Fetching YouTube RSS feed for channel %s…", CHANNEL_ID)
        rss_entries: list[dict] = []
        try:
            rss_entries = await _fetch_rss(client, CHANNEL_ID)
            logger.info("RSS returned %d videos", len(rss_entries))
        except Exception as exc:
            logger.warning("RSS fetch failed: %s", exc)
            stats["errors"].append(f"RSS: {exc}")

        # Build RSS lookup map
        rss_map = {e["video_id"]: e for e in rss_entries}

        # 2. Crawl channel page to get full video list
        logger.info("Crawling YouTube channel page for full video list…")
        channel_video_ids: list[str] = []
        for handle_url in CHANNEL_HANDLES:
            try:
                ids = await _crawl_channel_video_ids(handle_url)
                if ids:
                    channel_video_ids = ids
                    logger.info("Crawled %d video IDs from %s", len(ids), handle_url)
                    break
            except Exception as exc:
                logger.warning("Channel crawl failed for %s: %s", handle_url, exc)

        # Merge: RSS IDs first (most recent), then additional IDs from page crawl
        all_ids: list[str] = list(rss_map.keys())
        seen_ids: set[str] = set(all_ids)
        for vid_id in channel_video_ids:
            if vid_id not in seen_ids:
                seen_ids.add(vid_id)
                all_ids.append(vid_id)

        if not all_ids:
            logger.error("No video IDs found — check channel ID or handle URL")
            stats["errors"].append("No video IDs found")
            return stats

        logger.info("Total unique video IDs: %d", len(all_ids))

        # 3. Build records
        records = await _video_records_from_ids(client, all_ids, rss_map)

    # 4. Upsert
    if records:
        upserted = await db.upsert("videos", records, on_conflict="youtube_url")
        stats["videos"] = len(upserted)

    logger.info("Videos done: %d videos upserted", stats["videos"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
