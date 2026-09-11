"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * ZEC Hiker: an editorial mountain scene where a mountaineer in Zcash India
 * gear climbs a switchback trail as the ZEC price rises.
 *
 * The camera follows the climber (zoomed in), so the illustration reads as a
 * side-scrolling climb rather than a static mountain. The price is polled
 * every 20 seconds and drives a small state machine:
 *
 *   price up      -> climb (walk cycle, dust at the boots, rope pays out)
 *   price down    -> slip (slides down the trail with a stumble, rocks tumble,
 *                    the rope catches) then recover (wobble, find footing)
 *   price flat    -> idle loop: drill and place an anchor, check the rope,
 *                    catch breath
 *
 * Geometry that moves every frame (camera, climber, rope, covered trail,
 * price pill) is written to the DOM from one requestAnimationFrame loop so
 * everything stays in sync. Limb animation is CSS keyframes keyed off a
 * data-phase attribute. No animation libraries.
 */

export interface ZecHikerProps {
  price: number | null;
  change24h: number | null;
  priceMin?: number;
  priceMax?: number;
  /** Poll interval in ms. */
  pollMs?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// World geometry (viewBox 0 0 560 440)
// ---------------------------------------------------------------------------

const W = 560;
const H = 440;
const ZOOM = 2.1;

/** Switchback trail from the trailhead to the summit. */
const TRAIL: [number, number][] = [
  [48, 404],
  [120, 372],
  [100, 338],
  [170, 300],
  [240, 262],
  [215, 232],
  [275, 190],
  [300, 150],
  [326, 94],
];
const PEAK: [number, number] = [330, 72];

const SEG = (() => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < TRAIL.length; i++) {
    const l = Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]);
    lens.push(l);
    total += l;
  }
  return { lens, total };
})();

type Pose = { x: number; y: number; dir: 1 | -1; slope: number };

/** Position, facing and slope angle (degrees, 0 = flat) at trail fraction t. */
function poseAt(t: number): Pose {
  const target = Math.min(1, Math.max(0, t)) * SEG.total;
  let acc = 0;
  for (let i = 0; i < SEG.lens.length; i++) {
    const l = SEG.lens[i];
    if (acc + l >= target || i === SEG.lens.length - 1) {
      const k = l === 0 ? 0 : Math.min(1, (target - acc) / l);
      const [x0, y0] = TRAIL[i];
      const [x1, y1] = TRAIL[i + 1];
      const dx = x1 - x0;
      const dy = y1 - y0;
      return {
        x: x0 + dx * k,
        y: y0 + dy * k,
        dir: dx >= 0 ? 1 : -1,
        slope: Math.abs((Math.atan2(-dy, Math.abs(dx)) * 180) / Math.PI),
      };
    }
    acc += l;
  }
  const [x, y] = TRAIL[TRAIL.length - 1];
  return { x, y, dir: 1, slope: 45 };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const priceToT = (p: number, min: number, max: number) =>
  max <= min ? 0.5 : clamp((p - min) / (max - min), 0, 1);

function markers(min: number, max: number): number[] {
  const rawStep = (max - min) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, rawStep))));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * mag);
  const step = nice.reduce((a, b) => (Math.abs(b - rawStep) < Math.abs(a - rawStep) ? b : a));
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(v);
  return out;
}

const fmtPrice = (p: number) =>
  p >= 100 ? `$${Math.round(p).toLocaleString("en-US")}` : `$${p.toFixed(2)}`;
const fmtShort = (p: number) =>
  p >= 1000 ? `$${(p / 1000).toFixed(2).replace(/\.?0+$/, "")}k` : `$${p}`;

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** A slip: accelerates down (gravity), overshoots the mark, the rope catches, settles. */
const easeSlip = (p: number) => {
  if (p < 0.62) {
    const q = p / 0.62;
    return 1.09 * q * q;
  }
  const q = (p - 0.62) / 0.38;
  return 1.09 - 0.09 * (1 - Math.pow(1 - q, 2.2));
};

type Phase = "intro" | "climb" | "slip" | "recover" | "drill" | "rope" | "rest";

const CAPTION: Record<Phase, string> = {
  intro: "Starting the climb",
  climb: "Climbing",
  slip: "Slipped! Rope caught",
  recover: "Finding footing",
  drill: "Drilling an anchor",
  rope: "Checking the rope",
  rest: "Catching breath",
};

const IDLE_LOOP: Phase[] = ["drill", "rope", "rest"];
const IDLE_MS: Record<string, number> = { drill: 4200, rope: 3600, rest: 4400 };

// ---------------------------------------------------------------------------

export function ZecHiker({
  price: initialPrice,
  change24h: initialChange,
  priceMin = 600,
  priceMax = 1800,
  pollMs = 20_000,
  className = "",
}: ZecHikerProps) {
  const [price, setPrice] = useState<number | null>(initialPrice);
  const [change, setChange] = useState<number | null>(initialChange);
  const [status, setStatus] = useState<"ready" | "loading" | "failed">(
    initialPrice == null ? "loading" : "ready",
  );
  const [phase, setPhase] = useState<Phase>("intro");
  const [anchors, setAnchors] = useState<[number, number][]>([[TRAIL[0][0] - 6, TRAIL[0][1] - 2]]);
  const [tick, setTick] = useState(0); // bumps when a slip/drill starts so CSS particle animations restart

  // Refs for per-frame DOM writes.
  const camRef = useRef<SVGGElement>(null);
  const skyRef = useRef<SVGGElement>(null);
  const backRef = useRef<SVGGElement>(null);
  const midRef = useRef<SVGGElement>(null);
  const hikerRef = useRef<SVGGElement>(null);
  const ropeRef = useRef<SVGPathElement>(null);
  const ropeShadowRef = useRef<SVGPathElement>(null);
  const coveredRef = useRef<SVGPolylineElement>(null);
  const pillRef = useRef<SVGGElement>(null);

  // Tween state lives in a ref so the rAF loop never re-renders React.
  const tween = useRef({
    from: 0,
    to: 0,
    start: 0,
    dur: 1,
    ease: easeInOut as (p: number) => number,
    cur: 0,
  });
  const cam = useRef({ x: TRAIL[0][0], y: TRAIL[0][1], init: false });
  const anchorsRef = useRef(anchors);
  anchorsRef.current = anchors;
  const phaseRef = useRef<Phase>("intro");
  const ropeTension = useRef(0); // 0 = slack, 1 = taut
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPrice = useRef<number | null>(initialPrice);
  const idleIdx = useRef(0);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const go = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  /** Idle loop: drill -> rope -> rest -> drill ... until the price moves. */
  const startIdle = useCallback(() => {
    clearTimers();
    const step = () => {
      const kind = IDLE_LOOP[idleIdx.current % IDLE_LOOP.length];
      idleIdx.current += 1;
      go(kind);
      if (kind === "drill") {
        setTick((n) => n + 1);
        // The bolt goes in two-thirds of the way through the drilling.
        later(() => {
          const { x, y, dir } = poseAt(Math.max(0, tween.current.cur - 0.022));
          setAnchors((a) => [...a.slice(-7), [x - dir * 3, y - 11]]);
        }, IDLE_MS.drill * 0.66);
      }
      later(step, IDLE_MS[kind]);
    };
    step();
  }, [go]);

  /** Move the climber to a new trail fraction with the right choreography. */
  const moveTo = useCallback(
    (to: number, kind: "intro" | "climb" | "slip") => {
      clearTimers();
      const from = tween.current.cur;
      const dist = Math.abs(to - from) * SEG.total;
      const now = performance.now();
      if (kind === "slip") {
        const dur = clamp(900 + dist * 22, 1100, 2600);
        tween.current = { from, to, start: now, dur, ease: easeSlip, cur: from };
        setTick((n) => n + 1);
        go("slip");
        later(() => go("recover"), dur);
        later(startIdle, dur + 1700);
      } else {
        const dur = clamp(1800 + dist * 38, 2400, 9000);
        tween.current = { from, to, start: now, dur, ease: easeInOut, cur: from };
        go(kind);
        later(startIdle, dur + 200);
      }
    },
    [go, startIdle],
  );

  // Initial choreography: start a little below the current level and climb in.
  useEffect(() => {
    const p = initialPrice;
    const target = p == null ? 0.5 : priceToT(p, priceMin, priceMax);
    tween.current.cur = clamp(target - 0.07, 0, 1);
    tween.current.to = tween.current.cur;
    moveTo(target, "intro");
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the price and choreograph the response.
  // Add ?zhdemo=1 to the URL to cycle through up / flat / down with fake
  // prices every 12s, so every pose can be previewed without waiting.
  useEffect(() => {
    let cancelled = false;
    const demo = new URLSearchParams(window.location.search).get("zhdemo") === "1";
    let demoStep = 0;
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        let data: { ok: boolean; price?: number; change24h?: number };
        if (demo) {
          const base = lastPrice.current ?? (priceMin + priceMax) / 2;
          const span = (priceMax - priceMin) * 0.12;
          const seq = [span, 0, -span * 0.7, 0, span * 0.4, 0, -span * 1.2, 0];
          const delta = seq[demoStep % seq.length];
          demoStep += 1;
          const next = clamp(base + delta, priceMin + 10, priceMax - 10);
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
        setPrice(next);
        setChange(typeof data.change24h === "number" ? data.change24h : 0);
        setStatus("ready");
        const to = priceToT(next, priceMin, priceMax);
        if (prev == null || next > prev + 1e-9) moveTo(to, "climb");
        else if (next < prev - 1e-9) moveTo(to, "slip");
        // unchanged: keep whatever idle loop is running
      } catch {
        if (!cancelled) setStatus((s) => (s === "loading" ? "failed" : s));
      }
    };
    if (initialPrice == null) load();
    const id = setInterval(load, demo ? 12_000 : pollMs);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [initialPrice, pollMs, priceMin, priceMax, moveTo]);

  // The frame loop: tween, camera, rope, covered trail, pill.
  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = (now: number) => {
      const tw = tween.current;
      const p = tw.dur <= 0 ? 1 : clamp((now - tw.start) / tw.dur, 0, 1);
      const e = reduce ? 1 : tw.ease(p);
      tw.cur = tw.from + (tw.to - tw.from) * e;
      const t = clamp(tw.cur, 0, 1);
      const pose = poseAt(t);
      const ph = phaseRef.current;

      // Camera: follow with a little lag, clamped to the world.
      const vw = W / ZOOM;
      const vh = H / ZOOM;
      const tx = clamp(pose.x, vw / 2, W - vw / 2);
      const ty = clamp(pose.y - 18, vh / 2, H - vh / 2);
      const c = cam.current;
      if (!c.init || reduce) {
        c.x = tx;
        c.y = ty;
        c.init = true;
      } else {
        c.x += (tx - c.x) * 0.075;
        c.y += (ty - c.y) * 0.075;
      }
      camRef.current?.setAttribute(
        "transform",
        `translate(${W / 2} ${H / 2}) scale(${ZOOM}) translate(${-c.x} ${-c.y})`,
      );
      // Parallax: distant layers move less than the camera.
      const px = c.x - W / 2;
      const py = c.y - H / 2;
      skyRef.current?.setAttribute("transform", `translate(${px * 0.8} ${py * 0.8})`);
      backRef.current?.setAttribute("transform", `translate(${px * 0.45} ${py * 0.45})`);
      midRef.current?.setAttribute("transform", `translate(${px * 0.22} ${py * 0.22})`);

      // Climber: lean into the slope, face the direction of travel.
      const lean = ph === "slip" ? -14 : ph === "recover" ? 4 : clamp(pose.slope * 0.3, 4, 18);
      hikerRef.current?.setAttribute(
        "transform",
        `translate(${pose.x} ${pose.y}) scale(${pose.dir} 1) rotate(${-lean})`,
      );

      // Rope: threaded through the last three anchors up to the harness, each
      // span sagging under gravity. The span to the climber goes taut when
      // the rope is being checked or has just caught a slip.
      const hx = pose.x - pose.dir * 2;
      const hy = pose.y - 17;
      let tension = 0;
      if (ph === "rope") tension = 0.55 + 0.45 * Math.sin(now / 260);
      else if (ph === "slip") tension = clamp((p - 0.55) * 3, 0, 1);
      else if (ph === "recover") tension = 0.7;
      ropeTension.current += (tension - ropeTension.current) * 0.15;
      const pts: [number, number][] = [...anchorsRef.current.slice(-3), [hx, hy]];
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        const len = Math.hypot(bx - ax, by - ay);
        const last = i === pts.length - 1;
        const sag = (6 + len * 0.2) * (last ? 1 - ropeTension.current * 0.9 : 0.6);
        d += ` Q${(ax + bx) / 2} ${Math.max(ay, by) + sag} ${bx} ${by}`;
      }
      ropeRef.current?.setAttribute("d", d);
      ropeShadowRef.current?.setAttribute("d", d);

      // Covered trail glow + pill position.
      coveredRef.current?.style.setProperty("stroke-dashoffset", String(1 - t));
      pillRef.current?.setAttribute(
        "transform",
        `translate(${pose.x + (pose.dir > 0 ? 12 : -12)} ${pose.y - 48}) scale(${1 / ZOOM})`,
      );

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const marks = useMemo(() => markers(priceMin, priceMax), [priceMin, priceMax]);
  const up = (change ?? 0) >= 0;
  const changeLabel = change == null ? "" : `${up ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}%`;
  const priceLabel = price == null ? "" : fmtPrice(price);
  const pillText = price == null ? "" : `${priceLabel}  ${changeLabel}`;
  const pillWidth = 18 + pillText.length * 6.1;
  const caption = CAPTION[phase];
  const captionWidth = 14 + caption.length * 5.2;

  const aria =
    price == null
      ? "ZEC price visualised as a mountaineer on a mountain. Price unavailable right now."
      : `ZEC price visualised as a mountaineer on a mountain, currently at ${priceLabel}, ${up ? "up" : "down"} ${Math.abs(change ?? 0).toFixed(1)} percent in 24 hours. The climber is ${caption.toLowerCase()}.`;

  const trailPoints = TRAIL.map((p) => p.join(",")).join(" ");

  return (
    <div className={`zec-hiker ${className}`} data-phase={phase}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="h-auto w-full">
        <defs>
          <linearGradient id="zh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbf6ea" />
            <stop offset="100%" stopColor="#f1e9d8" />
          </linearGradient>
          <linearGradient id="zh-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ece5d3" />
            <stop offset="100%" stopColor="#e1d7bf" />
          </linearGradient>
          <linearGradient id="zh-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbcfb0" />
            <stop offset="100%" stopColor="#cdbe99" />
          </linearGradient>
          <linearGradient id="zh-front" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#d3c096" />
            <stop offset="50%" stopColor="#bca378" />
            <stop offset="100%" stopColor="#a48a5f" />
          </linearGradient>
          <linearGradient id="zh-facet" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="zh-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#fffdf7" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="zh-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#f4b728" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#f4b728" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#f4b728" stopOpacity="0" />
          </radialGradient>
          <clipPath id="zh-clip">
            <rect x="0" y="0" width={W} height={H} rx="24" />
          </clipPath>
        </defs>

        <g clipPath="url(#zh-clip)">
          <rect x="0" y="0" width={W} height={H} fill="url(#zh-sky)" />

          {/* Everything below is in world space under the camera. */}
          <g ref={camRef}>
            {/* Sky details: sun, clouds, birds. Deep parallax. */}
            <g ref={skyRef}>
              <circle cx="470" cy="80" r="70" fill="url(#zh-sun)" />
              <circle cx="470" cy="80" r="16" fill="#f4b728" opacity="0.32" />
              <g className="zh-cloud zh-cloud-a">
                <ellipse cx="0" cy="0" rx="30" ry="11" fill="#fff" opacity="0.9" />
                <ellipse cx="-14" cy="-7" rx="16" ry="11" fill="#fff" opacity="0.9" />
                <ellipse cx="12" cy="-8" rx="18" ry="12" fill="#fff" opacity="0.9" />
              </g>
              <g className="zh-cloud zh-cloud-b">
                <ellipse cx="0" cy="0" rx="22" ry="8" fill="#fff" opacity="0.75" />
                <ellipse cx="-10" cy="-5" rx="12" ry="8" fill="#fff" opacity="0.75" />
                <ellipse cx="9" cy="-6" rx="13" ry="9" fill="#fff" opacity="0.75" />
              </g>
              <g className="zh-birds" fill="none" stroke="#6a6252" strokeWidth="1" strokeLinecap="round" opacity="0.5">
                <path d="M0 0 q4 -3 8 0 q4 -3 8 0" />
                <path d="M14 8 q3 -2.4 6 0 q3 -2.4 6 0" />
                <path d="M-10 6 q3 -2.4 6 0 q3 -2.4 6 0" />
              </g>
            </g>

            {/* Back range */}
            <g ref={backRef}>
              <path
                d="M-120 300 L-40 250 L30 282 L70 232 L140 272 L210 202 L280 252 L350 192 L420 240 L490 204 L560 262 L640 230 L700 280 L700 500 L-120 500 Z"
                fill="url(#zh-back)"
              />
              <path d="M340 200 L350 192 L360 200 Z M480 212 L490 204 L500 212 Z" fill="#fff" opacity="0.6" />
            </g>

            {/* Mid range */}
            <g ref={midRef}>
              <path
                d="M-100 350 L-20 300 L40 330 L90 274 L160 302 L240 224 L300 262 L380 204 L450 252 L520 214 L560 252 L640 226 L700 300 L700 500 L-100 500 Z"
                fill="url(#zh-mid)"
              />
              <g fill="none" stroke="#191510" strokeOpacity="0.06" strokeWidth="1">
                <path d="M110 300 C140 290, 170 296, 200 280" />
                <path d="M300 262 C330 250, 360 236, 386 214" />
                <path d="M450 252 C480 240, 500 232, 520 220" />
              </g>
            </g>

            {/* Front mountain (the one we climb) */}
            <g>
              <path
                d="M-60 440 L0 412 L60 360 L110 318 L150 272 L200 232 L240 178 L285 128 L330 72 L365 118 L400 168 L445 222 L490 290 L530 350 L560 412 L620 440 L620 500 L-60 500 Z"
                fill="url(#zh-front)"
              />
              <path
                d="M330 72 L365 118 L400 168 L445 222 L490 290 L530 350 L560 412 L620 440 L620 500 L300 500 C312 320, 322 200, 330 72 Z"
                fill="url(#zh-facet)"
              />
              {/* Rock strata and contour lines */}
              <g fill="none" stroke="#191510" strokeOpacity="0.12" strokeWidth="0.9" strokeLinecap="round">
                <path d="M70 372 C110 356, 140 350, 175 330" />
                <path d="M140 330 C180 312, 205 300, 236 274" />
                <path d="M200 300 C240 282, 262 262, 290 234" />
                <path d="M250 232 C275 214, 292 196, 312 168" />
                <path d="M340 150 C360 172, 380 196, 402 222" />
                <path d="M380 240 C410 262, 440 296, 466 330" />
                <path d="M420 330 C450 352, 480 376, 505 396" />
                <path d="M30 400 C60 392, 84 386, 112 376" />
                <path d="M160 350 C190 338, 214 330, 246 312" />
                <path d="M226 200 C246 188, 262 176, 282 158" />
                <path d="M90 300 C110 292, 126 286, 146 276" />
                <path d="M270 236 C286 226, 300 216, 318 200" />
              </g>
              {/* Cracks */}
              <g fill="none" stroke="#191510" strokeOpacity="0.2" strokeWidth="0.8" strokeLinecap="round">
                <path d="M186 288 l6 8 l-3 7 l5 6" />
                <path d="M258 214 l4 6 l-2 5" />
                <path d="M132 348 l5 5 l-2 6" />
                <path d="M292 172 l3 5 l-2 4 l4 5" />
              </g>
              {/* Rock outcrops along the trail */}
              <g fill="#9c8259" stroke="#7d6845" strokeWidth="0.8" strokeLinejoin="round">
                <path d="M126 386 l10 -8 l12 3 l4 8 l-9 5 l-14 -1 z" />
                <path d="M188 314 l8 -7 l10 2 l3 7 l-8 4 l-11 -1 z" />
                <path d="M248 276 l7 -6 l9 2 l2 6 l-7 4 l-10 -1 z" />
                <path d="M236 246 l6 -5 l8 2 l2 5 l-6 3 l-9 -1 z" />
                <path d="M282 206 l7 -6 l8 2 l2 6 l-7 3 l-9 -1 z" />
                <path d="M308 164 l6 -5 l7 2 l1 5 l-6 3 l-8 -1 z" />
                <path d="M84 352 l7 -6 l9 2 l2 6 l-7 3 l-9 -1 z" />
              </g>
              <g fill="#fff" opacity="0.35">
                <path d="M126 386 l10 -8 l12 3 l-12 2 z" />
                <path d="M188 314 l8 -7 l10 2 l-10 2 z" />
                <path d="M248 276 l7 -6 l9 2 l-9 2 z" />
                <path d="M282 206 l7 -6 l8 2 l-8 2 z" />
              </g>
              {/* Scree */}
              <g fill="#8a7350" opacity="0.7">
                <circle cx="150" cy="392" r="1.4" />
                <circle cx="158" cy="396" r="1" />
                <circle cx="204" cy="330" r="1.2" />
                <circle cx="212" cy="334" r="0.9" />
                <circle cx="262" cy="290" r="1.1" />
                <circle cx="270" cy="286" r="0.8" />
                <circle cx="296" cy="216" r="1.1" />
                <circle cx="318" cy="176" r="0.9" />
              </g>
              {/* Snow near the summit */}
              <path d="M300 112 L330 72 L360 112 L350 106 L340 116 L330 106 L320 116 L310 106 Z" fill="url(#zh-snow)" />
              <g fill="#fff" opacity="0.75">
                <ellipse cx="290" cy="146" rx="9" ry="3" />
                <ellipse cx="342" cy="136" rx="7" ry="2.6" />
                <ellipse cx="318" cy="128" rx="6" ry="2.2" />
              </g>
              {/* Ridge light */}
              <path
                d="M330 72 L365 118 L400 168 L445 222 L490 290"
                fill="none"
                stroke="#fff"
                strokeOpacity="0.4"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              {/* Vegetation: pines low down, shrubs mid-way */}
              <g fill="#5e6a4a">
                <path d="M18 418 L28 388 L38 418 Z" />
                <path d="M22 406 L28 392 L34 406 Z" fill="#6d7a56" />
                <path d="M40 420 L48 398 L56 420 Z" />
                <path d="M62 416 L70 394 L78 416 Z" />
                <path d="M66 404 L70 396 L74 404 Z" fill="#6d7a56" />
                <path d="M452 420 L460 398 L468 420 Z" />
                <path d="M474 424 L480 408 L486 424 Z" />
              </g>
              <g stroke="#4f4230" strokeWidth="1.2">
                <line x1="28" y1="418" x2="28" y2="424" />
                <line x1="48" y1="420" x2="48" y2="425" />
                <line x1="70" y1="416" x2="70" y2="424" />
                <line x1="460" y1="420" x2="460" y2="425" />
              </g>
              <g fill="#7b8a5c" opacity="0.85">
                <circle cx="110" cy="330" r="3" />
                <circle cx="114" cy="332" r="2.4" />
                <circle cx="176" cy="308" r="2.6" />
                <circle cx="180" cy="310" r="2" />
                <circle cx="226" cy="238" r="2.2" />
                <circle cx="229" cy="240" r="1.7" />
              </g>
              {/* Cairn */}
              <g fill="#8a7350">
                <ellipse cx="232" cy="270" rx="4" ry="1.6" />
                <ellipse cx="232" cy="267.5" rx="3" ry="1.3" />
                <ellipse cx="232" cy="265.5" rx="2" ry="1" />
              </g>
              {/* Ground */}
              <rect x="-60" y="422" width="680" height="80" fill="#b39c6d" />
              <path d="M-60 424 C40 420, 120 428, 220 424 C320 420, 420 428, 620 424" fill="none" stroke="#9a835a" strokeWidth="1" />
            </g>

            {/* Trail: dotted, with the covered part glowing gold */}
            <polyline
              points={trailPoints}
              fill="none"
              stroke="#6b4708"
              strokeOpacity="0.4"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.1 5"
            />
            <polyline
              ref={coveredRef}
              className="zh-trail-covered"
              points={trailPoints}
              fill="none"
              stroke="#f4b728"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              style={{ strokeDashoffset: 1 }}
            />

            {/* Altitude signposts planted beside the trail */}
            {marks.map((v) => {
              const p = poseAt(priceToT(v, priceMin, priceMax));
              const sx = p.x + 11;
              const sy = p.y - 1;
              return (
                <g key={v} opacity="0.9">
                  <line x1={sx} y1={sy} x2={sx} y2={sy - 14} stroke="#5b4a33" strokeWidth="1.4" strokeLinecap="round" />
                  <rect x={sx - 1} y={sy - 21} width="30" height="8.5" rx="1.5" fill="#e9dcc0" stroke="#5b4a33" strokeWidth="0.8" />
                  <text
                    x={sx + 14}
                    y={sy - 14.8}
                    textAnchor="middle"
                    fontFamily="var(--font-body), Inter, sans-serif"
                    fontSize="5.4"
                    fontWeight="600"
                    fill="#3f3223"
                  >
                    {fmtShort(v)}
                  </text>
                </g>
              );
            })}

            {/* Summit flag + a little snow in the air */}
            <g>
              <line x1={PEAK[0]} y1={PEAK[1]} x2={PEAK[0]} y2={PEAK[1] - 24} stroke="#2d2a26" strokeWidth="1.4" strokeLinecap="round" />
              <path
                className="zh-flag"
                d={`M${PEAK[0]} ${PEAK[1] - 24} L${PEAK[0] + 15} ${PEAK[1] - 19.5} L${PEAK[0]} ${PEAK[1] - 14} Z`}
                fill="#f4b728"
                style={{ transformOrigin: `${PEAK[0]}px ${PEAK[1] - 24}px` }}
              />
              <g className="zh-flakes" fill="#fff" opacity="0.8">
                <circle cx="300" cy="90" r="0.9" />
                <circle cx="318" cy="80" r="0.7" />
                <circle cx="346" cy="86" r="0.9" />
                <circle cx="360" cy="100" r="0.7" />
                <circle cx="334" cy="98" r="0.6" />
              </g>
            </g>

            {/* Anchors placed so far */}
            {anchors.map(([x, y], i) => (
              <g key={`${x}-${y}-${i}`}>
                <circle cx={x} cy={y} r="2.2" fill="#3a3129" />
                <circle cx={x} cy={y} r="1.1" fill="none" stroke="#f4b728" strokeWidth="0.7" />
              </g>
            ))}

            {/* Rope */}
            <path ref={ropeShadowRef} fill="none" stroke="#191510" strokeOpacity="0.18" strokeWidth="2.2" strokeLinecap="round" transform="translate(0.6 1)" />
            <path ref={ropeRef} className="zh-rope" fill="none" stroke="#d8462f" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="3 1.2" />

            {/* The climber. Feet at the origin, facing +x. */}
            <g ref={hikerRef}>
              <ellipse cx="1" cy="1.2" rx="7" ry="1.8" fill="#191510" opacity="0.18" />

              {/* Dust at the boots while climbing */}
              <g className="zh-dust" fill="#d9c9a3">
                <circle className="zh-dust-1" cx="-3" cy="0" r="1.6" />
                <circle className="zh-dust-2" cx="-6" cy="-1" r="1.2" />
                <circle className="zh-dust-3" cx="-1" cy="0.5" r="1" />
              </g>

              {/* Rocks that tumble when slipping (restart each slip via key) */}
              <g key={`rocks-${tick}`} className="zh-rocks" fill="#8a7350">
                <path className="zh-rock zh-rock-1" d="M-2 -1 l3 -2 l3 1 l0 3 l-3 1 z" />
                <path className="zh-rock zh-rock-2" d="M-3 0 l2 -2 l3 1 l-1 3 z" />
                <circle className="zh-rock zh-rock-3" cx="0" cy="0" r="1.1" />
              </g>

              <g className="zh-body">
                {/* Back arm holding the rope */}
                <g className="zh-arm-back" style={{ transformOrigin: "-1px -27px" }}>
                  <line x1="-1" y1="-27" x2="-7" y2="-21" stroke="#f4b728" strokeWidth="3.2" strokeLinecap="round" />
                  <g className="zh-forearm-back" style={{ transformOrigin: "-7px -21px" }}>
                    <line x1="-7" y1="-21" x2="-9" y2="-14" stroke="#d9b48a" strokeWidth="2.6" strokeLinecap="round" />
                    <circle cx="-9" cy="-13.5" r="1.7" fill="#c9a07a" />
                  </g>
                </g>

                {/* Backpack with sleeping mat and bottle */}
                <rect x="-12" y="-32" width="9" height="15" rx="2.8" fill="#6b4708" />
                <rect x="-12.5" y="-34.5" width="10" height="4" rx="2" fill="#8a5e12" />
                <rect x="-11" y="-28" width="7" height="1.6" rx="0.8" fill="#8a5e12" />
                <rect x="-4.5" y="-24" width="2.2" height="5" rx="1" fill="#1C3A5F" />

                {/* Legs: thigh + shin with a knee */}
                <g className="zh-thigh zh-thigh-a" style={{ transformOrigin: "0px -16px" }}>
                  <line x1="0" y1="-16" x2="3" y2="-8" stroke="#2d2a26" strokeWidth="3.6" strokeLinecap="round" />
                  <g className="zh-shin zh-shin-a" style={{ transformOrigin: "3px -8px" }}>
                    <line x1="3" y1="-8" x2="4" y2="-1" stroke="#3a3531" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M1.2 -1.6 h6 a1.6 1.6 0 0 1 1.6 1.6 v0.8 h-8 z" fill="#191510" />
                  </g>
                </g>
                <g className="zh-thigh zh-thigh-b" style={{ transformOrigin: "0px -16px" }}>
                  <line x1="0" y1="-16" x2="-3" y2="-8" stroke="#2d2a26" strokeWidth="3.6" strokeLinecap="round" />
                  <g className="zh-shin zh-shin-b" style={{ transformOrigin: "-3px -8px" }}>
                    <line x1="-3" y1="-8" x2="-3" y2="-1" stroke="#3a3531" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M-6 -1.6 h6.2 a1.6 1.6 0 0 1 1.6 1.6 v0.8 h-7.8 z" fill="#191510" />
                  </g>
                </g>

                {/* Torso: gold Zcash India shell jacket, harness, shield */}
                <g className="zh-torso">
                  <path d="M-6.5 -31 h13 a3.5 3.5 0 0 1 3.5 3.5 v11.5 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-11.5 a3.5 3.5 0 0 1 3.5 -3.5 z" fill="#f4b728" />
                  <path d="M-4 -31 v17.5" stroke="#e0a418" strokeWidth="0.8" />
                  <rect x="-7" y="-18.5" width="14" height="2.6" rx="1" fill="#2d2a26" />
                  <path d="M-3 -16 v3 M3 -16 v3" stroke="#2d2a26" strokeWidth="1.6" strokeLinecap="round" />
                  <circle cx="2" cy="-17.2" r="1.6" fill="none" stroke="#f4b728" strokeWidth="0.9" />
                  <path
                    d="M1 -28.6 L4.6 -27.2 V-23.8 C4.6 -21.4 3 -19.9 1 -19 C-1 -19.9 -2.6 -21.4 -2.6 -23.8 V-27.2 Z"
                    fill="#1C3A5F"
                  />
                  <path d="M-0.5 -26.2 H2.6 L-0.5 -22.2 H2.6" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Front arm with the ice axe */}
                <g className="zh-arm-front" style={{ transformOrigin: "2px -27px" }}>
                  <line x1="2" y1="-27" x2="8" y2="-22" stroke="#f4b728" strokeWidth="3.2" strokeLinecap="round" />
                  <g className="zh-forearm-front" style={{ transformOrigin: "8px -22px" }}>
                    <line x1="8" y1="-22" x2="11" y2="-16" stroke="#d9b48a" strokeWidth="2.6" strokeLinecap="round" />
                    <circle cx="11.2" cy="-15.6" r="1.8" fill="#c9a07a" />
                    {/* Ice axe: shaft + pick */}
                    <g className="zh-axe" style={{ transformOrigin: "11px -16px" }}>
                      <line x1="9" y1="-8" x2="13" y2="-24" stroke="#4f4230" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M11.4 -24.6 l5 -1.2 l-1 2.4 z M11.4 -24.6 l-3 -1.4 l0.4 2.2 z" fill="#8f8f95" />
                    </g>
                    <g className="zh-sparks" key={`sparks-${tick}`} stroke="#f4b728" strokeWidth="0.9" strokeLinecap="round">
                      <line className="zh-spark zh-spark-1" x1="14" y1="-26" x2="17" y2="-29" />
                      <line className="zh-spark zh-spark-2" x1="14" y1="-26" x2="18" y2="-25" />
                      <line className="zh-spark zh-spark-3" x1="14" y1="-26" x2="16" y2="-22" />
                    </g>
                  </g>
                </g>

                {/* Head, helmet, headlamp */}
                <g className="zh-head" style={{ transformOrigin: "1px -33px" }}>
                  <circle cx="1.2" cy="-37.5" r="4.6" fill="#d9b48a" />
                  <path d="M-3.6 -38.6 A4.9 4.9 0 0 1 6 -38.6 L6 -37.2 L-3.6 -37.2 Z" fill="#1C3A5F" />
                  <path d="M-3.6 -38.6 A4.9 4.9 0 0 1 6 -38.6" fill="none" stroke="#f4b728" strokeWidth="0.7" />
                  <rect x="4.2" y="-39.6" width="2.4" height="1.6" rx="0.5" fill="#f4b728" />
                  <circle cx="3.2" cy="-37" r="0.6" fill="#191510" />
                  <path d="M3.4 -34.8 q1 0.6 2 0" fill="none" stroke="#a5795a" strokeWidth="0.6" strokeLinecap="round" />
                  <path d="M0.5 -33.4 q1.2 1.4 2.8 0.6" fill="none" stroke="#b08a6a" strokeWidth="0.5" strokeLinecap="round" />
                </g>
              </g>
            </g>

            {/* Price pill + action caption, near the climber, drawn at screen scale */}
            <g ref={pillRef}>
              {status === "ready" && price != null && (
                <g>
                  <rect x="0" y="-12" width={pillWidth} height="24" rx="12" fill="#fff" fillOpacity="0.9" stroke="#191510" strokeOpacity="0.1" />
                  <text x="11" y="4.5" fontFamily="var(--font-body), Inter, sans-serif" fontSize="12" fontWeight="600" fill="#191510">
                    {priceLabel}
                    <tspan dx="6" fontSize="10" fontWeight="600" fill={up ? "#1f7a46" : "#b23a2e"}>
                      {changeLabel}
                    </tspan>
                  </text>
                  <rect x="0" y="16" width={captionWidth} height="16" rx="8" fill="#191510" fillOpacity="0.72" />
                  <text x="7" y="27.5" fontFamily="var(--font-body), Inter, sans-serif" fontSize="9" fontWeight="500" fill="#fff">
                    {caption}
                  </text>
                </g>
              )}
              {status === "loading" && (
                <rect className="zh-shimmer" x="0" y="-12" width="72" height="24" rx="12" fill="#e9e2d1" />
              )}
              {status === "failed" && (
                <g>
                  <rect x="0" y="16" width={captionWidth} height="16" rx="8" fill="#191510" fillOpacity="0.72" />
                  <text x="7" y="27.5" fontFamily="var(--font-body), Inter, sans-serif" fontSize="9" fontWeight="500" fill="#fff">
                    {caption}
                  </text>
                </g>
              )}
            </g>
          </g>
        </g>
      </svg>

      <style>{`
        .zec-hiker .zh-trail-covered { filter: drop-shadow(0 0 1.6px rgba(244,183,40,.7)); }
        .zec-hiker .zh-rope { filter: drop-shadow(0 0.6px 0.4px rgba(0,0,0,.25)); }

        /* Ambient */
        .zec-hiker .zh-cloud-a { --zh-y: 130px; animation: zh-drift 90s linear infinite; }
        .zec-hiker .zh-cloud-b { --zh-y: 176px; animation: zh-drift 120s linear infinite; animation-delay: -50s; }
        .zec-hiker .zh-birds { animation: zh-birds 70s linear infinite; }
        .zec-hiker .zh-flag { animation: zh-flutter 1.6s ease-in-out infinite; }
        .zec-hiker .zh-flakes circle { animation: zh-fall 3.2s linear infinite; }
        .zec-hiker .zh-flakes circle:nth-child(2) { animation-delay: -1s; }
        .zec-hiker .zh-flakes circle:nth-child(3) { animation-delay: -2.1s; }
        .zec-hiker .zh-flakes circle:nth-child(4) { animation-delay: -0.5s; }
        .zec-hiker .zh-flakes circle:nth-child(5) { animation-delay: -1.6s; }
        .zec-hiker .zh-shimmer { animation: zh-shimmer 1.4s ease-in-out infinite; }

        /* Default: limbs at rest, effects hidden */
        .zec-hiker .zh-dust, .zec-hiker .zh-rocks, .zec-hiker .zh-sparks { opacity: 0; }

        /* ---- Climbing: walk cycle with knees, arms, bob, dust ---- */
        .zec-hiker[data-phase="climb"] .zh-body,
        .zec-hiker[data-phase="intro"] .zh-body { animation: zh-bob 0.9s ease-in-out infinite; }
        .zec-hiker[data-phase="climb"] .zh-thigh-a,
        .zec-hiker[data-phase="intro"] .zh-thigh-a { animation: zh-thigh 0.9s ease-in-out infinite; }
        .zec-hiker[data-phase="climb"] .zh-thigh-b,
        .zec-hiker[data-phase="intro"] .zh-thigh-b { animation: zh-thigh 0.9s ease-in-out infinite; animation-delay: -0.45s; }
        .zec-hiker[data-phase="climb"] .zh-shin-a,
        .zec-hiker[data-phase="intro"] .zh-shin-a { animation: zh-shin 0.9s ease-in-out infinite; }
        .zec-hiker[data-phase="climb"] .zh-shin-b,
        .zec-hiker[data-phase="intro"] .zh-shin-b { animation: zh-shin 0.9s ease-in-out infinite; animation-delay: -0.45s; }
        .zec-hiker[data-phase="climb"] .zh-arm-front,
        .zec-hiker[data-phase="intro"] .zh-arm-front { animation: zh-armswing 0.9s ease-in-out infinite; }
        .zec-hiker[data-phase="climb"] .zh-arm-back,
        .zec-hiker[data-phase="intro"] .zh-arm-back { animation: zh-armswing 0.9s ease-in-out infinite; animation-delay: -0.45s; }
        .zec-hiker[data-phase="climb"] .zh-head,
        .zec-hiker[data-phase="intro"] .zh-head { animation: zh-nod 0.9s ease-in-out infinite; }
        .zec-hiker[data-phase="climb"] .zh-dust,
        .zec-hiker[data-phase="intro"] .zh-dust { opacity: 1; }
        .zec-hiker .zh-dust-1 { animation: zh-puff 0.9s ease-out infinite; }
        .zec-hiker .zh-dust-2 { animation: zh-puff 0.9s ease-out infinite; animation-delay: -0.3s; }
        .zec-hiker .zh-dust-3 { animation: zh-puff 0.9s ease-out infinite; animation-delay: -0.6s; }

        /* ---- Drilling an anchor: kneel, hammer the axe, sparks ---- */
        .zec-hiker[data-phase="drill"] .zh-body { animation: zh-kneel 4.2s ease-in-out forwards; }
        .zec-hiker[data-phase="drill"] .zh-thigh-a { transform: rotate(-38deg); }
        .zec-hiker[data-phase="drill"] .zh-shin-a { transform: rotate(60deg); }
        .zec-hiker[data-phase="drill"] .zh-thigh-b { transform: rotate(14deg); }
        .zec-hiker[data-phase="drill"] .zh-shin-b { transform: rotate(-6deg); }
        .zec-hiker[data-phase="drill"] .zh-arm-front { animation: zh-hammer 0.34s ease-in infinite; animation-delay: 0.8s; }
        .zec-hiker[data-phase="drill"] .zh-forearm-front { transform: rotate(38deg); }
        .zec-hiker[data-phase="drill"] .zh-axe { transform: rotate(-70deg); }
        .zec-hiker[data-phase="drill"] .zh-arm-back { transform: rotate(-30deg); }
        .zec-hiker[data-phase="drill"] .zh-head { transform: rotate(18deg); }
        .zec-hiker[data-phase="drill"] .zh-sparks { animation: zh-sparks-on 4.2s steps(1) forwards; }
        .zec-hiker .zh-spark-1 { animation: zh-spark 0.34s ease-out infinite; }
        .zec-hiker .zh-spark-2 { animation: zh-spark 0.34s ease-out infinite; animation-delay: -0.11s; }
        .zec-hiker .zh-spark-3 { animation: zh-spark 0.34s ease-out infinite; animation-delay: -0.22s; }

        /* ---- Checking the rope: turn, pull with both hands, tug ---- */
        .zec-hiker[data-phase="rope"] .zh-body { animation: zh-tug 1.2s ease-in-out infinite; }
        .zec-hiker[data-phase="rope"] .zh-arm-back { animation: zh-pull 1.2s ease-in-out infinite; }
        .zec-hiker[data-phase="rope"] .zh-forearm-back { transform: rotate(-50deg); }
        .zec-hiker[data-phase="rope"] .zh-arm-front { transform: rotate(-110deg); }
        .zec-hiker[data-phase="rope"] .zh-forearm-front { transform: rotate(-30deg); }
        .zec-hiker[data-phase="rope"] .zh-axe { transform: rotate(30deg); }
        .zec-hiker[data-phase="rope"] .zh-head { transform: rotate(-16deg); }
        .zec-hiker[data-phase="rope"] .zh-thigh-a { transform: rotate(-16deg); }
        .zec-hiker[data-phase="rope"] .zh-thigh-b { transform: rotate(12deg); }

        /* ---- Catching breath: hand on hip, look up, wipe brow ---- */
        .zec-hiker[data-phase="rest"] .zh-body { animation: zh-breathe 2.2s ease-in-out infinite; }
        .zec-hiker[data-phase="rest"] .zh-arm-front { animation: zh-wipe 4.4s ease-in-out infinite; }
        .zec-hiker[data-phase="rest"] .zh-forearm-front { animation: zh-wipe-fore 4.4s ease-in-out infinite; }
        .zec-hiker[data-phase="rest"] .zh-arm-back { transform: rotate(40deg); }
        .zec-hiker[data-phase="rest"] .zh-forearm-back { transform: rotate(-70deg); }
        .zec-hiker[data-phase="rest"] .zh-head { animation: zh-lookup 4.4s ease-in-out infinite; }
        .zec-hiker[data-phase="rest"] .zh-thigh-b { transform: rotate(10deg); }

        /* ---- Slipping: thrown back, arms up, legs splayed, rocks tumble ---- */
        .zec-hiker[data-phase="slip"] .zh-body { animation: zh-slipbody 1.4s ease-out forwards; }
        .zec-hiker[data-phase="slip"] .zh-arm-front { animation: zh-flail 0.4s ease-in-out infinite; }
        .zec-hiker[data-phase="slip"] .zh-arm-back { animation: zh-flail 0.4s ease-in-out infinite; animation-delay: -0.2s; }
        .zec-hiker[data-phase="slip"] .zh-forearm-front { transform: rotate(-60deg); }
        .zec-hiker[data-phase="slip"] .zh-forearm-back { transform: rotate(-40deg); }
        .zec-hiker[data-phase="slip"] .zh-thigh-a { transform: rotate(40deg); }
        .zec-hiker[data-phase="slip"] .zh-shin-a { transform: rotate(-30deg); }
        .zec-hiker[data-phase="slip"] .zh-thigh-b { transform: rotate(-36deg); }
        .zec-hiker[data-phase="slip"] .zh-shin-b { transform: rotate(50deg); }
        .zec-hiker[data-phase="slip"] .zh-head { transform: rotate(-24deg); }
        .zec-hiker[data-phase="slip"] .zh-rocks { opacity: 1; }
        .zec-hiker[data-phase="slip"] .zh-dust { opacity: 1; }
        .zec-hiker .zh-rock-1 { animation: zh-tumble-1 1.5s cubic-bezier(.4,0,1,1) forwards; }
        .zec-hiker .zh-rock-2 { animation: zh-tumble-2 1.7s cubic-bezier(.4,0,1,1) forwards; animation-delay: 0.1s; }
        .zec-hiker .zh-rock-3 { animation: zh-tumble-3 1.3s cubic-bezier(.4,0,1,1) forwards; animation-delay: 0.05s; }

        /* ---- Recovering: wobble on the edge, plant the axe, stand ---- */
        .zec-hiker[data-phase="recover"] .zh-body { animation: zh-wobble 1.7s ease-out forwards; }
        .zec-hiker[data-phase="recover"] .zh-arm-front { animation: zh-plant 1.7s ease-out forwards; }
        .zec-hiker[data-phase="recover"] .zh-arm-back { animation: zh-balance 1.7s ease-out forwards; }
        .zec-hiker[data-phase="recover"] .zh-thigh-a { animation: zh-stance-a 1.7s ease-out forwards; }
        .zec-hiker[data-phase="recover"] .zh-thigh-b { animation: zh-stance-b 1.7s ease-out forwards; }
        .zec-hiker[data-phase="recover"] .zh-head { animation: zh-shake 1.7s ease-out forwards; }

        /* Smooth handoffs between poses */
        .zec-hiker .zh-thigh, .zec-hiker .zh-shin, .zec-hiker .zh-arm-front, .zec-hiker .zh-arm-back,
        .zec-hiker .zh-forearm-front, .zec-hiker .zh-forearm-back, .zec-hiker .zh-axe, .zec-hiker .zh-head,
        .zec-hiker .zh-body { transition: transform 0.5s ease-in-out; }

        @keyframes zh-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.2px); } }
        @keyframes zh-thigh { 0%,100% { transform: rotate(-28deg); } 50% { transform: rotate(30deg); } }
        @keyframes zh-shin { 0% { transform: rotate(10deg); } 30% { transform: rotate(-52deg); } 60% { transform: rotate(-8deg); } 100% { transform: rotate(10deg); } }
        @keyframes zh-armswing { 0%,100% { transform: rotate(22deg); } 50% { transform: rotate(-26deg); } }
        @keyframes zh-nod { 0%,100% { transform: rotate(2deg); } 50% { transform: rotate(-3deg); } }
        @keyframes zh-puff { 0% { transform: translate(0,0) scale(0.4); opacity: 0.9; } 100% { transform: translate(-7px,-4px) scale(1.8); opacity: 0; } }

        @keyframes zh-kneel { 0% { transform: translateY(0); } 20%,100% { transform: translateY(4px) rotate(6deg); } }
        @keyframes zh-hammer { 0% { transform: rotate(-95deg); } 45% { transform: rotate(-52deg); } 60% { transform: rotate(-58deg); } 100% { transform: rotate(-95deg); } }
        @keyframes zh-sparks-on { 0%,18% { opacity: 0; } 19%,66% { opacity: 1; } 67%,100% { opacity: 0; } }
        @keyframes zh-spark { 0% { transform: scale(0.2); opacity: 1; } 100% { transform: scale(1.4) translate(2px,-2px); opacity: 0; } }

        @keyframes zh-tug { 0%,100% { transform: translateX(0) rotate(0); } 50% { transform: translateX(-1.5px) rotate(-5deg); } }
        @keyframes zh-pull { 0%,100% { transform: rotate(-70deg); } 50% { transform: rotate(-100deg); } }

        @keyframes zh-breathe { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(-0.8px) scaleY(1.03); } }
        @keyframes zh-wipe { 0%,55%,100% { transform: rotate(-18deg); } 70%,85% { transform: rotate(-150deg); } }
        @keyframes zh-wipe-fore { 0%,55%,100% { transform: rotate(-90deg); } 70%,85% { transform: rotate(-60deg); } }
        @keyframes zh-lookup { 0%,40%,100% { transform: rotate(0); } 15%,30% { transform: rotate(-22deg); } 70%,85% { transform: rotate(10deg); } }

        @keyframes zh-slipbody { 0% { transform: rotate(0) translateY(0); } 35% { transform: rotate(22deg) translateY(1px); } 70% { transform: rotate(30deg) translateY(3px); } 100% { transform: rotate(18deg) translateY(2px); } }
        @keyframes zh-flail { 0%,100% { transform: rotate(-120deg); } 50% { transform: rotate(-170deg); } }
        @keyframes zh-tumble-1 { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(-34px,46px) rotate(-420deg); opacity: 0; } }
        @keyframes zh-tumble-2 { 0% { transform: translate(0,0) rotate(0); opacity: 1; } 100% { transform: translate(-22px,52px) rotate(300deg); opacity: 0; } }
        @keyframes zh-tumble-3 { 0% { transform: translate(0,0); opacity: 1; } 100% { transform: translate(-40px,38px); opacity: 0; } }

        @keyframes zh-wobble { 0% { transform: rotate(18deg) translateY(2px); } 25% { transform: rotate(-9deg); } 50% { transform: rotate(7deg); } 75% { transform: rotate(-3deg); } 100% { transform: rotate(0) translateY(0); } }
        @keyframes zh-plant { 0% { transform: rotate(-140deg); } 30% { transform: rotate(-20deg); } 100% { transform: rotate(-10deg); } }
        @keyframes zh-balance { 0% { transform: rotate(-150deg); } 40% { transform: rotate(-60deg); } 100% { transform: rotate(0); } }
        @keyframes zh-stance-a { 0% { transform: rotate(40deg); } 50% { transform: rotate(-20deg); } 100% { transform: rotate(-4deg); } }
        @keyframes zh-stance-b { 0% { transform: rotate(-36deg); } 50% { transform: rotate(22deg); } 100% { transform: rotate(6deg); } }
        @keyframes zh-shake { 0% { transform: rotate(-24deg); } 40% { transform: rotate(8deg); } 70% { transform: rotate(-6deg); } 100% { transform: rotate(0); } }

        @keyframes zh-flutter { 0%,100% { transform: skewY(0) scaleX(1); } 50% { transform: skewY(5deg) scaleX(0.9); } }
        @keyframes zh-drift { from { transform: translate(-80px, var(--zh-y)); } to { transform: translate(660px, var(--zh-y)); } }
        @keyframes zh-birds { from { transform: translate(600px, 40px); } to { transform: translate(-80px, 70px); } }
        @keyframes zh-fall { 0% { transform: translate(0,-6px); opacity: 0; } 15% { opacity: 0.9; } 100% { transform: translate(-4px,26px); opacity: 0; } }
        @keyframes zh-shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

        @media (prefers-reduced-motion: reduce) {
          .zec-hiker * { animation: none !important; transition: none !important; }
          .zec-hiker .zh-dust, .zec-hiker .zh-rocks, .zec-hiker .zh-sparks { opacity: 0 !important; }
        }
      `}</style>
    </div>
  );
}
