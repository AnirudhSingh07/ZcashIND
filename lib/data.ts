import { prisma } from "./prisma";
import { parsePhotos } from "./utils";
import type { Meetup } from "@prisma/client";
import {
  lumaEvents as configLumaEvents,
  CITY_META,
  lumaUrl,
  type LumaEvent,
} from "@/config/luma-events";

/** Public-safe meetup shape — NEVER includes hostContactPrivate or adminNotes. */
export type PublicMeetup = {
  id: string;
  slug: string;
  kind: string;
  status: string;
  title: string;
  city: string;
  state: string | null;
  country: string;
  lat: number;
  lng: number;
  venueType: string;
  venueName: string | null;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number;
  isOnline: boolean;
  language: string | null;
  format: string;
  description: string | null;
  summary: string | null;
  attendeesTotal: number;
  attendeesNewToZcash: number;
  newCityActivation: boolean;
  nodeNumber: number | null;
  registrationUrl: string | null;
  photos: string[];
  brandingVisible: boolean;
  hostNamePublic: string | null;
  hostContributorId: string | null;
  bountyPeriod: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

export function toPublic(m: Meetup): PublicMeetup {
  return {
    id: m.id,
    slug: m.slug,
    kind: m.kind,
    status: m.status,
    title: m.title,
    city: m.city,
    state: m.state,
    country: m.country,
    lat: m.lat,
    lng: m.lng,
    venueType: m.venueType,
    venueName: m.venueName,
    startsAt: m.startsAt.toISOString(),
    endsAt: m.endsAt ? m.endsAt.toISOString() : null,
    durationMinutes: m.durationMinutes,
    isOnline: m.isOnline,
    language: m.language,
    format: m.format,
    description: m.description,
    summary: m.summary,
    attendeesTotal: m.attendeesTotal,
    attendeesNewToZcash: m.attendeesNewToZcash,
    newCityActivation: m.newCityActivation,
    nodeNumber: m.nodeNumber,
    registrationUrl: m.registrationUrl,
    photos: parsePhotos(m.photos),
    brandingVisible: m.brandingVisible,
    hostNamePublic: m.hostNamePublic,
    hostContributorId: m.hostContributorId,
    bountyPeriod: m.bountyPeriod,
    createdAt: m.createdAt.toISOString(),
    verifiedAt: m.verifiedAt ? m.verifiedAt.toISOString() : null,
  };
}

/**
 * Community events, DB-first with config fallback (newest first).
 * The DB (`LumaEvent` table, admin-managed) is the source of truth; if it's
 * empty we fall back to the hand-maintained list in `config/luma-events.ts`.
 */
export async function getLumaEvents(): Promise<LumaEvent[]> {
  const rows = await prisma.lumaEvent.findMany({ orderBy: { startsAt: "desc" } });
  if (rows.length === 0) return configLumaEvents;
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    startsAt: r.startsAt.toISOString(),
    city: r.city,
    state: r.state ?? undefined,
    venue: r.venue ?? undefined,
    isOnline: r.isOnline,
    series: r.series as LumaEvent["series"],
    coHosts: r.coHosts ?? undefined,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
  }));
}

/**
 * In-person editions with resolved coordinates + state (for the map & cities).
 * Coordinates come from the event's own lat/lng if set, else the known-city
 * lookup; editions we can't place are omitted from the map.
 */
export async function getInPersonEvents(): Promise<
  (LumaEvent & { lat: number; lng: number; state: string })[]
> {
  const events = await getLumaEvents();
  const placed: (LumaEvent & { lat: number; lng: number; state: string })[] = [];
  for (const e of events) {
    if (e.series !== "irl") continue;
    const meta = CITY_META[e.city];
    const lat = e.lat ?? meta?.lat;
    const lng = e.lng ?? meta?.lng;
    const state = e.state ?? meta?.state;
    if (lat == null || lng == null || state == null) continue;
    placed.push({ ...e, lat, lng, state });
  }
  return placed;
}

/** Real in-person Luma events, shaped as official-event map pins. */
export async function lumaPins(): Promise<PublicMeetup[]> {
  const inPersonEvents = await getInPersonEvents();
  return inPersonEvents.map((e) => ({
    id: `luma-${e.slug}`,
    slug: e.slug,
    kind: "official_event",
    status: "verified",
    title: e.title,
    city: e.city,
    state: e.state,
    country: "India",
    lat: e.lat,
    lng: e.lng,
    venueType: "college",
    venueName: e.venue ?? null,
    startsAt: e.startsAt,
    endsAt: null,
    durationMinutes: 120,
    isOnline: false,
    language: "English / हिंदी",
    format: "workshop",
    description: e.venue ?? null,
    summary: e.coHosts ? `With ${e.coHosts}` : e.venue ?? null,
    attendeesTotal: 0,
    attendeesNewToZcash: 0,
    newCityActivation: false,
    nodeNumber: null,
    registrationUrl: lumaUrl(e.slug),
    photos: [],
    brandingVisible: true,
    hostNamePublic: "Zcash India",
    hostContributorId: null,
    bountyPeriod: null,
    createdAt: e.startsAt,
    verifiedAt: e.startsAt,
  }));
}

/**
 * Map pins = community-verified IRL submissions only. Starts empty and fills as
 * real hosts submit meetups and admins verify them. (Official Luma events are
 * shown on /events and in the homepage "cities" showcase, not as map pins.)
 */
export async function getMapPins(): Promise<PublicMeetup[]> {
  return getVerifiedMeetups();
}

/** All verified meetups (map + public lists). */
export async function getVerifiedMeetups(): Promise<PublicMeetup[]> {
  const rows = await prisma.meetup.findMany({
    where: { status: "verified" },
    orderBy: { startsAt: "desc" },
  });
  return rows.map(toPublic);
}

export async function getVerifiedByKind(kind: string): Promise<PublicMeetup[]> {
  const rows = await prisma.meetup.findMany({
    where: { status: "verified", kind },
    orderBy: { startsAt: "desc" },
  });
  return rows.map(toPublic);
}

export async function getMeetupBySlug(slug: string): Promise<PublicMeetup | null> {
  const m = await prisma.meetup.findUnique({ where: { slug } });
  if (!m || m.status !== "verified") return null;
  return toPublic(m);
}

export type CitySummary = {
  city: string;
  state: string | null;
  nodeCount: number;
  newCity: boolean;
  nextMeetup: PublicMeetup | null;
  meetups: PublicMeetup[];
};

/** Cities derived from real events + verified community meetups. */
export async function getCities(): Promise<CitySummary[]> {
  const db = await getVerifiedMeetups();
  const verified = [...(await lumaPins()), ...db].filter((m) => !m.isOnline);
  const byCity = new Map<string, PublicMeetup[]>();
  for (const m of verified) {
    const key = m.city;
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(m);
  }
  const now = Date.now();
  const cities: CitySummary[] = [];
  for (const [city, meetups] of byCity) {
    const upcoming = meetups
      .filter((m) => new Date(m.startsAt).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    cities.push({
      city,
      state: meetups[0]?.state ?? null,
      nodeCount: meetups.filter((m) => m.kind === "irl_bounty").length,
      newCity: meetups.some((m) => m.newCityActivation),
      nextMeetup: upcoming[0] ?? null,
      meetups: meetups.sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      ),
    });
  }
  return cities.sort((a, b) => a.city.localeCompare(b.city));
}

export async function getCity(citySlug: string): Promise<CitySummary | null> {
  const cities = await getCities();
  return (
    cities.find(
      (c) => c.city.toLowerCase().replace(/\s+/g, "-") === citySlug.toLowerCase(),
    ) ?? null
  );
}

/** Homepage counters — real numbers from actual events + community submissions. */
export async function getCounters() {
  const [db, events] = await Promise.all([getVerifiedMeetups(), getLumaEvents()]);
  const pins = [...(await lumaPins()), ...db.filter((m) => !m.isOnline)];
  const cities = new Set(pins.map((m) => m.city));
  const eventsHosted = events.length + db.length;
  const onlineSessions = events.filter((e) => e.isOnline).length;
  const communityMeetups = db.filter((m) => m.kind === "irl_bounty").length;
  return {
    citiesLit: cities.size,
    eventsHosted,
    onlineSessions,
    communityMeetups,
  };
}

/** Public leaderboard for the bounty period — verified IRL meetups only. */
export async function getLeaderboard(period: string) {
  const rows = await prisma.meetup.findMany({
    where: { status: "verified", kind: "irl_bounty", bountyPeriod: period },
    orderBy: [{ attendeesTotal: "desc" }, { attendeesNewToZcash: "desc" }],
  });
  return rows.map(toPublic);
}

export async function getContributors() {
  return prisma.contributor.findMany({
    where: { official: true },
    orderBy: { name: "asc" },
  });
}

export async function getContributor(slug: string) {
  const c = await prisma.contributor.findUnique({ where: { slug } });
  if (!c) return null;
  const meetups = await prisma.meetup.findMany({
    where: { hostContributorId: c.id, status: "verified" },
    orderBy: { startsAt: "desc" },
  });
  return { contributor: c, meetups: meetups.map(toPublic) };
}

/** Next official upcoming event. */
export async function getNextOfficialEvent(): Promise<PublicMeetup | null> {
  const now = new Date();
  const m = await prisma.meetup.findFirst({
    where: {
      status: "verified",
      kind: "official_event",
      startsAt: { gte: now },
    },
    orderBy: { startsAt: "asc" },
  });
  return m ? toPublic(m) : null;
}

export function cityToSlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, "-");
}

// --- Updates ("What's New") ------------------------------------------------

export type PublicUpdate = {
  id: string;
  title: string | null;
  body: string | null;
  xUrl: string | null;
  tag: string | null;
  pinned: boolean;
  createdAt: string;
};

/** All updates, pinned first, then newest first. */
export async function getUpdates(): Promise<PublicUpdate[]> {
  const rows = await prisma.update.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    xUrl: r.xUrl,
    tag: r.tag,
    pinned: r.pinned,
    createdAt: r.createdAt.toISOString(),
  }));
}

// --- Bounty ---------------------------------------------------------------

export type BountyPrize = { place: string; amountUsd: number; note: string };
export type BountyJudging = { label: string; weight: number };
export type Bounty = {
  period: string;
  windowLabel: string;
  prizePoolUsd: number;
  prizes: BountyPrize[];
  minimums: { attendees: number; newToZcash: number; minutes: number; photos: number };
  judging: BountyJudging[];
};

function safeJson<T>(s: string, fallback: T): T {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * The current bounty config, DB-first with config fallback.
 * Uses the active DB row (or the most recent one); if none exist, falls back to
 * `site.bounty` from config so the bounty pages always render.
 */
export async function getBounty(): Promise<Bounty> {
  const row =
    (await prisma.bounty.findFirst({ where: { active: true } })) ??
    (await prisma.bounty.findFirst({ orderBy: { createdAt: "desc" } }));

  if (!row) {
    const { site } = await import("@/config/site");
    const b = site.bounty;
    return {
      period: b.period,
      windowLabel: b.windowLabel,
      prizePoolUsd: b.prizePoolUsd,
      prizes: b.prizes.map((p) => ({ ...p })),
      minimums: { ...b.minimums },
      judging: b.judging.map((j) => ({ ...j })),
    };
  }

  return {
    period: row.period,
    windowLabel: row.windowLabel,
    prizePoolUsd: row.prizePoolUsd,
    prizes: safeJson<BountyPrize[]>(row.prizes, []),
    minimums: {
      attendees: row.minAttendees,
      newToZcash: row.minNewToZcash,
      minutes: row.minMinutes,
      photos: row.minPhotos,
    },
    judging: safeJson<BountyJudging[]>(row.judging, []),
  };
}

/** Public-safe featured post shape used by the "Latest from @ZcashIND" feature. */
export type PublicFeaturedPost = {
  id: string | null; // null when it comes from the config fallback (not DB)
  title: string;
  subtitle: string | null;
  url: string;
};

/**
 * Featured @ZcashIND posts, newest/curated first.
 *
 * Reads admin-managed rows from the DB. If none exist yet, it degrades to the
 * hand-seeded list in `config/media.ts` so the section is never empty.
 */
export async function getFeaturedPosts(): Promise<PublicFeaturedPost[]> {
  const rows = await prisma.featuredPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      url: r.url,
    }));
  }
  // Fallback: config seed (no DB ids).
  const { media } = await import("@/config/media");
  return media.featuredPosts.map((p) => ({
    id: null,
    title: p.title,
    subtitle: p.subtitle ?? null,
    url: p.url,
  }));
}

/** Aftermovie shape consumed by the VideoGrid (matches config `EventVideo`). */
export type PublicAftermovie = {
  id: string | null; // null when it comes from the config fallback (not DB)
  title: string;
  event: string;
  city: string | null;
  date?: string;
  url?: string;
  embed?: string;
};

/**
 * Event aftermovies, curated order first.
 *
 * Reads admin-managed rows from the DB. If none exist yet, it degrades to the
 * hand-seeded list in `config/media.ts` so the /events grid is never empty.
 */
export async function getAftermovies(): Promise<PublicAftermovie[]> {
  const rows = await prisma.aftermovie.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      event: r.event,
      city: r.city,
      date: r.date ? r.date.toISOString() : undefined,
      url: r.url ?? undefined,
      embed: r.embed ?? undefined,
    }));
  }
  const { media } = await import("@/config/media");
  return media.videos.map((v) => ({
    id: null,
    title: v.title,
    event: v.event,
    city: null,
    date: v.date,
    url: v.url,
    embed: v.embed,
  }));
}

/**
 * Aftermovies for a specific city, curated order first.
 *
 * Matches on the explicit `city` field when set; for older entries without one
 * (e.g. the config fallback), falls back to matching the city name inside the
 * title or event label — so "Zcash Community Connect: Surat Edition" still shows
 * up under Surat.
 */
export async function getAftermoviesByCity(
  cityName: string,
): Promise<PublicAftermovie[]> {
  const needle = cityName.trim().toLowerCase();
  if (!needle) return [];
  const all = await getAftermovies();
  return all.filter((a) =>
    a.city
      ? a.city.trim().toLowerCase() === needle
      : a.title.toLowerCase().includes(needle) ||
        a.event.toLowerCase().includes(needle),
  );
}
