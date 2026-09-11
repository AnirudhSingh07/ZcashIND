"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

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

export type GridPost = {
  id: string;
  url: string;
  xHandle?: string | null;
  /** Optional caption line shown above the embed (e.g. "1st place, $50"). */
  label?: string;
};

/**
 * A grid of embedded X posts with a "show more" control so pages with 20+
 * submissions don't load every embed at once.
 */
export function SubmissionGrid({
  posts,
  initial = 6,
  emptyText = "No posts yet.",
}: {
  posts: GridPost[];
  initial?: number;
  emptyText?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(initial);

  useEffect(() => {
    if (posts.length > 0) loadTwitter(ref.current);
  }, [posts, shown]);

  if (posts.length === 0) {
    return <p className="card p-6 text-center text-sm text-muted">{emptyText}</p>;
  }

  const visible = posts.slice(0, shown);

  return (
    <div>
      <div ref={ref} className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <figure key={p.id} className="card self-start overflow-hidden p-3">
            {(p.label || p.xHandle) && (
              <figcaption className="flex items-center justify-between gap-2 px-1 pb-2 text-sm">
                {p.label && <span className="font-semibold text-gold">{p.label}</span>}
                {p.xHandle && (
                  <a
                    href={`https://x.com/${p.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-muted hover:text-gold"
                  >
                    @{p.xHandle}
                  </a>
                )}
              </figcaption>
            )}
            <div className="[&_.twitter-tweet]:!my-0">
              <blockquote className="twitter-tweet" data-theme="light" data-dnt="true">
                <a href={p.url.replace("x.com", "twitter.com")}>
                  {p.xHandle ? `Post by @${p.xHandle}` : "View post on X"}
                </a>
              </blockquote>
            </div>
          </figure>
        ))}
      </div>
      {shown < posts.length && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + 9)}
            className="btn-ghost px-6 py-2.5 text-sm"
          >
            Show {Math.min(9, posts.length - shown)} more of {posts.length}
          </button>
        </div>
      )}
    </div>
  );
}
