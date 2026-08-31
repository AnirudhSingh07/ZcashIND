import { site } from "./site";

/**
 * Event aftermovies & recaps.
 *
 * The live @ZcashIND X timeline is embedded automatically on /events (and /recaps)
 * and shows every recent post — including aftermovie videos — with no config.
 *
 * To pin specific aftermovies in a curated grid, add them below. Paste either:
 *   - an X (Twitter) post URL:   https://x.com/ZcashIND/status/1234567890
 *   - a YouTube URL:             https://youtu.be/XXXX or https://www.youtube.com/watch?v=XXXX
 * The component detects the type from the URL.
 */

export type EventVideo = {
  title: string;
  event: string;
  date?: string; // ISO date, optional
  url: string;
};

export const media = {
  xHandle: "ZcashIND",
  xUrl: site.links.x,
  instagramUrl: site.links.instagram,

  // Curated per-event aftermovies. Empty until real post URLs are added.
  videos: [] as EventVideo[],
};
