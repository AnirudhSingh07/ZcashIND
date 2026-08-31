"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PublicMeetup, cityToSlug } from "@/lib/data";
import { MeetupMap } from "@/components/map/meetup-map";
import { VENUE_LABELS } from "@/lib/validation";
import { padNode, formatDateIST } from "@/lib/utils";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

type Time = "all" | "upcoming" | "past";
type Kind = "all" | "official_event" | "irl_bounty";

export function MapExplorer({ meetups }: { meetups: PublicMeetup[] }) {
  const [time, setTime] = useState<Time>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [newCityOnly, setNewCityOnly] = useState(false);
  const [venue, setVenue] = useState<string>("all");
  const [bountyOnly, setBountyOnly] = useState(false);
  const [mobileMap, setMobileMap] = useState(false);

  const now = Date.now();
  const filtered = useMemo(() => {
    return meetups.filter((m) => {
      const t = new Date(m.startsAt).getTime();
      if (time === "upcoming" && t < now) return false;
      if (time === "past" && t >= now) return false;
      if (kind !== "all" && m.kind !== kind) return false;
      if (newCityOnly && !m.newCityActivation) return false;
      if (venue !== "all" && m.venueType !== venue) return false;
      if (bountyOnly && m.bountyPeriod !== site.bounty.period) return false;
      return true;
    });
  }, [meetups, time, kind, newCityOnly, venue, bountyOnly, now]);

  const venueOptions = Array.from(new Set(meetups.map((m) => m.venueType)));

  return (
    <div className="relative">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segment
          value={time}
          onChange={(v) => setTime(v as Time)}
          options={[
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["past", "Past"],
          ]}
        />
        <Segment
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            ["all", "All"],
            ["official_event", "Official"],
            ["irl_bounty", "IRL"],
          ]}
        />
        <Toggle active={newCityOnly} onClick={() => setNewCityOnly((v) => !v)}>
          🌱 New cities
        </Toggle>
        <Toggle active={bountyOnly} onClick={() => setBountyOnly((v) => !v)}>
          Sept 2026
        </Toggle>
        <select
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted"
        >
          <option value="all">All venues</option>
          {venueOptions.map((v) => (
            <option key={v} value={v}>
              {VENUE_LABELS[v] ?? v}
            </option>
          ))}
        </select>
      </div>

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
          <p className="text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? "pin" : "pins"} shown
          </p>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {filtered.map((m) => (
              <SidebarCard key={m.id} m={m} />
            ))}
            {filtered.length === 0 && (
              <div className="card p-6 text-center text-muted">
                No pins match these filters.
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
        <div className="font-medium leading-snug">
          <span className="mr-1">{official ? "🎪" : "🟡"}</span>
          {official ? m.title : `${m.city} — Node #${padNode(m.nodeNumber)}`}
        </div>
        {m.newCityActivation && (
          <span className="shrink-0 text-xs text-success">🌱 new</span>
        )}
      </div>
      <div className="mt-2 text-sm text-muted">
        👥 {m.attendeesTotal} · 🌱 {m.attendeesNewToZcash} new
        {m.hostNamePublic && <> · 🟢 {m.hostNamePublic}</>}
      </div>
      <div className="mt-1 text-xs text-muted/60">
        {m.city} · {formatDateIST(m.startsAt)}
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

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-line bg-surface text-muted hover:text-gold",
      )}
    >
      {children}
    </button>
  );
}
