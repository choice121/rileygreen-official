"""
Albums & Tracks crawler — Deezer public API (no API key required).

Deezer is a completely free, public music database with full discography,
cover art, and track data. No authentication needed.

Populates:
  • albums  (title, slug, release_date, cover_image, description,
             spotify_url, apple_music_url, is_published)
  • tracks  (album_id, title, track_number, duration_seconds,
             spotify_url, apple_music_url, is_published)
"""

import asyncio
import logging

import httpx

from config import Config
from imagekit_client import upload_image
from supabase_client import SupabaseClient
from utils import slugify, retry

logger = logging.getLogger(__name__)

DEEZER = "https://api.deezer.com"
HEADERS = {"Accept": "application/json"}


# ── Fetch ──────────────────────────────────────────────────────────────────────

@retry(max_attempts=3, delay=2.0)
async def _get(client: httpx.AsyncClient, url: str, params: dict = None) -> dict:
    resp = await client.get(url, params=params, headers=HEADERS, timeout=Config.REQUEST_TIMEOUT)
    resp.raise_for_status()
    return resp.json()


async def _find_artist(client: httpx.AsyncClient) -> dict | None:
    """Search Deezer for Riley Green and return the top artist match."""
    data = await _get(client, f"{DEEZER}/search/artist", {"q": Config.ARTIST_NAME, "strict": "on"})
    artists = data.get("data", [])
    if not artists:
        data = await _get(client, f"{DEEZER}/search/artist", {"q": Config.ARTIST_NAME})
        artists = data.get("data", [])
    for a in artists:
        if Config.ARTIST_NAME.lower() in a.get("name", "").lower():
            logger.info("Found artist on Deezer: %s (id=%s, fans=%s)", a["name"], a["id"], a.get("nb_fan"))
            return a
    return None


async def _get_albums(client: httpx.AsyncClient, artist_id: int) -> list[dict]:
    """Fetch all releases for the artist."""
    albums = []
    index = 0
    while True:
        data = await _get(client, f"{DEEZER}/artist/{artist_id}/albums", {"index": index, "limit": 50})
        batch = data.get("data", [])
        albums.extend(batch)
        if data.get("next") is None or not batch:
            break
        index += 50
        await asyncio.sleep(0.5)
    return albums


@retry(max_attempts=3, delay=1.5)
async def _get_tracks(client: httpx.AsyncClient, album_id: int) -> list[dict]:
    data = await _get(client, f"{DEEZER}/album/{album_id}/tracks")
    return data.get("data", [])


# ── ImageKit upload ────────────────────────────────────────────────────────────

async def _upload_cover(cover_url: str, slug: str) -> str | None:
    """
    Upload a Deezer album cover to ImageKit.
    Returns the IK filePath or None if upload fails / no IK key configured.
    Falls back gracefully so the crawler still upserts with the original URL.
    """
    if not Config.IMAGEKIT_PRIVATE_KEY:
        logger.debug("No IMAGEKIT_PRIVATE_KEY — using Deezer CDN URL for cover")
        return None
    if not cover_url:
        return None
    file_name = f"{slug}.jpg"
    return await upload_image(cover_url, file_name, "/albums")


# ── Transform ──────────────────────────────────────────────────────────────────

def _album_record(dz: dict, ik_path: str | None) -> dict:
    title = dz.get("title", "")
    cover = ik_path or dz.get("cover_xl") or dz.get("cover_big") or dz.get("cover")
    record_type = dz.get("record_type", "album").lower()
    release_date = dz.get("release_date") or None

    return {
        "title": title,
        "slug": slugify(title),
        "release_date": release_date,
        "cover_image": cover,
        "description": f"{title} — {record_type.title()} by Riley Green"
                       + (f", released {release_date[:4]}." if release_date else "."),
        "spotify_url": None,
        "apple_music_url": None,
        "youtube_url": dz.get("link"),
        "is_published": True,
    }


def _track_record(dz_track: dict, album_db_id: str) -> dict:
    return {
        "album_id": album_db_id,
        "title": dz_track.get("title", ""),
        "track_number": dz_track.get("track_position"),
        "duration_seconds": dz_track.get("duration"),
        "spotify_url": None,
        "apple_music_url": None,
        "youtube_url": dz_track.get("link"),
        "is_published": True,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

async def run() -> dict:
    db = SupabaseClient()
    stats = {"albums": 0, "tracks": 0, "errors": []}

    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT) as client:
        logger.info("Searching Deezer for '%s'…", Config.ARTIST_NAME)
        artist = await _find_artist(client)
        if not artist:
            logger.error("Artist not found on Deezer — aborting")
            stats["errors"].append("Artist not found on Deezer")
            return stats

        artist_id = artist["id"]

        logger.info("Fetching discography from Deezer (artist id=%s)…", artist_id)
        dz_albums = await _get_albums(client, artist_id)
        logger.info("Found %d releases on Deezer", len(dz_albums))

        # Deduplicate by normalized title
        seen: set[str] = set()
        unique_albums = []
        for a in dz_albums:
            key = a.get("title", "").lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique_albums.append(a)

        logger.info("After deduplication: %d unique releases", len(unique_albums))

        # Build album rows — upload covers to ImageKit when possible
        slug_seen: set[str] = set()
        album_rows = []
        for a in unique_albums:
            slug = slugify(a.get("title", ""))
            if slug in slug_seen:
                continue
            slug_seen.add(slug)

            # Upload cover to ImageKit (falls back to Deezer URL if unavailable)
            cover_url = a.get("cover_xl") or a.get("cover_big") or a.get("cover")
            ik_path = await _upload_cover(cover_url, slug)
            if ik_path:
                logger.info("  ↳ Uploaded cover for '%s' → %s", a.get("title"), ik_path)
            else:
                logger.debug("  ↳ Using Deezer CDN URL for '%s'", a.get("title"))

            album_rows.append(_album_record(a, ik_path))

            # Small delay to avoid hammering ImageKit
            await asyncio.sleep(0.2)

        logger.info("Unique slugs to upsert: %d", len(album_rows))

        upserted = await db.upsert("albums", album_rows, on_conflict="slug")
        stats["albums"] = len(upserted)

        # Build slug→id map
        id_map = {row["slug"]: row["id"] for row in upserted}

        # Upsert tracks per album
        for dz_album in unique_albums:
            slug = slugify(dz_album.get("title", ""))
            album_db_id = id_map.get(slug)
            if not album_db_id:
                logger.warning("No DB id found for album slug '%s'", slug)
                continue

            try:
                dz_tracks = await _get_tracks(client, dz_album["id"])
                if dz_tracks:
                    track_rows = [_track_record(t, album_db_id) for t in dz_tracks]
                    seen_tn: set = set()
                    track_rows = [r for r in track_rows
                                  if r["track_number"] not in seen_tn
                                  and not seen_tn.add(r["track_number"])]  # type: ignore[func-returns-value]
                    await db.upsert("tracks", track_rows, on_conflict="album_id,track_number")
                    stats["tracks"] += len(track_rows)
                    logger.info("  ↳ %s — %d tracks", dz_album.get("title"), len(track_rows))
            except Exception as exc:
                logger.error("Tracks fetch failed for '%s': %s", dz_album.get("title"), exc)
                stats["errors"].append(str(exc))

            await asyncio.sleep(0.3)

    logger.info("Albums done: %d albums, %d tracks", stats["albums"], stats["tracks"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
