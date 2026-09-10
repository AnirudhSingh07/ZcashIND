import { INDIA_PATH } from "@/lib/india-path";
import { cn } from "@/lib/utils";

/**
 * Decorative India silhouette. Used as a subtle background motif on the homepage
 * and map. Purely presentational (aria-hidden). `variant` tweaks the treatment.
 */
export function IndiaMap({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "fill" | "dotted";
}) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="india-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--gold-deep)" stopOpacity="0.7" />
        </linearGradient>
        <pattern
          id="india-dots"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill="var(--gold)" />
        </pattern>
      </defs>
      <path
        d={INDIA_PATH}
        fill={
          variant === "fill"
            ? "url(#india-grad)"
            : variant === "dotted"
              ? "url(#india-dots)"
              : "none"
        }
        stroke={variant === "outline" ? "url(#india-grad)" : "none"}
        strokeWidth={variant === "outline" ? 2.5 : 0}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
