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
 * Embeds the live X (@handle) timeline — recent posts, including aftermovie
 * videos. X's free timeline widget is best-effort: it renders reliably for
 * logged-in X visitors but can come back blank otherwise, so we always show a
 * header + "Open on X" link and swap in a clean fallback if the widget doesn't
 * produce a real (tall enough) iframe.
 */
export function XTimeline({
  handle,
  height = 620,
}: {
  handle: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      if (cancelled || !ref.current) return;
      const frame = ref.current.querySelector("iframe");
      const tallEnough = frame && frame.clientHeight > 150;
      setState(tallEnough ? "ok" : "fallback");
    };

    loadWidgets().then(() => {
      if (!cancelled && ref.current) window.twttr?.widgets.load(ref.current);
    });

    const t = setTimeout(check, 5000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [handle]);

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden>📹</span> Live from @{handle}
        </span>
        <a
          href={`https://x.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gold hover:underline"
        >
          Open on X ↗
        </a>
      </div>

      {/* Widget mount — hidden once we decide to show the fallback */}
      <div
        ref={ref}
        className={state === "fallback" ? "hidden" : "min-h-[220px]"}
        style={{ maxHeight: height }}
      >
        <a
          className="twitter-timeline"
          data-theme="dark"
          data-height={height}
          data-chrome="noheader nofooter transparent noborders"
          href={`https://twitter.com/${handle}`}
        >
          Loading posts by @{handle}…
        </a>
      </div>

      {state === "fallback" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm text-muted">
            Our aftermovies and recap videos live on X. The embedded feed loads
            best when you&apos;re signed in to X — otherwise open it directly:
          </p>
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold px-5 py-2 text-sm"
          >
            Watch @{handle} on X ↗
          </a>
        </div>
      )}
    </div>
  );
}
