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
    """Search Deezer for Morgan Wallen and return the top artist match."""
    data = await _get(client, f"{DEEZER}/search/artist", {"q": Config.ARTIST_NAME, "strict": "on"})
    artists = data.get("data", [])
    if not artists:
        # Try without strict mode
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


# ── Transform ──────────────────────────────────────────────────────────────────

def _album_record(dz: dict) -> dict:
    title = dz.get("title", "")
    # cover_xl is highest quality (1000×1000)
    cover = dz.get("cover_xl") or dz.get("cover_big") or dz.get("cover")
    record_type = dz.get("record_type", "album").lower()
    release_date = dz.get("release_date") or None

    return {
        "title": title,
        "slug": slugify(title),
        "release_date": release_date,
        "cover_image": cover,
        "description": f"{title} — {record_type.title()} by Morgan Wallen"
                       + (f", released {release_date[:4]}." if release_date else "."),
        "spotify_url": None,
        "apple_music_url": None,
        "youtube_url": dz.get("link"),   # Deezer album page link
        "is_published": True,
    }


def _track_record(dz_track: dict, album_db_id: str) -> dict:
    return {
        "album_id": album_db_id,
        "title": dz_track.get("title", ""),
        "track_number": dz_track.get("track_position"),
        "duration_seconds": dz_track.get("duration"),   # Deezer returns seconds directly
        "spotify_url": None,
        "apple_music_url": None,
        "youtube_url": dz_track.get("link"),   # Deezer track page
        "is_published": True,
    }


# ── Main ───────────────────────────────────────────────────────────────────────

async def run() -> dict:
    db = SupabaseClient()
    stats = {"albums": 0, "tracks": 0, "errors": []}

    async with httpx.AsyncClient(timeout=Config.REQUEST_TIMEOUT) as client:
        # Find the artist
        logger.info("Searching Deezer for '%s'…", Config.ARTIST_NAME)
        artist = await _find_artist(client)
        if not artist:
            logger.error("Artist not found on Deezer — aborting")
            stats["errors"].append("Artist not found on Deezer")
            return stats

        artist_id = artist["id"]

        # Fetch all albums
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

        # Build album rows and deduplicate by slug (prevents ON CONFLICT affecting same row twice)
        slug_seen: set[str] = set()
        album_rows = []
        for a in unique_albums:
            row = _album_record(a)
            if row["slug"] not in slug_seen:
                slug_seen.add(row["slug"])
                album_rows.append(row)
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
                    await db.upsert("tracks", track_rows, on_conflict="album_id,track_number")
                    stats["tracks"] += len(track_rows)
                    logger.info("  ↳ %s — %d tracks", dz_album.get("title"), len(track_rows))
            except Exception as exc:
                logger.error("Tracks fetch failed for '%s': %s", dz_album.get("title"), exc)
                stats["errors"].append(str(exc))

            # Deezer is generous with rate limits but be polite
            await asyncio.sleep(0.3)

    logger.info("Albums done: %d albums, %d tracks", stats["albums"], stats["tracks"])
    return stats


if __name__ == "__main__":
    import utils; utils.setup_logging()
    asyncio.run(run())
