import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container, Section, Stat } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHome() {
  await requireAdmin();

  const [
    pending,
    needsInfo,
    verified,
    official,
    cities,
    featured,
    aftermovies,
    lumaCount,
    updatesCount,
  ] = await Promise.all([
      prisma.meetup.count({ where: { status: "pending" } }),
      prisma.meetup.count({ where: { status: "needs_info" } }),
      prisma.meetup.count({ where: { status: "verified" } }),
      prisma.meetup.count({ where: { kind: "official_event" } }),
      prisma.meetup.findMany({
        where: { status: "verified" },
        select: { city: true },
        distinct: ["city"],
      }),
      prisma.featuredPost.count(),
      prisma.aftermovie.count(),
      prisma.lumaEvent.count(),
      prisma.update.count(),
    ]);

  return (
    <Section className="py-8">
      <Container>
        <AdminNav />
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={pending} label="Pending review" accent />
          <Stat value={needsInfo} label="Needs info" />
          <Stat value={verified} label="Verified" />
          <Stat value={cities.length} label="Cities lit" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/admin/luma" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Events (Luma) →</h2>
            <p className="mt-1 text-muted">
              {lumaCount > 0
                ? `${lumaCount} event${lumaCount === 1 ? "" : "s"} in the DB`
                : "Using the config list"}
              . Drives /events, the homepage and the map. Add, edit or remove.
            </p>
          </Link>
          <Link href="/admin/submissions" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Review submissions →</h2>
            <p className="mt-1 text-muted">
              {pending} pending, {needsInfo} awaiting info. Verify, request info,
              reject or disqualify.
            </p>
          </Link>
          <Link href="/admin/events" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Manage events →</h2>
            <p className="mt-1 text-muted">
              {official} official events. Edit titles, dates and registration
              links.
            </p>
          </Link>
          <Link href="/admin/featured" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Featured posts →</h2>
            <p className="mt-1 text-muted">
              {featured} featured {featured === 1 ? "post" : "posts"} spotlighted
              on the homepage. Add, reorder or remove @ZcashIND posts.
            </p>
          </Link>
          <Link href="/admin/aftermovies" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Aftermovies →</h2>
            <p className="mt-1 text-muted">
              {aftermovies} recap {aftermovies === 1 ? "video" : "videos"} on
              /events. Add by link, embed, or uploaded video file.
            </p>
          </Link>
          <Link href="/admin/updates" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Updates →</h2>
            <p className="mt-1 text-muted">
              {updatesCount} {updatesCount === 1 ? "update" : "updates"} on
              /updates. Post from an X link — title, note, tag, pin.
            </p>
          </Link>
          <Link href="/admin/bounty" className="card p-6 hover:border-gold/50">
            <h2 className="text-lg font-semibold text-gold">Bounty →</h2>
            <p className="mt-1 text-muted">
              Configure the IRL meetup bounty — prize pool, prizes, minimums and
              judging weights shown on /bounties/irl.
            </p>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
