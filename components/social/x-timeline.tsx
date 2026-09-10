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
    s.onerror = () => resolve(); // fail soft — we show a fallback
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** A recent post used for the graceful fallback when the live widget is blank. */
export type FallbackPost = {
  title: string;
  subtitle?: string | null;
  date?: string;
  url?: string;
};

/** Pull the numeric status id from an x.com / twitter.com status URL. */
function statusId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/status\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * Live @handle timeline from X's free embed widget, featured on the site.
 *
 * X's widget is best-effort: it renders reliably for visitors signed in to X
 * but often comes back blank otherwise. So we:
 *   1. show a loading skeleton while widgets.js boots,
 *   2. poll a few times to catch a slow-but-real render,
 *   3. fall back to a clean grid of recent posts (`fallbackPosts`) plus a
 *      follow CTA — so every visitor always sees real, recent @handle content.
 */
export function XTimeline({
  handle,
  height = 620,
  fallbackPosts = [],
}: {
  handle: string;
  height?: number;
  fallbackPosts?: FallbackPost[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // A real, populated timeline renders as a tall iframe. A blank/failed one
    // either has no iframe or a short one. Poll a few times before giving up.
    const check = (final: boolean) => {
      if (cancelled || !ref.current) return;
      const frame = ref.current.querySelector("iframe");
      const tallEnough = frame && frame.clientHeight > 200;
      if (tallEnough) setState("ok");
      else if (final) setState("fallback");
    };

    loadWidgets().then(() => {
      if (cancelled || !ref.current) return;
      window.twttr?.widgets.load(ref.current);
    });

    [2500, 4500, 7000, 9500].forEach((ms, i, arr) =>
      timers.push(setTimeout(() => check(i === arr.length - 1), ms))
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [handle]);

  const posts = fallbackPosts.filter((p) => statusId(p.url)).slice(0, 5);

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden>𝕏</span> Latest from @{handle}
          {state === "ok" && (
            <span className="flex items-center gap-1 text-xs font-normal text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              live
            </span>
          )}
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

      {/* Loading skeleton — shown until we know the widget rendered or not */}
      {state === "loading" && (
        <div className="space-y-4 p-5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-line" />
                <div className="h-3 w-32 rounded bg-line" />
              </div>
              <div className="h-3 w-full rounded bg-line" />
              <div className="h-3 w-4/5 rounded bg-line" />
            </div>
          ))}
        </div>
      )}

      {/* Live widget mount — hidden once we decide to show the fallback */}
      <div
        ref={ref}
        className={
          state === "fallback"
            ? "hidden"
            : state === "loading"
            ? "h-0 overflow-hidden"
            : ""
        }
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

      {/* Graceful fallback: real recent posts as cards */}
      {state === "fallback" && (
        <div className="flex flex-1 flex-col p-3">
          {posts.length > 0 ? (
            <ul className="divide-y divide-line">
              {posts.map((p) => (
                <li key={p.url}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-gold/5"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gold/15 text-sm text-gold"
                    >
                      𝕏
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium group-hover:text-gold">
                        {p.title}
                      </span>
                      {p.subtitle && (
                        <span className="mt-0.5 block text-xs text-muted">
                          {p.subtitle}
                        </span>
                      )}
                    </span>
                    <span
                      className="ml-auto flex-none self-center text-muted transition-colors group-hover:text-gold"
                      aria-hidden
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-6 text-center text-sm text-muted">
              The live feed loads best when you&apos;re signed in to X.
            </p>
          )}
          <a
            href={`https://x.com/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold mt-2 px-5 py-2 text-center text-sm"
          >
            Follow @{handle} on X ↗
          </a>
        </div>
      )}
    </div>
  );
}
