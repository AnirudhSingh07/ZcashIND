import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMeetupBySlug, cityToSlug } from "@/lib/data";
import { formatIST, isPast } from "@/lib/utils";
import { VENUE_LABELS, FORMAT_LABELS } from "@/lib/validation";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export async function generateStaticParams() {
  const events = await prisma.meetup.findMany({
    where: { kind: "official_event", status: "verified" },
    select: { slug: true },
  });
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = await getMeetupBySlug(slug);
  if (!e) return {};
  return { title: e.title, description: e.summary ?? undefined };
}

export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await getMeetupBySlug(slug);
  if (!e || e.kind !== "official_event") notFound();
  const past = isPast(e.startsAt);

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link href="/events" className="text-sm text-gold hover:underline">
          ← All events
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-2xl">{e.isOnline ? "🖥️" : "🎪"}</span>
          {past ? <Badge tone="muted">Past</Badge> : <Badge tone="gold">Upcoming</Badge>}
          {e.isOnline && <Badge tone="muted">Online</Badge>}
          <Badge tone="surface">{FORMAT_LABELS[e.format] ?? e.format}</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{e.title}</h1>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <dt className="text-xs uppercase tracking-wide text-muted/60">When</dt>
            <dd className="mt-1 font-medium">{formatIST(e.startsAt)}</dd>
          </div>
          <div className="card p-4">
            <dt className="text-xs uppercase tracking-wide text-muted/60">Where</dt>
            <dd className="mt-1 font-medium">
              {e.isOnline ? "Online" : `${e.venueName ? e.venueName + ", " : ""}${e.city}`}
              {!e.isOnline && (
                <span className="ml-1 text-sm text-muted">
                  ({VENUE_LABELS[e.venueType] ?? e.venueType})
                </span>
              )}
            </dd>
          </div>
        </dl>

        {e.description && (
          <p className="mt-6 text-lg leading-relaxed text-muted">
            {e.description}
          </p>
        )}

        {past ? (
          <div className="card mt-8 p-6">
            <h2 className="text-lg font-semibold">Recap</h2>
            <p className="mt-2 text-muted">
              {e.summary ??
                "This event has wrapped. Thanks to everyone who came out."}{" "}
              We had {e.attendeesTotal} attendees, {e.attendeesNewToZcash} of
              them new to Zcash.
            </p>
            <div className="mt-4">
              <ButtonLink href={`/map/${cityToSlug(e.city)}`} variant="ghost">
                See {e.city} on the map
              </ButtonLink>
            </div>
          </div>
        ) : (
          e.registrationUrl && (
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={e.registrationUrl} external>
                Register / RSVP
              </ButtonLink>
              <ButtonLink href={`/map/${cityToSlug(e.city)}`} variant="ghost">
                See {e.city}
              </ButtonLink>
            </div>
          )
        )}
      </Container>
    </Section>
  );
}
