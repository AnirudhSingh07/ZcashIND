"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: { load: (el?: HTMLElement) => void };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadWidgets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.charset = "utf-8";
    s.onload = () => resolve();
    s.onerror = () => resolve(); // fail soft — we show a fallback link
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Embeds the live X (@handle) timeline — shows the account's recent posts,
 * including aftermovie videos. No per-post IDs needed. Falls back to a link
 * if the X widget is blocked (e.g. by a tracking blocker).
 */
export function XTimeline({
  handle,
  height = 640,
}: {
  handle: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      // If nothing rendered after a while, assume it was blocked.
      if (!cancelled && ref.current && ref.current.querySelector("iframe") == null) {
        setFailed(true);
      }
    }, 6000);

    loadWidgets().then(() => {
      if (!cancelled && ref.current) window.twttr?.widgets.load(ref.current);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle]);

  return (
    <div className="card overflow-hidden">
      <div ref={ref} className="min-h-[200px]">
        <a
          className="twitter-timeline"
          data-theme="dark"
          data-height={height}
          data-chrome="noheader nofooter transparent noborders"
          href={`https://twitter.com/${handle}`}
        >
          Posts by @{handle}
        </a>
      </div>
      {failed && (
        <div className="p-6 text-center text-sm text-muted">
          The X feed couldn&apos;t load here (a browser extension may be blocking
          it).{" "}
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Open @{handle} on X ↗
          </a>
        </div>
      )}
    </div>
  );
}
