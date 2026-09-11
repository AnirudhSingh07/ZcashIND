"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ZEC Hiker: an editorial mountain illustration where a small hiker in Zcash
 * India merch climbs the trail as the ZEC price rises. Pure SVG + CSS; the only
 * JS is the price poll and the trail-position math.
 *
 * The trail is a polyline in SVG user units. Price maps linearly onto distance
 * along the trail, clamped to [priceMin, priceMax], so the hiker never leaves
 * the mountain.
 */

export interface ZecHikerProps {
  price: number | null;
  change24h: number | null;
  priceMin?: number;
  priceMax?: number;
  className?: string;
}

/** The dotted trail, base to summit, in viewBox units (0 0 560 440). */
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
const RIGHT_EDGE = 500;

const SEGMENTS = (() => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < TRAIL.length; i++) {
    const [x0, y0] = TRAIL[i - 1];
    const [x1, y1] = TRAIL[i];
    const l = Math.hypot(x1 - x0, y1 - y0);
    lens.push(l);
    total += l;
  }
  return { lens, total };
})();

/** Point on the trail at fraction t in [0, 1]. */
function trailPoint(t: number): [number, number] {
  const target = Math.min(1, Math.max(0, t)) * SEGMENTS.total;
  let acc = 0;
  for (let i = 0; i < SEGMENTS.lens.length; i++) {
    const l = SEGMENTS.lens[i];
    if (acc + l >= target || i === SEGMENTS.lens.length - 1) {
      const k = l === 0 ? 0 : (target - acc) / l;
      const [x0, y0] = TRAIL[i];
      const [x1, y1] = TRAIL[i + 1];
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    acc += l;
  }
  return TRAIL[TRAIL.length - 1];
}

function priceToT(price: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.min(1, Math.max(0, (price - min) / (max - min)));
}

/** Altitude markers: 5 round-number price levels between min and max. */
function markers(min: number, max: number): number[] {
  const rawStep = (max - min) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, rawStep))));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * mag);
  const step = nice.reduce((a, b) => (Math.abs(b - rawStep) < Math.abs(a - rawStep) ? b : a));
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(v);
  if (out[0] !== min) out.unshift(min);
  return out;
}

const fmtPrice = (p: number) =>
  p >= 100 ? `$${Math.round(p).toLocaleString("en-US")}` : `$${p.toFixed(2)}`;

export function ZecHiker({
  price: initialPrice,
  change24h: initialChange,
  priceMin = 15,
  priceMax = 80,
  className = "",
}: ZecHikerProps) {
  const [price, setPrice] = useState<number | null>(initialPrice);
  const [change, setChange] = useState<number | null>(initialChange);
  // "loading" only while we have no price and a fetch may still succeed.
  const [status, setStatus] = useState<"ready" | "loading" | "failed">(
    initialPrice == null ? "loading" : "ready",
  );

  // Keep the hiker moving for people who stay on the page.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/zec-price", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { ok: boolean; price?: number; change24h?: number };
        if (cancelled || !data.ok || typeof data.price !== "number") throw new Error("bad");
        setPrice(data.price);
        setChange(typeof data.change24h === "number" ? data.change24h : 0);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus((s) => (s === "loading" ? "failed" : s));
      }
    };
    if (initialPrice == null) load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [initialPrice]);

  const t = price == null ? 0.5 : priceToT(price, priceMin, priceMax);
  const [hx, hy] = trailPoint(t);
  const marks = useMemo(() => markers(priceMin, priceMax), [priceMin, priceMax]);

  const up = (change ?? 0) >= 0;
  const changeLabel =
    change == null ? "" : `${up ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}%`;
  const priceLabel = price == null ? "" : fmtPrice(price);
  const pillText = price == null ? "" : `${priceLabel}  ${changeLabel}`;
  const pillWidth = 16 + pillText.length * 5.6;

  const aria =
    price == null
      ? "ZEC price visualised as a hiker on a mountain. Price unavailable right now."
      : `ZEC price visualised as a hiker on a mountain, currently at ${priceLabel}, ${up ? "up" : "down"} ${Math.abs(change ?? 0).toFixed(1)} percent in 24 hours.`;

  const trailPoints = TRAIL.map((p) => p.join(",")).join(" ");

  return (
    <div className={`zec-hiker ${className}`}>
      <svg
        viewBox="0 0 560 440"
        role="img"
        aria-label={aria}
        className="h-auto w-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="zh-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fdfbf6" />
            <stop offset="100%" stopColor="#f3ede0" />
          </linearGradient>
          <linearGradient id="zh-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ece5d3" />
            <stop offset="100%" stopColor="#e3dac4" />
          </linearGradient>
          <linearGradient id="zh-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ddd1b4" />
            <stop offset="100%" stopColor="#d1c3a1" />
          </linearGradient>
          <linearGradient id="zh-front" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#d2bf97" />
            <stop offset="55%" stopColor="#bda57a" />
            <stop offset="100%" stopColor="#a88f64" />
          </linearGradient>
          <linearGradient id="zh-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#f4b728" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="zh-facet" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="zh-shimmer" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e9e2d1" />
            <stop offset="50%" stopColor="#f7f2e6" />
            <stop offset="100%" stopColor="#e9e2d1" />
          </linearGradient>
          <clipPath id="zh-clip">
            <rect x="0" y="0" width="560" height="440" rx="24" />
          </clipPath>
        </defs>

        <g clipPath="url(#zh-clip)">
          {/* Sky */}
          <rect x="0" y="0" width="560" height="440" fill="url(#zh-sky)" />

          {/* Sun: a soft gold disc, barely there */}
          <circle cx="460" cy="92" r="26" fill="#f4b728" opacity="0.18" />
          <circle cx="460" cy="92" r="14" fill="#f4b728" opacity="0.28" />

          {/* Clouds, drifting */}
          <g className="zh-cloud zh-cloud-a" opacity="0.9">
            <ellipse cx="0" cy="0" rx="26" ry="10" fill="#fff" />
            <ellipse cx="-12" cy="-6" rx="14" ry="10" fill="#fff" />
            <ellipse cx="10" cy="-7" rx="16" ry="11" fill="#fff" />
          </g>
          <g className="zh-cloud zh-cloud-b" opacity="0.75">
            <ellipse cx="0" cy="0" rx="20" ry="8" fill="#fff" />
            <ellipse cx="-9" cy="-5" rx="11" ry="8" fill="#fff" />
            <ellipse cx="8" cy="-6" rx="12" ry="9" fill="#fff" />
          </g>

          {/* Back range */}
          <path
            className="zh-layer zh-layer-back"
            d="M0 300 L70 232 L140 272 L210 202 L280 252 L350 192 L420 240 L490 204 L560 262 L560 440 L0 440 Z"
            fill="url(#zh-back)"
          />
          {/* Mid range */}
          <path
            className="zh-layer zh-layer-mid"
            d="M0 342 L90 274 L160 302 L240 224 L300 262 L380 204 L450 252 L520 214 L560 252 L560 440 L0 440 Z"
            fill="url(#zh-mid)"
          />

          {/* Front mountain */}
          <g className="zh-layer zh-layer-front">
            <path
              d="M0 412 L60 360 L110 318 L150 272 L200 232 L240 178 L285 128 L330 72 L365 118 L400 168 L445 222 L490 290 L530 350 L560 412 L560 440 L0 440 Z"
              fill="url(#zh-front)"
            />
            {/* Sunlit facet on the right face */}
            <path
              d="M330 72 L365 118 L400 168 L445 222 L490 290 L530 350 L560 412 L560 440 L300 440 C312 320, 322 200, 330 72 Z"
              fill="url(#zh-facet)"
            />
            {/* Summit cap */}
            <path d="M306 102 L330 72 L352 102 L342 98 L334 106 L324 98 L316 106 Z" fill="url(#zh-snow)" />
            {/* Contour lines: thin, hand-drawn feel */}
            <g fill="none" stroke="#191510" strokeOpacity="0.11" strokeWidth="1" strokeLinecap="round">
              <path d="M70 372 C110 356, 140 350, 175 330" />
              <path d="M140 330 C180 312, 205 300, 236 274" />
              <path d="M200 300 C240 282, 262 262, 290 234" />
              <path d="M250 232 C275 214, 292 196, 312 168" />
              <path d="M340 150 C360 172, 380 196, 402 222" />
              <path d="M380 240 C410 262, 440 296, 466 330" />
              <path d="M420 330 C450 352, 480 376, 505 396" />
              <path d="M30 400 C60 392, 84 386, 112 376" />
            </g>
            {/* Ridge highlight on the sunlit side */}
            <path
              d="M330 72 L365 118 L400 168 L445 222 L490 290"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Trail: full path, muted dots */}
          <polyline
            points={trailPoints}
            fill="none"
            stroke="#6b4708"
            strokeOpacity="0.35"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0.1 7"
          />
          {/* Trail: ground covered, glows behind the hiker */}
          <polyline
            className="zh-trail-covered"
            points={trailPoints}
            fill="none"
            stroke="#f4b728"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ strokeDashoffset: 1 - t }}
          />

          {/* Base details: trees and rocks */}
          <g fill="#6a6252" opacity="0.7">
            <path d="M22 418 L30 396 L38 418 Z" />
            <path d="M40 420 L46 404 L52 420 Z" />
            <path d="M452 420 L460 398 L468 420 Z" />
          </g>
          <g fill="#c9bd9c">
            <ellipse cx="70" cy="420" rx="7" ry="3.5" />
            <ellipse cx="436" cy="424" rx="9" ry="4" />
            <ellipse cx="424" cy="426" rx="5" ry="2.5" />
          </g>
          <rect x="0" y="422" width="560" height="18" fill="#b39c6d" />

          {/* Summit flag */}
          <g>
            <line x1={PEAK[0]} y1={PEAK[1]} x2={PEAK[0]} y2={PEAK[1] - 26} stroke="#2d2a26" strokeWidth="1.6" strokeLinecap="round" />
            <path
              className="zh-flag"
              d={`M${PEAK[0]} ${PEAK[1] - 26} L${PEAK[0] + 16} ${PEAK[1] - 21} L${PEAK[0]} ${PEAK[1] - 15} Z`}
              fill="#f4b728"
              style={{ transformOrigin: `${PEAK[0]}px ${PEAK[1] - 26}px` }}
            />
          </g>

          {/* Altitude markers on the right edge */}
          <g fontFamily="var(--font-body), Inter, sans-serif" fontSize="9.5" fill="#6a6252">
            {marks.map((v) => {
              const [, y] = trailPoint(priceToT(v, priceMin, priceMax));
              return (
                <g key={v} opacity="0.45">
                  <line x1={RIGHT_EDGE + 4} y1={y} x2={RIGHT_EDGE + 16} y2={y} stroke="#6a6252" strokeWidth="1" />
                  <text x={RIGHT_EDGE + 46} y={y + 3.5} textAnchor="end">
                    ${v.toLocaleString("en-US")}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Hiker + pill, translated along the trail with a CSS transition */}
          <g className="zh-hiker-pos" style={{ transform: `translate(${hx}px, ${hy}px)` }}>
            {/* Current-level guide to the markers */}
            <line
              x1="14"
              y1="0"
              x2={RIGHT_EDGE - hx}
              y2="0"
              stroke="#8a5e12"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="2 5"
              strokeLinecap="round"
            />

            {/* Shadow */}
            <ellipse cx="1" cy="1.5" rx="7" ry="2" fill="#191510" opacity="0.15" />

            {/* The hiker, leaning into the climb */}
            <g className="zh-hiker" style={{ transform: "rotate(-9deg)" }}>
              <g className="zh-bob">
                {/* Trekking pole (back hand) */}
                <line x1="-6" y1="-21" x2="-3.5" y2="1" stroke="#6a6252" strokeWidth="1.3" strokeLinecap="round" />
                {/* Back arm */}
                <line x1="-1" y1="-26" x2="-6" y2="-21" stroke="#d9b48a" strokeWidth="2.4" strokeLinecap="round" />
                {/* Backpack */}
                <rect x="-10" y="-30" width="8" height="13" rx="2.5" fill="#6b4708" />
                <rect x="-9" y="-27" width="6" height="2" rx="1" fill="#8a5e12" />
                {/* Legs */}
                <g className="zh-leg zh-leg-a" style={{ transformOrigin: "0px -15px" }}>
                  <line x1="0" y1="-15" x2="4" y2="0" stroke="#2d2a26" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="4.6" cy="0.6" rx="3" ry="1.6" fill="#191510" />
                </g>
                <g className="zh-leg zh-leg-b" style={{ transformOrigin: "0px -15px" }}>
                  <line x1="0" y1="-15" x2="-3" y2="0" stroke="#2d2a26" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="-3.4" cy="0.6" rx="3" ry="1.6" fill="#191510" />
                </g>
                {/* Torso: Zcash India tee */}
                <rect x="-6" y="-31" width="12" height="16" rx="3.5" fill="#f4b728" />
                {/* Shield logo on the chest */}
                <path
                  d="M0 -28.5 L3.4 -27.2 V-24 C3.4 -21.8 1.9 -20.4 0 -19.6 C-1.9 -20.4 -3.4 -21.8 -3.4 -24 V-27.2 Z"
                  fill="#1C3A5F"
                />
                <path d="M-1.4 -26.2 H1.4 L-1.4 -22.4 H1.4" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                {/* Front arm, swinging */}
                <line
                  className="zh-arm"
                  x1="1"
                  y1="-27"
                  x2="7"
                  y2="-20"
                  stroke="#d9b48a"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  style={{ transformOrigin: "1px -27px" }}
                />
                {/* Head + cap */}
                <circle cx="1" cy="-37" r="4.6" fill="#d9b48a" />
                <path d="M-3.8 -38.2 A4.9 4.9 0 0 1 5.8 -38.2 Z" fill="#6b4708" />
                <path d="M4.2 -38.6 L9.4 -37.4 L4.6 -36.6 Z" fill="#6b4708" />
              </g>
            </g>

            {/* Price pill */}
            {status === "ready" && price != null && (
              <g transform="translate(16, -38)">
                <rect
                  x="0"
                  y="-11"
                  width={pillWidth}
                  height="22"
                  rx="11"
                  fill="#ffffff"
                  fillOpacity="0.86"
                  stroke="#191510"
                  strokeOpacity="0.1"
                />
                <text
                  x="10"
                  y="4"
                  fontFamily="var(--font-body), Inter, sans-serif"
                  fontSize="11"
                  fontWeight="600"
                  fill="#191510"
                >
                  {priceLabel}
                  <tspan dx="6" fontSize="9.5" fontWeight="600" fill={up ? "#1f7a46" : "#b23a2e"}>
                    {changeLabel}
                  </tspan>
                </text>
              </g>
            )}
            {status === "loading" && (
              <g transform="translate(16, -38)">
                <rect className="zh-shimmer" x="0" y="-11" width="64" height="22" rx="11" fill="url(#zh-shimmer)" />
              </g>
            )}
          </g>
        </g>
      </svg>

      <style>{`
        .zec-hiker .zh-hiker-pos {
          transition: transform 2.4s cubic-bezier(0.45, 0, 0.2, 1);
        }
        .zec-hiker .zh-trail-covered {
          transition: stroke-dashoffset 2.4s cubic-bezier(0.45, 0, 0.2, 1);
          filter: drop-shadow(0 0 2px rgba(244, 183, 40, 0.6));
        }
        .zec-hiker .zh-bob {
          animation: zh-bob 1.1s ease-in-out infinite;
        }
        .zec-hiker .zh-leg-a {
          animation: zh-step-a 1.1s ease-in-out infinite;
        }
        .zec-hiker .zh-leg-b {
          animation: zh-step-b 1.1s ease-in-out infinite;
        }
        .zec-hiker .zh-arm {
          animation: zh-swing 1.1s ease-in-out infinite;
        }
        .zec-hiker .zh-flag {
          animation: zh-flutter 1.8s ease-in-out infinite;
        }
        .zec-hiker .zh-cloud-a {
          animation: zh-drift 80s linear infinite;
          transform: translate(-60px, 120px);
        }
        .zec-hiker .zh-cloud-b {
          animation: zh-drift 105s linear infinite;
          animation-delay: -40s;
          transform: translate(-60px, 178px);
        }
        .zec-hiker .zh-shimmer {
          animation: zh-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes zh-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes zh-step-a {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes zh-step-b {
          0%, 100% { transform: rotate(14deg); }
          50% { transform: rotate(-14deg); }
        }
        @keyframes zh-swing {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-16deg); }
        }
        @keyframes zh-flutter {
          0%, 100% { transform: skewY(0deg) scaleX(1); }
          50% { transform: skewY(4deg) scaleX(0.92); }
        }
        @keyframes zh-drift {
          from { transform: translate(-70px, var(--zh-cloud-y, 120px)); }
          to { transform: translate(630px, var(--zh-cloud-y, 120px)); }
        }
        .zec-hiker .zh-cloud-a { --zh-cloud-y: 120px; }
        .zec-hiker .zh-cloud-b { --zh-cloud-y: 178px; }
        @keyframes zh-shimmer {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .zec-hiker .zh-bob,
          .zec-hiker .zh-leg-a,
          .zec-hiker .zh-leg-b,
          .zec-hiker .zh-arm,
          .zec-hiker .zh-flag,
          .zec-hiker .zh-cloud-a,
          .zec-hiker .zh-cloud-b,
          .zec-hiker .zh-shimmer {
            animation: none;
          }
          .zec-hiker .zh-hiker-pos,
          .zec-hiker .zh-trail-covered {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
