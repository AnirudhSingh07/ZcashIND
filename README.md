# Zcash India (ZcashIND)

The India front door for Zcash. **Learn financial privacy, find the next meetup, put your city on the map.**

A grassroots community site: not an exchange, not the Zcash Foundation, not financial advice. It teaches newcomers what shielded money is, shows official events and community IRL meetups, runs the bounty archive, and lets anyone submit a mini-meetup for review to appear on the **Zcash India IRL Map**.

> **TODO before launch:** add rate limiting / CAPTCHA to the public submit form (`app/actions/submit.ts`).

## Stack

- **Next.js 15** (App Router) + **TypeScript**: Server Components by default; Client Components only for the map, forms and embeds
- **Tailwind CSS v4** with CSS-variable design tokens ("Ivory & Ink": a light, bold editorial theme)
- **Prisma + Postgres** for data (Prisma Postgres on Vercel)
- **Zod** + **Server Actions** for the submit form and admin actions
- **MapLibre GL JS** rendering India from our own official boundary GeoJSON (no external tiles)
- Markdown content in `/content/learn`
- Uploads on Vercel Blob (local disk in development)
- Admin protected by `ADMIN_PASSWORD` via a signed, HTTP-only cookie: no NextAuth, no wallet connect

## Quick start

```bash
cp .env.example .env      # then edit ADMIN_PASSWORD / secrets
pnpm install
pnpm db:push              # create the database schema
pnpm db:seed              # seed real events, bounties, updates
pnpm dev                  # http://localhost:3000
```

One-liner:

```bash
cp .env.example .env && pnpm install && pnpm db:push && pnpm db:seed && pnpm dev
```

Node 18+. Swap `pnpm` for `npm run` if you prefer npm.

## What's in the database after seeding

`prisma/seed.ts` holds the real Zcash India programme data (sourced from Luma, @ZcashIND on X and the
[forum report](https://forum.zcashcommunity.com/t/zcash-india-2026/54762)):

- 14 Luma events (6 campus editions, 5 Live sessions, 3 developer workshops) with attendee counts
- 7 bounties with winners and submission links (meme, video, mini meetups x2, regional content, IRL, explainer)
- 16 updates for the What's New feed
- 6 aftermovies and 6 featured posts

Community-submitted meetups (the `Meetup` table) are never seeded: they arrive through the submit form.
Reseeding wipes and recreates everything else.

Numbers that can't be derived from the DB (X followers, Telegram members, wallets created) live in
`config/stats.ts`. Merchants live in `config/merchants.ts`, the team in `config/team.ts`, the college
club roadmap in `config/clubs.ts`.

## The ZEC climber (homepage hero)

`components/zec-hiker.tsx` + `lib/zec-scene.ts`: a three.js mountaineer on a procedurally generated
95-degree rock face, driven by the live ZEC price (CoinGecko via `/api/zec-price`, polled every 20s).
Up climbs, down slips and is caught by the rope, flat rests, chalks up or places protection. The price
range the wall spans is `site.zecHiker` in `config/site.ts`. Sound is synthesised with the Web Audio API
and off until the visitor turns it on. Add `?zhdemo=1` to the homepage URL to cycle fake up / flat / down
prices every 12s and preview every behaviour.

## Admin

- Visit **`/admin/login`** and enter `ADMIN_PASSWORD` (default `zcashindia` from `.env.example`. **Change it.**)
- **`/admin/submissions`**: review queue. Verify / needs-info / reject / disqualify. On **verify**, the next node number for that city is assigned, `verifiedAt` is set, and the first verified meetup in a city is flagged as a **new-city activation**.
- **`/admin/bounties`**: create and edit bounties, add winners and submissions, set the active IRL bounty (which drives `/bounties/irl` and the submit form).
- **`/admin/luma`**: the events list (drives `/events`, the homepage and the map's cities).
- **`/admin/updates`**, **`/admin/featured`**, **`/admin/aftermovies`**: the What's New feed, spotlighted X posts, and recap videos.
- The private host contact is **never** exposed on public routes. Admin only.

## Environment

See `.env.example`:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Prisma Postgres) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for uploads (optional locally) |
| `ADMIN_HOST` | Hostname that serves the admin (`admin.zcashind.com`) |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_COOKIE_SECRET` | Signs the admin session cookie (use a long random string) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL for OG/SEO |

## Project layout

```
app/            routes (public + /admin) and Server Actions in app/actions
components/     header, footer, map/*, bounty/*, social/*, admin/*, ui primitives
config/         site.ts (links, voice), stats.ts, merchants.ts, team.ts, clubs.ts,
                ecosystem.ts, media.ts, luma-events.ts (config fallback for the DB)
content/        markdown for learn/
lib/            prisma, data (public-safe reads), auth, validation (zod),
                content, markdown renderer, uploads, utils, youtube
prisma/         schema.prisma + seed.ts
public/         brand/ (poster), uploads/, icon.svg, og.svg, india-official.geojson
```

All community/ecosystem links live in **`config/site.ts`**.

## Key routes

- Public: `/`, `/learn` (+7 lessons), `/map`, `/map/[city]`, `/events`, `/bounties`, `/bounties/[slug]`,
  `/bounties/irl` (+ `/submit`, `/submit/thanks`), `/clubs`, `/pay`, `/host`,
  `/ecosystem`, `/updates`, `/about`, `/community`, `/contribute`, `/disclaimer`, `/privacy`
- Admin: `/admin/login`, `/admin`, `/admin/submissions` (+ `/[id]`), `/admin/bounties`, `/admin/luma`,
  `/admin/events`, `/admin/featured`, `/admin/aftermovies`, `/admin/updates`

## Notes

- **Public map shows verified community pins only.** Pending submissions never appear until an admin verifies them.
- Dates are rendered in **IST (Asia/Kolkata)**.
- The active IRL bounty (prizes, minimums, judging) is DB-driven from `/admin/bounties`, with `config/site.ts` as the fallback if the table is empty.

## Deploy (Vercel)

The site runs as one Vercel project (`zcashind`) serving two hostnames:

- `zcashind.com` (and `www`, which redirects): the public site. `/admin` is not served here.
- `admin.zcashind.com`: only the admin. Everything else redirects to `/admin`.

`middleware.ts` does the split by hostname (`ADMIN_HOST`, `NEXT_PUBLIC_SITE_URL`). Localhost and preview
deployments serve both.

Infrastructure: Prisma Postgres (Vercel Marketplace) for the database, Vercel Blob for photo and video
uploads (`BLOB_READ_WRITE_TOKEN`; falls back to `/public/uploads` locally when unset).

```bash
vercel env pull .env.local          # DATABASE_URL, BLOB_READ_WRITE_TOKEN, ...
pnpm db:push                        # create the schema on the hosted DB (reads .env)
pnpm db:seed                        # seed it
vercel --prod                       # deploy
```

DNS at the registrar: `A @ 216.198.79.1`, `A @ 64.29.17.1`, `CNAME www cname.vercel-dns.com`,
`CNAME admin cname.vercel-dns.com`.

## Still to do

- Rate limiting / CAPTCHA on the submit form
- Hindi translations of the Learn pages (subtitles are in place; Google Translate covers the rest for now)
- Luma API sync (events are entered by hand in `/admin/luma`)
- Auto-generated contributor certificates
