import Link from "next/link";
import type { Metadata } from "next";
import { getVerifiedByKind } from "@/lib/data";
import { formatIST, isPast } from "@/lib/utils";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Events",
  description: "Official Zcash India events — meetups, campus workshops and the online Live series.",
};

export default async function EventsPage() {
  const events = await getVerifiedByKind("official_event");
  const upcoming = events
    .filter((e) => !isPast(e.startsAt))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = events
    .filter((e) => isPast(e.startsAt))
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  return (
    <Section>
      <Container>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="gold" className="mb-4">
              Events
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Official events</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Meetups, campus workshops and the online Zcash India Live series.
              For community-hosted IRL meetups, see the{" "}
              <Link href="/map" className="text-gold hover:underline">
                map
              </Link>
              .
            </p>
          </div>
          <ButtonLink href={site.links.luma} variant="ghost" external>
            RSVP on Luma
          </ButtonLink>
        </div>

        {upcoming.length > 0 && (
          <>
            <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-gold">
              Upcoming
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {upcoming.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-muted">
              Past
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {past.map((e) => (
                <EventCard key={e.id} e={e} past />
              ))}
            </div>
          </>
        )}

        {events.length === 0 && (
          <p className="mt-12 text-muted">No official events listed yet.</p>
        )}
      </Container>
    </Section>
  );
}

function EventCard({
  e,
  past,
}: {
  e: Awaited<ReturnType<typeof getVerifiedByKind>>[number];
  past?: boolean;
}) {
  return (
    <Link
      href={`/events/${e.slug}`}
      className={`card group p-6 transition-colors hover:border-gold/50 ${
        past ? "" : "border-gold/40 bg-gold/5"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{e.isOnline ? "🖥️" : "🎪"}</span>
        {past ? <Badge tone="muted">Past</Badge> : <Badge tone="gold">Upcoming</Badge>}
        {e.isOnline && <Badge tone="muted">Online</Badge>}
      </div>
      <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">
        {e.title}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {e.city} · {formatIST(e.startsAt)}
      </p>
      {e.summary && <p className="mt-2 text-sm text-muted/80">{e.summary}</p>}
    </Link>
  );
}
