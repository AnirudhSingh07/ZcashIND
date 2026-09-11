"use client";

import { useEffect, useRef, useState } from "react";
import type { ZecScene } from "@/lib/zec-scene";

/**
 * ZEC climber: a three.js mountaineer on a near-vertical face, driven by the
 * live ZEC price. Up climbs, down slips and is caught by the rope, flat rests,
 * chalks up or places protection. Nothing is captioned; only the price shows.
 *
 * The scene itself lives in lib/zec-scene.ts and is loaded on the client
 * only, after mount, so three.js never touches the server bundle.
 */

export interface ZecHikerProps {
  price: number | null;
  change24h: number | null;
  /** World units the climber moves per dollar of price change. */
  unitsPerDollar?: number;
  /** Poll interval in ms. */
  pollMs?: number;
  className?: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Where on the route (0..1) the climber sits when the page loads. */
const BASE_T = 0.5;
const fmtPrice = (p: number) =>
  `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ZecHiker({
  price: initialPrice,
  change24h: initialChange,
  unitsPerDollar = 0.6,
  pollMs = 20_000,
  className = "",
}: ZecHikerProps) {
  const mount = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ZecScene | null>(null);
  const lastPrice = useRef<number | null>(initialPrice);
  // The price the climb is measured from: the first price we saw.
  const basePrice = useRef<number | null>(initialPrice);

  /** Route fraction for a price: base position plus distance per dollar. */
  const toT = (p: number) => {
    const sc = sceneRef.current;
    if (!sc || basePrice.current == null) return BASE_T;
    return clamp(BASE_T + ((p - basePrice.current) * unitsPerDollar) / sc.routeLength, 0.02, 0.98);
  };
  const [price, setPrice] = useState<number | null>(initialPrice);
  const [change, setChange] = useState<number | null>(initialChange);
  const [status, setStatus] = useState<"ready" | "loading" | "failed">(
    initialPrice == null ? "loading" : "ready",
  );
  const [sound, setSound] = useState(false);
  const [webgl, setWebgl] = useState(true);

  // Build the scene on the client.
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let scene: ZecScene | null = null;
    let cancelled = false;
    import("@/lib/zec-scene")
      .then(({ createZecScene }) => {
        if (cancelled) return;
        try {
          scene = createZecScene(el, BASE_T - 0.04);
          sceneRef.current = scene;
          // Climb in from just below the starting position.
          scene.setTarget(BASE_T, "climb");
        } catch {
          setWebgl(false);
        }
      })
      .catch(() => setWebgl(false));

    // Pause when scrolled away or the tab is hidden: no wasted GPU, no sound.
    const io = new IntersectionObserver(
      ([entry]) => sceneRef.current?.setPaused(!entry.isIntersecting || document.visibilityState === "hidden"),
      { threshold: 0.05 },
    );
    io.observe(el);
    const onVis = () => sceneRef.current?.setPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      scene?.destroy();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the price. ?zhdemo=1 cycles fake up / flat / down every 12s so every
  // behaviour can be previewed without waiting for the market.
  useEffect(() => {
    let cancelled = false;
    const demo = new URLSearchParams(window.location.search).get("zhdemo") === "1";
    let step = 0;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        let data: { ok: boolean; price?: number; change24h?: number };
        if (demo) {
          const base = lastPrice.current ?? 1200;
          const seq = [6, 0, -4, 0, 9, 0, 0, -12, 0, 3];
          const delta = seq[step % seq.length];
          step += 1;
          const next = base + delta;
          data = { ok: true, price: next, change24h: (delta / base) * 100 };
        } else {
          const res = await fetch("/api/zec-price", { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          data = (await res.json()) as { ok: boolean; price?: number; change24h?: number };
        }
        if (cancelled || !data.ok || typeof data.price !== "number") throw new Error("bad");
        const next = data.price;
        const prev = lastPrice.current;
        lastPrice.current = next;
        if (basePrice.current == null) basePrice.current = next;
        setPrice(next);
        setChange(typeof data.change24h === "number" ? data.change24h : null);
        setStatus("ready");
        const to = toT(next);
        // Anything under a cent is noise, not a move.
        if (prev == null) sceneRef.current?.setTarget(to, "climb");
        else if (next > prev + 0.01) sceneRef.current?.setTarget(to, "climb");
        else if (next < prev - 0.01) sceneRef.current?.setTarget(to, "slip");
      } catch {
        if (!cancelled) setStatus((s) => (s === "loading" ? "failed" : s));
      }
    };
    if (initialPrice == null) load();
    const id = setInterval(load, demo ? 12_000 : pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrice, pollMs, unitsPerDollar]);

  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    sceneRef.current?.setSound(on);
  };

  const up = (change ?? 0) >= 0;
  const aria =
    price == null
      ? "ZEC price visualised as a climber on a rock face. Price unavailable right now."
      : `ZEC price visualised as a climber on a rock face, currently ${fmtPrice(price)}, ${up ? "up" : "down"} ${Math.abs(change ?? 0).toFixed(1)} percent in 24 hours.`;

  return (
    <div className={`zec-hiker relative ${className}`}>
      <div
        ref={mount}
        role="img"
        aria-label={aria}
        className="relative aspect-[5/6] w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-[#efe6d3] shadow-[var(--shadow-card)]"
      >
        {!webgl && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">
            Your browser can&apos;t show the 3D climb. The price is still live above.
          </div>
        )}
      </div>

      {/* Price pill: the only text on the scene */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        {status === "ready" && price != null && (
          <div className="flex items-center gap-2 rounded-full border border-line bg-white/85 px-3 py-1.5 text-sm font-semibold text-text shadow-sm backdrop-blur">
            <span className="text-xs font-bold tracking-wide text-gold">ZEC</span>
            <span className="tabular-nums">{fmtPrice(price)}</span>
            {change != null && (
              <span className={`text-xs tabular-nums ${up ? "text-success" : "text-danger"}`}>
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
              </span>
            )}
            {basePrice.current != null && Math.abs(price - basePrice.current) >= 0.01 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  price >= basePrice.current ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
                title="Since you opened the page"
              >
                {price >= basePrice.current ? "+" : "-"}${Math.abs(price - basePrice.current).toFixed(2)}
              </span>
            )}
          </div>
        )}
        {status === "loading" && (
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/70" />
        )}
      </div>

      {/* Sound toggle */}
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-line bg-white/85 px-3 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur transition-colors hover:text-gold"
      >
        <span aria-hidden>{sound ? "🔊" : "🔈"}</span>
        {sound ? "Sound on" : "Sound off"}
      </button>
    </div>
  );
}
