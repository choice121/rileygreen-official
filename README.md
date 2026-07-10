# Riley Green — Official Website

A beautiful, modern, fully responsive official website for country music artist Riley Green.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (custom dark/gold theme)
- **Animations:** Framer Motion
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Media:** ImageKit (`https://ik.imagekit.io/Morganwallen`)
- **Email:** Google SMTP via Supabase Edge Functions
- **Hosting:** Cloudflare Pages

## Features

- 🎸 **Music** — Albums, tracks, streaming links
- 🎟️ **Tour Dates** — Upcoming shows with ticket links (Cowboy As It Gets Tour)
- 📰 **News & Blog** — CMS-managed articles
- 🖼️ **Photo Gallery** — Lightbox gallery with category filtering
- 🎬 **Videos** — Music videos and live footage
- 🛍️ **Merch** — Official merchandise store
- 📧 **Newsletter** — Email signup with confirmation
- 👤 **Fan Accounts** — Supabase Auth (email + Google OAuth)
- 📬 **Contact Form** — Press, booking, fan mail

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://yxspomuwawzsnsjpqxid.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_IMAGEKIT_URL=https://ik.imagekit.io/Morganwallen
VITE_IMAGEKIT_PUBLIC_KEY=your-public-key
```

## Cloudflare Pages Build Settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` |

**Environment Variables in Cloudflare Pages Dashboard:**
Add all `VITE_*` variables in Settings → Environment Variables.

## Replacing Placeholder Content

All content is stored in Supabase. To update:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → Table Editor
3. Update any table (`albums`, `tour_dates`, `news_posts`, `merch_items`, `gallery_photos`, `videos`)

### Replacing Images

Upload real images to ImageKit (`https://ik.imagekit.io/Morganwallen`) and update the `imagekit_path` field in Supabase to the uploaded file path.

## Email (Supabase Edge Functions)

The `supabase/functions/send-email/` function handles email delivery via Gmail SMTP.

**Deploy it once:**
```bash
npm install -g supabase
supabase login
supabase functions deploy send-email --project-ref yxspomuwawzsnsjpqxid
supabase secrets set GMAIL_ADDRESS=choicepropertyofficial1@gmail.com --project-ref yxspomuwawzsnsjpqxid
supabase secrets set GMAIL_APP_PASSWORD=your-app-password --project-ref yxspomuwawzsnsjpqxid
```

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to the `main` branch of this repo — Cloudflare Pages will auto-deploy.
