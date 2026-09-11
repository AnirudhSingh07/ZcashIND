"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";

type NavLink = { href: string; label: string; external?: boolean; desc?: string };

const NAV: NavLink[] = [
  { href: "/learn", label: "Learn" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/bounties", label: "Bounties" },
  { href: "/clubs", label: "Clubs" },
];

const ECOSYSTEM: NavLink[] = [
  { href: "/pay", label: "Pay with ZEC", desc: "Indian businesses that accept Zcash" },
  { href: "/ecosystem", label: "Ecosystem overview", desc: "Protocol, tools, governance" },
  { href: "/updates", label: "What's new", desc: "Milestones and announcements" },
  { href: site.links.zecmap, label: "ZecMap", external: true },
  { href: site.links.zechub, label: "ZecHub", external: true },
];

const COMMUNITY: NavLink[] = [
  { href: site.links.telegram, label: "Telegram", external: true },
  { href: site.links.x, label: "X", external: true },
  { href: site.links.youtube, label: "YouTube", external: true },
  { href: site.links.instagram, label: "Instagram", external: true },
];

function Dropdown({
  label,
  items,
  active,
}: {
  label: string;
  items: NavLink[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={cn(
          "rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold",
          active ? "text-gold" : "text-muted",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label} ▾
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full w-64 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-xl"
        >
          {items.map((c) =>
            c.external ? (
              <a
                key={c.href}
                role="menuitem"
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-gold"
              >
                {c.label} ↗
              </a>
            ) : (
              <Link
                key={c.href}
                role="menuitem"
                href={c.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 hover:bg-surface-2"
              >
                <span className="block text-sm text-text">{c.label}</span>
                {c.desc && <span className="block text-xs text-muted">{c.desc}</span>}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {site.wordmark}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold",
                isActive(item.href) ? "text-gold" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Dropdown
            label="Ecosystem"
            items={ECOSYSTEM}
            active={ECOSYSTEM.some((i) => !i.external && isActive(i.href))}
          />
          <Dropdown label="Community" items={COMMUNITY} />

          <LanguageSwitcher />

          <Link
            href="/bounties/irl/submit"
            className="btn-gold ml-2 px-4 py-1.5 text-sm"
          >
            Add meetup
          </Link>
        </nav>

        {/* Mobile: language + menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-line bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 hover:bg-surface-2 hover:text-gold",
                  isActive(item.href) ? "text-gold" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-line" />
            <p className="px-3 pb-1 text-xs uppercase tracking-wide text-muted/60">Ecosystem</p>
            {ECOSYSTEM.map((c) =>
              c.external ? (
                <a
                  key={c.href}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-gold"
                >
                  {c.label} ↗
                </a>
              ) : (
                <Link
                  key={c.href}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-gold"
                >
                  {c.label}
                </Link>
              ),
            )}

            <div className="my-2 border-t border-line" />
            <p className="px-3 pb-1 text-xs uppercase tracking-wide text-muted/60">Community</p>
            {COMMUNITY.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-gold"
              >
                {c.label} ↗
              </a>
            ))}
            <Link
              href="/bounties/irl/submit"
              onClick={() => setOpen(false)}
              className="btn-gold mt-3 px-4 py-2 text-center"
            >
              Add meetup
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
