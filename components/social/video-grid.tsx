"use client";

import { useEffect, useRef } from "react";
import type { EventVideo } from "@/config/media";

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function isX(url: string): boolean {
  return /(?:twitter\.com|x\.com)\/.+\/status\/\d+/.test(url);
}

/** A curated grid of event aftermovies (YouTube or X posts). */
export function VideoGrid({ videos }: { videos: EventVideo[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videos.some((v) => isX(v.url))) return;
    // Load X widgets for any embedded tweets.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]',
    );
    const run = () => window.twttr?.widgets.load(ref.current ?? undefined);
    if (window.twttr?.widgets) {
      run();
    } else if (existing) {
      existing.addEventListener("load", run, { once: true });
    } else {
      const s = document.createElement("script");
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      s.onload = run;
      document.body.appendChild(s);
    }
  }, [videos]);

  if (videos.length === 0) return null;

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2">
      {videos.map((v) => {
        const yt = youtubeId(v.url);
        return (
          <figure key={v.url} className="card overflow-hidden">
            {yt ? (
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${yt}`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : isX(v.url) ? (
              <blockquote
                className="twitter-tweet"
                data-theme="dark"
                data-dnt="true"
              >
                <a href={v.url.replace("x.com", "twitter.com")}>{v.title}</a>
              </blockquote>
            ) : (
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-video w-full bg-surface-2 p-6 text-center"
              >
                ▶ Watch: {v.title}
              </a>
            )}
            <figcaption className="p-4">
              <div className="font-medium">{v.title}</div>
              <div className="text-sm text-muted">{v.event}</div>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
