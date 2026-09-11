import Link from "next/link";
import type { Metadata } from "next";
import { getCities, getCity, getAftermoviesByCity, cityToSlug } from "@/lib/data";
import { formatIST, formatDateIST, isPast, padNode } from "@/lib/utils";
import { VENUE_LABELS, FORMAT_LABELS } from "@/lib/validation";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { VideoGrid } from "@/components/social/video-grid";
import { site } from "@/config/site";
import type { PublicMeetup } from "@/lib/data";

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ city: cityToSlug(c.city) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const summary = await getCity(city);
  const name = summary?.city ?? city.replace(/-/g, " ");
  return {
    title: `${name} on the Zcash India map`,
    description: `Zcash India meetups and nodes in ${name}.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const summary = await getCity(city);
  const displayName = summary?.city ?? decodeURIComponent(city).replace(/-/g, " ");
  const aftermovies = summary ? await getAftermoviesByCity(summary.city) : [];

  // Empty city — needs a host.
  if (!summary) {
    return (
      <Section>
        <Container className="max-w-2xl">
          <Link href="/map" className="text-sm text-gold hover:underline">
            ← Back to map
          </Link>
          <div className="card mt-6 p-8 text-center">
            <div className="text-4xl">📍</div>
            <h1 className="mt-4 text-2xl font-bold capitalize">{displayName}</h1>
            <p className="mt-3 text-lg text-gold">This city needs a host.</p>
            <p className="mt-2 text-muted">
              There's no verified Zcash India meetup here yet. Be the first.
              light up {displayName} on the map.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/host">Get the host kit</ButtonLink>
              <ButtonLink href="/bounties/irl/submit" variant="ghost">
                Add a meetup
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    );
  }

  const upcoming = summary.meetups
    .filter((m) => !isPast(m.startsAt))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const pastMeetups = summary.meetups.filter((m) => isPast(m.startsAt));
  const hosts = Array.from(
    new Set(summary.meetups.map((m) => m.hostNamePublic).filter(Boolean)),
  ) as string[];

  return (
    <Section>
      <Container>
        <Link href="/map" className="text-sm text-gold hover:underline">
          ← Back to map
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold capitalize">{summary.city}</h1>
          {summary.newCity && <Badge tone="success">🌱 New city</Badge>}
        </div>
        {summary.state && (
          <p className="mt-1 text-muted">{summary.state}, India</p>
        )}

        {/* Next meetup */}
        {upcoming[0] && (
          <div className="card mt-8 border-gold/40 bg-gold/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Next in {summary.city}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{upcoming[0].title}</h2>
            <p className="text-sm text-muted">{formatIST(upcoming[0].startsAt)}</p>
          </div>
        )}

        {/* Aftermovies for this city */}
        {aftermovies.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <Badge tone="gold">🎬 Aftermovies</Badge>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Relive {summary.city}
              </h2>
            </div>
            <div className="mt-4">
              <VideoGrid videos={aftermovies} />
            </div>
          </div>
        )}

        {/* Hosts */}
        {hosts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Hosts
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {hosts.map((h) => (
                <span key={h} className="card-2 rounded-full px-4 py-1.5 text-sm">
                  🟢 {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* All meetups */}
        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
          Meetups in {summary.city}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {summary.meetups.map((m) => (
            <CityMeetupCard key={m.id} m={m} />
          ))}
        </div>

        {/* Host CTA */}
        <div className="card mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Host in {summary.city}</h2>
            <p className="mt-1 text-muted">
              {site.voice.oneAtATime} Add the next node to this city.
            </p>
          </div>
          <ButtonLink href="/bounties/irl/submit">Host a meetup</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

function CityMeetupCard({ m }: { m: PublicMeetup }) {
  const official = m.kind === "official_event";
  const past = isPast(m.startsAt);
  return (
    <div className="card overflow-hidden">
      {m.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.photos[0]}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={official ? "gold" : "surface"}>
            {official ? "🎪 Official" : `🟡 Node #${padNode(m.nodeNumber)}`}
          </Badge>
          {m.newCityActivation && <Badge tone="success">🌱 New city</Badge>}
          {past && <Badge tone="muted">Past</Badge>}
        </div>
        <h3 className="mt-3 font-semibold">{m.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {formatDateIST(m.startsAt)} · {FORMAT_LABELS[m.format] ?? m.format} ·{" "}
          {VENUE_LABELS[m.venueType] ?? m.venueType}
        </p>
        {m.summary && <p className="mt-2 text-sm text-muted/80">{m.summary}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span>👥 {m.attendeesTotal} attendees</span>
          <span>🌱 {m.attendeesNewToZcash} new to Zcash</span>
          {m.hostNamePublic && <span>🟢 {m.hostNamePublic}</span>}
        </div>
        {m.photos.length > 1 && (
          <div className="mt-3 flex gap-2">
            {m.photos.slice(1, 4).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={p}
                alt=""
                className="h-14 w-14 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
