"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PublicMeetup, cityToSlug } from "@/lib/data";
import { MeetupMap } from "@/components/map/meetup-map";
import { padNode, formatDateIST } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Kind = "all" | "official_event" | "irl_bounty";

export function MapExplorer({ meetups }: { meetups: PublicMeetup[] }) {
  const [kind, setKind] = useState<Kind>("all");
  const [mobileMap, setMobileMap] = useState(false);

  const filtered = useMemo(() => {
    return meetups.filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      return true;
    });
  }, [meetups, kind]);

  const hasCommunity = meetups.some((m) => m.kind === "irl_bounty");

  return (
    <div className="relative">
      {/* Filters */}
      {hasCommunity && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segment
            value={kind}
            onChange={(v) => setKind(v as Kind)}
            options={[
              ["all", "All"],
              ["official_event", "Official"],
              ["irl_bounty", "Community"],
            ]}
          />
        </div>
      )}

      {/* Mobile list/map toggle */}
      <div className="mb-3 flex gap-2 lg:hidden">
        <button
          onClick={() => setMobileMap(false)}
          className={cn(
            "flex-1 rounded-full px-4 py-2 text-sm",
            !mobileMap ? "btn-gold" : "btn-ghost",
          )}
        >
          List
        </button>
        <button
          onClick={() => setMobileMap(true)}
          className={cn(
            "flex-1 rounded-full px-4 py-2 text-sm",
            mobileMap ? "btn-gold" : "btn-ghost",
          )}
        >
          Open map
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* Sidebar list */}
        <div className={cn("space-y-3", mobileMap && "hidden lg:block")}>
          <p className="text-sm font-medium text-muted">
            {filtered.length === 0
              ? "No pins yet"
              : `${filtered.length} ${filtered.length === 1 ? "location" : "locations"} across India`}
          </p>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {filtered.map((m) => (
              <SidebarCard key={m.id} m={m} />
            ))}
            {filtered.length === 0 && (
              <div className="card p-6 text-center">
                <div className="text-3xl">📍</div>
                <h3 className="mt-3 font-semibold">The map is a clean slate</h3>
                <p className="mt-2 text-sm text-muted">
                  Verified community meetups appear here. Be the first: host one
                  and put your city on the map.
                </p>
                <Link
                  href="/bounties/irl/submit"
                  className="btn-gold mt-4 inline-block px-5 py-2 text-sm"
                >
                  Add your meetup
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div
          className={cn(
            "card h-[70vh] overflow-hidden",
            !mobileMap && "hidden lg:block",
          )}
        >
          <MeetupMap meetups={filtered} />
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <Link
        href="/bounties/irl/submit"
        className="btn-gold fixed bottom-4 left-1/2 z-40 -translate-x-1/2 px-6 py-3 text-sm shadow-xl lg:hidden"
      >
        + Add meetup
      </Link>
    </div>
  );
}

function SidebarCard({ m }: { m: PublicMeetup }) {
  const official = m.kind === "official_event";
  return (
    <Link
      href={`/map/${cityToSlug(m.city)}`}
      className="card block p-4 transition-colors hover:border-gold/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 font-medium leading-snug">
          <span className="mr-1">{official ? "🎪" : "🟡"}</span>
          {official ? m.title : `${m.city}, Node #${padNode(m.nodeNumber)}`}
        </div>
        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
          {official ? "Official" : "Community"}
        </span>
      </div>
      {official ? (
        <div className="mt-2 text-sm text-muted">
          📍 {m.venueName ?? m.city}
        </div>
      ) : (
        <div className="mt-2 text-sm text-muted">
          👥 {m.attendeesTotal} · 🌱 {m.attendeesNewToZcash} new
          {m.hostNamePublic && <> · 🟢 {m.hostNamePublic}</>}
        </div>
      )}
      <div className="mt-1 text-xs text-muted/60">
        {m.city}
        {m.state ? `, ${m.state}` : ""} · {formatDateIST(m.startsAt)}
      </div>
    </Link>
  );
}

function Segment({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-full px-3 py-1 text-sm transition-colors",
            value === v ? "bg-gold text-bg" : "text-muted hover:text-gold",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

