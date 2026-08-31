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

  const [pending, needsInfo, verified, official, cities] = await Promise.all([
    prisma.meetup.count({ where: { status: "pending" } }),
    prisma.meetup.count({ where: { status: "needs_info" } }),
    prisma.meetup.count({ where: { status: "verified" } }),
    prisma.meetup.count({ where: { kind: "official_event" } }),
    prisma.meetup.findMany({
      where: { status: "verified" },
      select: { city: true },
      distinct: ["city"],
    }),
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
        </div>
      </Container>
    </Section>
  );
}
