"""
Central configuration — reads from environment variables.
Copy .env.example to .env for local development.
In GitHub Actions, set all variables as repository secrets.

All crawlers work WITHOUT Spotify or YouTube API keys:
  • Albums/Tracks  → Deezer public API (no key)
  • Videos         → YouTube public RSS feed + channel crawl (no key)
  • Gallery        → YouTube thumbnail CDN (no key)
  • Tour           → Bandsintown public API (no key)
  • News/Merch     → crawl4ai (no key)
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Supabase (REQUIRED) ───────────────────────────────────────────────────
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://yxspomuwawzsnsjpqxid.supabase.co")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # ── ImageKit (OPTIONAL — gallery/albums still work without it) ────────────
    IMAGEKIT_PRIVATE_KEY: str = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
    IMAGEKIT_PUBLIC_KEY: str = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
    IMAGEKIT_URL_ENDPOINT: str = "https://ik.imagekit.io/Morganwallen"

    # ── Spotify (NOT REQUIRED — Deezer is used instead) ───────────────────────
    # Kept for reference only; crawlers do not use these.
    SPOTIFY_CLIENT_ID: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    SPOTIFY_CLIENT_SECRET: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")

    # ── YouTube API (NOT REQUIRED — RSS feed + crawl4ai used instead) ─────────
    # Kept for reference only; crawlers do not use these.
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

    # ── Artist constants ──────────────────────────────────────────────────────
    ARTIST_NAME: str = "Riley Green"
    ARTIST_SPOTIFY_ID: str = "4oUHIQIBe0LHzYfvXgpM2U"     # unused (kept for reference)
    ARTIST_YOUTUBE_CHANNEL_ID: str = "UCzIyoPv6j1MAZpDHKLGP_eA"  # Riley Green official (verified)

    # ── Crawl settings ────────────────────────────────────────────────────────
    REQUEST_TIMEOUT: int = 30
    MAX_RETRIES: int = 3
    CRAWL_DELAY: float = 1.0

    @classmethod
    def validate(cls) -> list[str]:
        """Return list of missing REQUIRED env vars (only Supabase)."""
        missing = []
        if not cls.SUPABASE_SERVICE_KEY:
            missing.append("SUPABASE_SERVICE_KEY")
        return missing
