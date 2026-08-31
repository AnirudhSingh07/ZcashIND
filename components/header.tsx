"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/learn", label: "Learn" },
  { href: "/map", label: "Map" },
  { href: "/events", label: "Events" },
  { href: "/bounties/irl", label: "Bounties" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/contribute", label: "Contribute" },
];

const COMMUNITY = [
  { href: site.links.telegram, label: "Telegram" },
  { href: site.links.x, label: "X" },
  { href: site.links.instagram, label: "Instagram" },
  { href: site.links.forum, label: "Forum" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [community, setCommunity] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {site.wordmark}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors hover:text-gold",
                  active ? "text-gold" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Community dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setCommunity(true)}
            onMouseLeave={() => setCommunity(false)}
          >
            <button
              className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-gold"
              onClick={() => setCommunity((v) => !v)}
              aria-expanded={community}
            >
              Community ▾
            </button>
            {community && (
              <div className="absolute right-0 top-full w-44 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-xl">
                {COMMUNITY.map((c) => (
                  <a
                    key={c.href}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-muted hover:bg-surface-2 hover:text-gold"
                  >
                    {c.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/bounties/irl/submit"
            className="btn-gold ml-2 px-4 py-1.5 text-sm"
          >
            Add meetup
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="rounded-lg border border-line px-3 py-1.5 text-sm md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-line" />
            <p className="px-3 pb-1 text-xs uppercase tracking-wide text-muted/60">
              Community
            </p>
            {COMMUNITY.map((c) => (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-muted hover:bg-surface-2 hover:text-gold"
              >
                {c.label}
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
