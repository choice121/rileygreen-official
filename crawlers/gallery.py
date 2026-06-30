"""
Gallery crawler — YouTube thumbnails + press/artist pages. No API key required.

Sources:
  1. YouTube channel RSS feed  → video thumbnails as "live" gallery category
  2. Channel page crawl        → additional thumbnails for more photos
  3. Official press crawl      → press/promo photos as "press" category

All images are either:
  a) Uploaded to ImageKit (if IMAGEKIT_PRIVATE_KEY is set) → stores IK path
  b) Stored as external thumbnail URL directly (if no IK key) → still works

Populates:
  • gallery_photos (title, imagekit_path, category, is_published, sort_order)
"""

import asyncio
import logging
import re
import xml.etree.ElementTree as ET

import httpx
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

from config import Config
from supabase_client import SupabaseClient
from imagekit_client import upload_image

logger = logging.getLogger(__name__)

CHANNEL_ID = Config.ARTIST_YOUTUBE_CHANNEL_ID
CHANNEL_HANDLES = [
    "https://www.youtube.com/@MorganWallen",
    "https://www.youtube.com/@MorganWallenMusic",
]

NS = {
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
    "atom": "http://www.w3.org/2005/Atom",
}

LIVE_KEYWORDS = ["live", "concert", "performance", "tour", "stadium", "arena", "show"]
BACKSTAGE_KEYWORDS = ["behind", "studio", "session", "vlog", "bts", "making", "diary", "day in"]


def _infer_photo_category(title: str) -> str:
    t = title.lower()
    if any(k in t for k in BACKSTAGE_KEYWORDS):
        return "backstage"
    if any(k in t for k in LIVE_KEYWORDS):
        return "live"
    return "live"   # default for video thumbnails


async def _fetch_rss_videos(client: httpx.AsyncClient) -> list[dict]:
    """Get videos from RSS feed — returns title + video_id pairs."""
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
    try:
        resp = await client.get(url, timeout=Config.REQUEST_TIMEOUT, follow_redirects=True)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        videos = []
        for entry in root.findall("atom:entry", NS):
            vid_id = entry.findtext("yt:videoId", namespaces=NS, default="")
            title = entry.findtext("atom:title", namespaces=NS, default="")
            if vid_id and title:
                videos.append({"video_id": vid_id, "title": title.strip()})
        return videos
    except Exception as exc:
        logger.warning("RSS fetch failed: %s", exc)
        return []


async def _crawl_channel_video_ids() -> list[str]:
    """Crawl channel page for additional video IDs beyond RSS limit."""
    ids: list[str] = []
    browser_config = BrowserConfig(headless=True, verbose=False)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for handle_url in CHANNEL_HANDLES:
            try:
                for scroll in range(4):
                    js = f"window.scrollTo(0, document.body.scrollHeight * {(scroll+1)/4});"
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
                        found = re.findall(r"watch\?v=([\w-]{11})", result.html or "")
                        ids.extend(found)
                    await asyncio.sleep(1)

                if ids:
                    logger.info("Crawled %d video IDs from channel page", len(ids))
                    break
            except Exception as exc:
                logger.warning("Channel page crawl failed for %s: %s", handle_url, exc)

    # Deduplicate
    seen: set[str] = set()
    unique: list[str] = []
    for vid in ids:
        if vid not in seen:
            seen.add(vid)
            unique.append(vid)
    return unique


async def _process_thumbnail(
    video_id: str,
    title: str,
    sort_order: int,
) -> dict | None:
    """
    Build a gallery_photos record from a YouTube video ID.
    Uploads to ImageKit if credentials available, otherwise stores thumbnail URL directly.
    """
    thumb_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    file_name = f"gallery-yt-{video_id}.jpg"
    category = _infer_photo_category(title)

    # Try to upload to ImageKit; fall back to storing URL directly
    path = await upload_image(thumb_url, file_name, f"/gallery/{category}")
    if not path:
        # Store the YouTube thumbnail URL directly in the imagekit_path field
        path = thumb_url

    return {
        "title": title[:200],
        "imagekit_path": path,
        "category": category,
        "taken_at": None,
        "is_published": True,
        "sort_order": sort_order,
    }


# ── Press/official photo crawl ────────────────────────────────────────────────

PRESS_SOURCES = [
    {
        "url": "https://www.morganwallen.com/",
        "category": "press",
        "label": "Official site",
    },
]

async def _crawl_press_photos() -> list[dict]:
    """Crawl official website for press/promotional photos."""
    photos: list[dict] = []
    browser_config = BrowserConfig(headless=True, verbose=False)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for source in PRESS_SOURCES:
            try:
                result = await crawler.arun(
                    url=source["url"],
                    config=CrawlerRunConfig(
                        cache_mode=CacheMode.BYPASS,
                        page_timeout=20000,
                    ),
                )
                if not result.success:
                    continue

                # Extract image URLs from HTML
                img_urls = re.findall(
                    r'(?:src|data-src)=["\']([^"\']+\.(?:jpg|jpeg|png|webp)[^"\']*)["\']',
                    result.html or "",
                    re.IGNORECASE,
                )
                # Filter for large/meaningful images
                meaningful = [
                    u for u in img_urls
                    if not any(skip in u.lower() for skip in ["icon", "logo", "favicon", "sprite", "pixel", "1x1"])
                    and len(u) > 30
                ]

                for idx, img_url in enumerate(meaningful[:20]):
                    if img_url.startswith("//"):
                        img_url = "https:" + img_url
                    if not img_url.startswith("http"):
                        continue
                    file_name = f"gallery-press-{source['category']}-{idx+1:03d}.jpg"
                    path = await upload_image(img_url, file_name, f"/gallery/{source['category']}")
                    if path:
                        photos.append({
                            "title": f"Morgan Wallen — {source['label']} Photo {idx+1}",
                            "imagekit_path": path,
                            "category": source["category"],
                            "taken_at": None,
                            "is_published": True,
                            "sort_order": 1000 + idx,
                        })

            except Exception as exc:
                logger.warning("Press crawl failed for %s: %s", source["url"], exc)
    return photos


# ── Main ──────────────────────────────────────────────────────────────────────

async def run() -> dict:
    db = SupabaseClient()
    stats = {"gallery_photos": 0, "errors": []}
    records: list[dict] = []

    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT) as client:
        # 1. Get videos from RSS (most reliable, 15 most recent)
        logger.info("Fetching RSS videos for gallery thumbnails…")
        rss_videos = await _fetch_rss_videos(client)
        logger.info("RSS returned %d videos", len(rss_videos))

    # 2. Crawl channel page for more video IDs
    logger.info("Crawling channel page for additional videos…")
    channel_ids = await _crawl_channel_video_ids()

    # Merge: RSS first (have titles), then extra IDs from page
    all_videos: list[dict] = list(rss_videos)
    rss_id_set = {v["video_id"] for v in rss_videos}
    for vid_id in channel_ids:
        if vid_id not in rss_id_set:
            all_videos.append({"video_id": vid_id, "title": f"Morgan Wallen — Live Performance"})
            rss_id_set.add(vid_id)

    logger.info("Processing %d total video thumbnails for gallery…", len(all_videos))

    # 3. Process thumbnails (limit to 80 for gallery)
    for idx, video in enumerate(all_videos[:80]):
        try:
            record = await _process_thumbnail(
                video["video_id"], video["title"], sort_order=idx + 1
            )
            if record:
                records.append(record)
        except Exception as exc:
            logger.warning("Thumbnail processing failed for %s: %s", video["video_id"], exc)

        # Small delay to avoid hammering ImageKit
        if idx % 10 == 9:
            await asyncio.sleep(1)

    # 4. Press photos (if ImageKit available)
    if Config.IMAGEKIT_PRIVATE_KEY:
        logger.info("Crawling press/official photos…")
        press = await _crawl_press_photos()
        records.extend(press)
        logger.info("Added %d press photos", len(press))

    # 5. Upsert
    if records:
        upserted = await db.upsert("gallery_photos", records, on_conflict="imagekit_path")
        stats["gallery_photos"] = len(upserted)

    logger.info("Gallery done: %d photos upserted", stats["gallery_photos"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
