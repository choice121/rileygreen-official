# Riley Green — Official Website

## Project Overview

Riley Green official website — React 18 + Vite + TypeScript + Tailwind CSS.

**Production stack:**
- **Frontend hosting:** Cloudflare Pages (auto-deploys from `main` branch)
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth) — project ref `yxspomuwawzsnsjpqxid`
- **Media CDN:** ImageKit (`https://ik.imagekit.io/Morganwallen`)
- **Email:** Supabase Edge Functions (Gmail SMTP)

> ⚠️ **This project does NOT run on Replit.** Replit is used as a code editor only. The app is deployed on Cloudflare Pages.

## Architecture

```
src/
├── components/
│   ├── admin/          # Admin panel sections (albums, gallery, merch, news, orders, subscribers, tour, videos)
│   ├── layout/         # Navbar, Footer
│   ├── sections/       # Home page sections (Hero, Music, Tour, News, Gallery, Videos, Merch, Newsletter)
│   └── ui/             # Reusable UI components (Button, FanCard, LoadingSpinner, etc.)
├── hooks/              # useAuth
├── lib/                # supabase.ts, imagekit.ts, email.ts
├── pages/              # Full page components
└── types/              # TypeScript types
crawlers/               # GitHub Actions Python crawlers (Deezer, YouTube, crawl4ai)
supabase/
├── functions/          # Edge Functions (send-email)
└── migrations/         # SQL migrations
```

## Key Pages

| Path | Description |
|------|-------------|
| `/` | Home — Hero, Music, Tour, News, Gallery, Videos, Merch, Newsletter |
| `/music` | Full discography |
| `/tour` | Cowboy As It Gets Tour 2026 dates |
| `/news` | News & blog posts |
| `/gallery` | Photo gallery with lightbox |
| `/videos` | Music videos |
| `/merch` | Official merch store |
| `/join` | Fan club signup |
| `/login` | Auth (email + Google OAuth) |
| `/account` | Fan account + fan card |
| `/contact` | Press, booking, fan mail |
| `/admin` | Admin panel (admin-only) |

## Environment Variables Required

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_IMAGEKIT_URL
VITE_IMAGEKIT_PUBLIC_KEY
```

## Content Crawlers

Automated GitHub Actions pipeline in `crawlers/` that populates Supabase from:
- **Albums/Tracks:** Deezer public API (Riley Green discography)
- **Tour Dates:** rileygreenmusic.com → Bandsintown → Songkick
- **News:** Taste of Country, Country Now, Rolling Stone, Billboard
- **Videos:** YouTube channel `UCSaJ4_YK4luUvkc9lDrwfKg`
- **Gallery:** YouTube thumbnails → ImageKit
- **Merch:** Official merch store crawl

## User Preferences

- This project is for Replit code editing only — never set up a Replit dev server or workflow for it.
- Deployment is always to Cloudflare Pages via Git push.
