import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4", className)}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-12 sm:py-16", className)}>{children}</section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  cta,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gold">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {sub && <p className="mt-2 max-w-2xl text-muted">{sub}</p>}
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "gold",
  className,
}: {
  children: React.ReactNode;
  tone?: "gold" | "muted" | "success" | "danger" | "surface";
  className?: string;
}) {
  const tones: Record<string, string> = {
    gold: "bg-gold/15 text-gold border-gold/30",
    muted: "bg-surface-2 text-muted border-line",
    success: "bg-success/15 text-success border-success/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    surface: "bg-surface text-text border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "ghost";
  external?: boolean;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "gold",
  external,
  className,
}: ButtonProps) {
  const cls = cn(
    "inline-flex items-center justify-center px-5 py-2.5 text-sm",
    variant === "gold" ? "btn-gold" : "btn-ghost",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Stat({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-5 py-4">
      <div
        className={cn(
          "text-3xl font-bold tabular-nums",
          accent ? "text-gold" : "text-text",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
