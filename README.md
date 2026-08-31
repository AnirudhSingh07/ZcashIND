# Zcash India (ZcashIND)

The India front door for Zcash. **Learn financial privacy, find the next meetup, put your city on the map.**

A grassroots community site — not an exchange, not the Zcash Foundation, not financial advice. It teaches newcomers what shielded money is, shows official events and community IRL meetups, and lets anyone submit a mini-meetup for review to appear on the **Zcash India IRL Map**.

## Stack

- **Next.js 15** (App Router) + **TypeScript** — Server Components by default; Client Components only for the map and forms
- **Tailwind CSS v4** with CSS-variable design tokens (dark Zcash night mode)
- **Prisma + SQLite** for data
- **Zod** + **Server Actions** for the submit form and admin actions
- **MapLibre GL JS** with a free dark basemap (OpenFreeMap; CARTO-style compatible)
- Markdown content in `/content` for Learn and News
- Uploads stored in `/public/uploads` (MVP)
- Admin protected by `ADMIN_PASSWORD` via a signed, HTTP-only cookie — no NextAuth, no wallet connect

## Quick start

```bash
cp .env.example .env      # then edit ADMIN_PASSWORD / secrets
pnpm install              # or: npm install
pnpm db:push              # create the SQLite schema
pnpm db:seed              # seed events, meetups, contributors
pnpm dev                  # http://localhost:3000
```

> Uses `pnpm` if available, else `npm` (swap `pnpm` → `npm run`). Node 18+.

### One-liner (as in the spec)

```bash
cp .env.example .env && pnpm install && pnpm db:push && pnpm db:seed && pnpm dev
```

## Admin

- Visit **`/admin/login`** and enter `ADMIN_PASSWORD` (default `zcashindia` from `.env.example` — **change it**).
- **`/admin/submissions`** — review queue. Verify / needs-info / reject / disqualify.
  - On **verify**, the next node number for that city is assigned, `verifiedAt` is set, and if it's the first verified meetup in the city it's flagged as a **new-city activation**.
- **`/admin/events`** — edit official events (title, city, date/time, registration, description).
- The private host contact is **never** exposed on public routes — admin only.

## Environment

See `.env.example`:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | SQLite path (`file:./dev.db`) |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_COOKIE_SECRET` | Signs the admin session cookie (use a long random string) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL for OG/SEO |
| `NEXT_PUBLIC_MAP_STYLE` | Map basemap style URL (defaults to OpenFreeMap dark) |
| `NEXT_PUBLIC_GEOCODER_KEY` | Optional. If missing, the submit form degrades to click-the-map + city text |

## Project layout

```
app/            routes (public + /admin) and Server Actions in app/actions
components/     header, footer, map (meetup-map, map-explorer, location-picker),
               meetup-card, bounty-prizes, judging-bars, leaderboard, ui, admin/*
config/         site.ts (links, bounty, map, voice) and ecosystem.ts
content/        markdown for learn/ and news/
lib/            prisma, data (public-safe reads), auth, validation (zod),
               content, markdown renderer, uploads, utils
prisma/         schema.prisma + seed.ts
public/         brand/ (poster), uploads/, icon.svg, og.svg
```

All community/ecosystem links live in **`config/site.ts`** — edit there, used everywhere.

## Key routes

- Public: `/`, `/learn` (+7 lessons), `/map`, `/map/[city]`, `/events`, `/events/[slug]`,
  `/bounties/irl`, `/bounties/irl/submit` (+ `/thanks`), `/host`, `/contributors` (+ `/[slug]`),
  `/ecosystem`, `/pay`, `/news` (+ `/[slug]`), `/about`, `/community`, `/contribute`,
  `/disclaimer`, `/privacy`
- Admin: `/admin/login`, `/admin`, `/admin/submissions` (+ `/[id]`), `/admin/events`

## Notes

- **Public map shows verified pins only.** Pending submissions never appear until an admin verifies them.
- Dates are rendered in **IST (Asia/Kolkata)**.
- Bounty window and prizes are config-driven in `config/site.ts` (`bounty.period = "2026-09"`).

## Deploy (Vercel)

Set the env vars above in the Vercel dashboard. Note: `/public/uploads` on Vercel is ephemeral — for production, move uploads to object storage (S3/R2). This is a Phase 2 item.

## Phase 2 leftovers

- Hindi translations of the Learn pages (subtitles are already in place)
- Luma event sync
- ZecMap merchant import
- Auto-generated contributor certificates
- Durable object storage for uploads

---

Not an exchange. Not financial advice.
