"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

export type FeedUpdate = {
  id: string;
  title: string | null;
  body: string | null;
  xUrl: string | null;
  tag: string | null;
  pinned: boolean;
  createdAt: string;
};

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UpdateFeed({ updates }: { updates: FeedUpdate[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (updates.some((u) => u.xUrl)) loadTwitter(ref.current);
  }, [updates]);

  if (updates.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="text-4xl">🗞️</div>
        <p className="mt-3 text-lg font-semibold">Nothing new just yet</p>
        <p className="mt-1 text-muted">
          Fresh updates land here. Follow along on X in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* timeline rail */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[15px] top-2 w-px bg-gradient-to-b from-gold/60 via-line to-transparent sm:left-[19px]"
      />
      <ol className="space-y-8">
        {updates.map((u) => (
          <li key={u.id} className="relative pl-10 sm:pl-12">
            {/* node dot */}
            <span
              aria-hidden
              className={`absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm sm:h-10 sm:w-10 ${
                u.pinned
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-line bg-surface text-muted"
              }`}
            >
              {u.pinned ? "📌" : "◆"}
            </span>

            <div
              className={`card overflow-hidden p-5 sm:p-6 ${
                u.pinned ? "border-gold/40" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {u.pinned && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                    Pinned
                  </span>
                )}
                {u.tag && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-muted">
                    {u.tag}
                  </span>
                )}
                <span className="text-muted/60">{fmtDate(u.createdAt)}</span>
              </div>

              {u.title && (
                <h3 className="mt-2 text-lg font-semibold sm:text-xl">{u.title}</h3>
              )}
              {u.body && <p className="mt-2 text-muted">{u.body}</p>}

              {u.xUrl && (
                <div className="mt-4 [&_.twitter-tweet]:!my-0">
                  <blockquote
                    className="twitter-tweet"
                    data-theme="light"
                    data-dnt="true"
                  >
                    <a href={u.xUrl.replace("x.com", "twitter.com")}>
                      {u.title ?? "View post on X"}
                    </a>
                  </blockquote>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
