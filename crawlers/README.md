# Riley Green — Automated Content Crawlers

Fully automated pipeline that populates every section of the Riley Green official site with real, live data — no manual CMS entry required.

## What It Does

| Crawler | Source | Supabase Table | Schedule |
|---|---|---|---|
| `albums` | Spotify Web API | `albums` + `tracks` | Weekly |
| `tour` | Bandsintown API | `tour_dates` | Every 6 hours |
| `news` | Billboard, Rolling Stone, Taste of Country, Country Now | `news_posts` | Every 2 hours |
| `merch` | Official merch store | `merch_items` | Daily |
| `videos` | YouTube Data API | `videos` | Daily |
| `gallery` | YouTube thumbnails → ImageKit | `gallery_photos` | Daily |

All crawlers are **idempotent** — re-running them will upsert (update or insert) without creating duplicates.

## Required Secrets

Add these as GitHub Actions repository secrets (Settings → Secrets → Actions):

| Secret | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `SPOTIFY_CLIENT_ID` | [developer.spotify.com](https://developer.spotify.com/dashboard) → Create App |
| `SPOTIFY_CLIENT_SECRET` | Same Spotify app |
| `YOUTUBE_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → APIs → YouTube Data API v3 |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit Dashboard → Developer Options (optional) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit Dashboard → Developer Options (optional) |

## Manual Run (GitHub Actions)

1. Go to **Actions** tab in GitHub
2. Click **🎸 Riley Green — Content Crawlers**
3. Click **Run workflow**
4. Choose which crawler to run (or "all")
5. Click **Run workflow**

## Local Development

```bash
cd crawlers
cp .env.example .env
# Fill in .env with your credentials
pip install -r requirements.txt
crawl4ai-setup   # installs Playwright browsers

# Run all crawlers
python run_all.py

# Run one crawler
python run_all.py --crawler albums
python run_all.py --crawler tour
python run_all.py --crawler news
python run_all.py --crawler merch
python run_all.py --crawler videos
python run_all.py --crawler gallery

# Or run individual files
python albums.py
python tour.py
```

## Architecture

```
crawlers/
├── config.py           # All env vars in one place
├── supabase_client.py  # REST API upsert helper
├── imagekit_client.py  # Image upload helper
├── utils.py            # slugify, retry, logging, date parsing
├── albums.py           # Spotify → albums + tracks
├── tour.py             # Bandsintown → tour_dates
├── news.py             # crawl4ai → news_posts (4 sources)
├── merch.py            # crawl4ai → merch_items
├── videos.py           # YouTube API → videos
├── gallery.py          # YouTube thumbnails → gallery_photos
└── run_all.py          # Main orchestrator (--crawler flag)
```

## Deduplication

Each crawler uses Supabase's `ON CONFLICT` upsert:

| Table | Conflict Key |
|---|---|
| `albums` | `slug` |
| `tracks` | `album_id, track_number` |
| `tour_dates` | `event_date, venue` |
| `news_posts` | `slug` |
| `merch_items` | `name` |
| `videos` | `youtube_url` |
| `gallery_photos` | `imagekit_path` |

## Deployment Notes

- This pipeline is **separate from the Cloudflare Pages frontend**.
- It writes to Supabase directly; Cloudflare Pages serves the React app that reads Supabase.
- No Replit involvement — this runs entirely on GitHub Actions runners.
