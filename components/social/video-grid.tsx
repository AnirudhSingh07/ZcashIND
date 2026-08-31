"use client";

import { useEffect, useRef } from "react";
import type { EventVideo } from "@/config/media";

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function isXStatus(url: string): boolean {
  return /(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/.test(url);
}

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

/** Load X's widgets.js and (re)render any embedded tweets inside `el`. */
function loadTwitter(el: HTMLElement | null) {
  const run = () => window.twttr?.widgets.load(el ?? undefined);
  if (window.twttr?.widgets) return run();
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://platform.twitter.com/widgets.js"]',
  );
  if (existing) {
    existing.addEventListener("load", run, { once: true });
    return;
  }
  const s = document.createElement("script");
  s.src = "https://platform.twitter.com/widgets.js";
  s.async = true;
  s.onload = run;
  document.body.appendChild(s);
}

function VideoBody({ v }: { v: EventVideo }) {
  // 1) Raw embed snippet (iframe / blockquote / etc.) — render as-is.
  if (v.embed) {
    const isTweet = /twitter-tweet|twitter\.com|x\.com/.test(v.embed);
    // Constrain iframes to fill the card responsively.
    return (
      <div
        className={
          isTweet
            ? "[&_.twitter-tweet]:!mx-auto"
            : "relative aspect-video w-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        }
        dangerouslySetInnerHTML={{ __html: v.embed }}
      />
    );
  }

  const url = v.url ?? "";
  const yt = youtubeId(url);
  if (yt) {
    return (
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
    );
  }

  const vim = vimeoId(url);
  if (vim) {
    return (
      <div className="relative aspect-video w-full">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://player.vimeo.com/video/${vim}`}
          title={v.title}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVideoFile(url)) {
    return (
      <video controls preload="metadata" className="aspect-video w-full bg-black">
        <source src={url} />
      </video>
    );
  }

  if (isXStatus(url)) {
    return (
      <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true">
        <a href={url.replace("x.com", "twitter.com")}>{v.title}</a>
      </blockquote>
    );
  }

  // Unknown — link out.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-video w-full items-center justify-center bg-surface-2 p-6 text-center text-gold"
    >
      ▶ Watch: {v.title}
    </a>
  );
}

/** A curated grid of event aftermovies (X posts, YouTube, Vimeo, mp4, or raw embeds). */
export function VideoGrid({ videos }: { videos: EventVideo[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const needsTwitter = videos.some(
      (v) =>
        (v.embed && /twitter-tweet|twitter\.com|x\.com/.test(v.embed)) ||
        (v.url && isXStatus(v.url)),
    );
    if (needsTwitter) loadTwitter(ref.current);
  }, [videos]);

  if (videos.length === 0) return null;

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((v, i) => (
        <figure key={v.url ?? v.embed ?? i} className="card overflow-hidden">
          <VideoBody v={v} />
          <figcaption className="p-4">
            <div className="font-medium">{v.title}</div>
            <div className="text-sm text-muted">{v.event}</div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
