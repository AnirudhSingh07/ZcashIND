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

export const media = {
  xHandle: "ZcashIND",
  xUrl: site.links.x,
  instagramUrl: site.links.instagram,

  // Curated per-event aftermovies. Empty until real post URLs are added.
  videos: [] as EventVideo[],
};
