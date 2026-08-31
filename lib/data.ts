import { prisma } from "./prisma";
import { parsePhotos } from "./utils";
import type { Meetup } from "@prisma/client";
import { inPersonEvents, lumaEvents, lumaUrl } from "@/config/luma-events";

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

/** Real in-person Luma events, shaped as official-event map pins. */
export function lumaPins(): PublicMeetup[] {
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

/** Map pins = real Luma in-person events + community-verified IRL submissions. */
export async function getMapPins(): Promise<PublicMeetup[]> {
  const db = await getVerifiedMeetups();
  return [...lumaPins(), ...db];
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
  const verified = (await getMapPins()).filter((m) => !m.isOnline);
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
  const db = await getVerifiedMeetups();
  const pins = [...lumaPins(), ...db.filter((m) => !m.isOnline)];
  const cities = new Set(pins.map((m) => m.city));
  const eventsHosted = lumaEvents.length + db.length;
  const onlineSessions = lumaEvents.filter((e) => e.isOnline).length;
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
