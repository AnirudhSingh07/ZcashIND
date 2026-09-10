/**
 * Latest videos from the @ZcashIND YouTube channel.
 *
 * Uses YouTube's free public per-channel RSS feed (no API key, no quota):
 *   https://www.youtube.com/feeds/videos.xml?channel_id=<UC…>
 * Fetched server-side and cached (revalidated hourly). Degrades to an empty
 * list if the feed can't be reached, so the homepage falls back to a channel CTA.
 */

export const YOUTUBE_CHANNEL_ID = "UC0l_AqdXr_i8iD5JOoL2UKQ"; // @ZcashIND

export type YouTubeVideo = {
  id: string;
  title: string;
  publishedAt: string; // ISO
  url: string;
  thumbnail: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function pick(block: string, re: RegExp): string {
  const m = block.match(re);
  return m ? decodeEntities(m[1].trim()) : "";
}

/** Fetch the latest videos (newest first). `limit` caps the count. */
export async function getYouTubeVideos(limit = 6): Promise<YouTubeVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const entries = xml.split("<entry>").slice(1); // drop channel header
    const videos: YouTubeVideo[] = [];
    for (const block of entries) {
      const id = pick(block, /<yt:videoId>([^<]+)<\/yt:videoId>/);
      const title = pick(block, /<title>([^<]*)<\/title>/);
      const publishedAt = pick(block, /<published>([^<]+)<\/published>/);
      if (!id) continue;
      videos.push({
        id,
        title,
        publishedAt,
        url: `https://www.youtube.com/watch?v=${id}`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      });
    }
    videos.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    return videos.slice(0, limit);
  } catch {
    return [];
  }
}
