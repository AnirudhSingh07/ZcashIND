import { site } from "./site";

/**
 * Event aftermovies & recaps — a curated grid on /events.
 *
 * Add each video below. For every item, provide EITHER `url` OR `embed`:
 *
 *   `url`   — a plain link; the grid auto-detects the type:
 *       • X (Twitter) post:  https://x.com/ZcashIND/status/1234567890
 *       • YouTube:           https://youtu.be/XXXX  |  https://www.youtube.com/watch?v=XXXX
 *       • Vimeo:             https://vimeo.com/123456789
 *       • Direct video file: https://.../aftermovie.mp4
 *
 *   `embed` — a full embed snippet pasted from "Share → Embed" (X/YouTube/Instagram):
 *       e.g.  <blockquote class="twitter-tweet">…</blockquote>
 *        or   <iframe src="https://www.youtube.com/embed/XXXX" …></iframe>
 *     (Rendered as-is. Only paste embed codes from sources you trust — this is
 *      your own config, so that's fine.)
 */

export type EventVideo = {
  title: string;
  event: string;
  date?: string; // ISO date, optional
  url?: string;
  embed?: string;
};

/**
 * Featured posts — a small, hand-picked set of @ZcashIND posts to spotlight.
 *
 * These are INDEPENDENT of aftermovies: use them for announcements, threads,
 * milestones, partnerships — any post worth surfacing. They power the "Latest
 * from @ZcashIND" fallback (shown when X's live widget can't render), newest
 * first. Just paste the post URL; `subtitle` is an optional one-line label.
 */
export type FeaturedPost = {
  title: string;
  subtitle?: string;
  date?: string; // ISO date, optional
  url: string; // https://x.com/ZcashIND/status/…
};

export const media = {
  xHandle: "ZcashIND",
  xUrl: site.links.x,
  instagramUrl: site.links.instagram,

  // Curated per-event aftermovies (X posts). Newest first.
  videos: [
    {
      title: "Zcash Community Connect: Surat Edition",
      event: "Surat · Aftermovie",
      url: "https://x.com/ZcashIND/status/2092235721256177673",
    },
    {
      title: "NEAR Legion India × Zcash India Builder Workshop | Ahmedabad",
      event: "Ahmedabad · Aftermovie",
      url: "https://x.com/ZcashIND/status/2090139303573868866",
    },
    {
      title: "Zcash Community Connect: Bhopal Edition",
      event: "Bhopal · Aftermovie",
      url: "https://x.com/ZcashIND/status/2079170866798350411",
    },
    {
      title: "Zcash Community Connect: Vadodara Edition",
      event: "Vadodara · Aftermovie",
      url: "https://x.com/ZcashIND/status/2070045791855817036",
    },
    {
      title: "Exploring Zcash Ecosystem: Udaipur Edition",
      event: "Udaipur · Aftermovie",
      url: "https://x.com/ZcashIND/status/2061710153976869027",
    },
    {
      title: "Exploring Zcash Ecosystem: Indore Edition",
      event: "Indore · Aftermovie",
      url: "https://x.com/ZcashIND/status/2049154827641561498",
    },
  ] as EventVideo[],

  // Featured posts to spotlight on the site (independent of aftermovies above).
  // Edit this list freely — announcements, threads, milestones, etc. Newest first.
  featuredPosts: [
    {
      title: "Zcash Community Connect: Surat Edition",
      subtitle: "Recap from the ground",
      url: "https://x.com/ZcashIND/status/2092235721256177673",
    },
    {
      title: "NEAR Legion India × Zcash India Builder Workshop",
      subtitle: "Ahmedabad · partnership",
      url: "https://x.com/ZcashIND/status/2090139303573868866",
    },
    {
      title: "Zcash Community Connect: Bhopal Edition",
      subtitle: "Campus meetup",
      url: "https://x.com/ZcashIND/status/2079170866798350411",
    },
  ] as FeaturedPost[],
};
