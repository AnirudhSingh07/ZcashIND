"use client";

import { useState } from "react";

/**
 * Copy-link / native-share button. Uses the Web Share API on phones and falls
 * back to copying the URL to the clipboard everywhere else.
 */
export function ShareButton({
  title,
  text,
  path,
  className = "",
}: {
  title: string;
  text?: string;
  /** Absolute path, e.g. /bounties/foo. Resolved against the current origin. */
  path: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "shared">("idle");

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setState("shared");
      } else {
        await navigator.clipboard.writeText(url);
        setState("copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setState("copied");
      } catch {
        /* nothing else we can do */
      }
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`btn-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm ${className}`}
      aria-live="polite"
    >
      <span aria-hidden>{state === "idle" ? "🔗" : "✓"}</span>
      {state === "copied" ? "Link copied" : state === "shared" ? "Shared" : "Share"}
    </button>
  );
}
