import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getContributor, cityToSlug } from "@/lib/data";
import { formatDateIST, padNode } from "@/lib/utils";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export async function generateStaticParams() {
  const rows = await prisma.contributor.findMany({ select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getContributor(slug);
  if (!data) return {};
  return {
    title: data.contributor.name,
    description: data.contributor.bio ?? `Zcash India contributor from ${data.contributor.city}.`,
  };
}

export default async function ContributorProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getContributor(slug);
  if (!data) notFound();
  const { contributor: c, meetups } = data;

  // Verified DB meetups first; fall back to the manually recorded numbers.
  const hosted = Math.max(meetups.length, c.meetupsHosted);
  const totalAttendees = Math.max(
    meetups.reduce((s, m) => s + m.attendeesTotal, 0),
    c.peopleReached,
  );
  const totalNew = Math.max(
    meetups.reduce((s, m) => s + m.attendeesNewToZcash, 0),
    c.newToZcash,
  );
  const showStats = hosted > 0 || totalAttendees > 0;

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link href="/contributors" className="text-sm text-gold hover:underline">
          ← All contributors
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold sm:text-4xl">{c.name}</h1>
          {c.official && <Badge tone="success">✓ Official contributor</Badge>}
        </div>
        {c.role && <p className="mt-1 text-gold">{c.role}</p>}
        {c.city && <p className="mt-1 text-muted">{c.city}, India</p>}
        {c.bio && <p className="mt-4 text-lg text-muted">{c.bio}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {c.telegram && (
            <span className="card-2 rounded-full px-4 py-1.5 text-sm">
              Telegram {c.telegram}
            </span>
          )}
          {(c.x || c.xHandle) && (
            <a
              href={c.x ?? `https://x.com/${c.xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-2 rounded-full px-4 py-1.5 text-sm hover:border-gold/50"
            >
              𝕏 {c.xHandle ? `@${c.xHandle}` : "Profile"} ↗
            </a>
          )}
        </div>

        {c.highlights.length > 0 && (
          <div className="card mt-8 border-gold/40 bg-gold/5 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
              Highlights
            </h2>
            <ul className="mt-3 space-y-2">
              {c.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm">
                  <span aria-hidden>🏆</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted/70">
              See every bounty and its winners in the{" "}
              <Link href="/bounties" className="text-gold hover:underline">
                bounty archive
              </Link>
              .
            </p>
          </div>
        )}

        {showStats && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-gold">{hosted}</div>
              <div className="text-xs text-muted">Meetups hosted</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold">{totalAttendees || "·"}</div>
              <div className="text-xs text-muted">People reached</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold">{totalNew || "·"}</div>
              <div className="text-xs text-muted">New to Zcash</div>
            </div>
          </div>
        )}

        {meetups.length > 0 && (
          <>
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
              Verified meetups on the map
            </h2>
            <div className="mt-3 space-y-3">
              {meetups.map((m) => (
                <Link
                  key={m.id}
                  href={`/map/${cityToSlug(m.city)}`}
                  className="card block p-4 hover:border-gold/50"
                >
                  <div className="font-medium">
                    {m.city}, Node #{padNode(m.nodeNumber)}: {m.title}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    👥 {m.attendeesTotal} · 🌱 {m.attendeesNewToZcash} new ·{" "}
                    {formatDateIST(m.startsAt)}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="card mt-10 p-6 text-center">
          <p className="text-muted">{site.voice.becomeContributor}</p>
          <div className="mt-3">
            <ButtonLink href="/contribute">How to contribute</ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
