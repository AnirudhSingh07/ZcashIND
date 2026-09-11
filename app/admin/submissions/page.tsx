import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePhotos, formatDateIST, padNode } from "@/lib/utils";
import { Container, Section, Badge } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false, follow: false },
};

const STATUS_TONE: Record<string, "gold" | "muted" | "success" | "danger"> = {
  pending: "gold",
  needs_info: "gold",
  verified: "success",
  rejected: "danger",
  disqualified: "danger",
};

export default async function SubmissionsPage() {
  await requireAdmin();
  const rows = await prisma.meetup.findMany({
    where: { kind: "irl_bounty" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const queue = rows.filter((r) => r.status === "pending" || r.status === "needs_info");
  const rest = rows.filter((r) => r.status !== "pending" && r.status !== "needs_info");

  return (
    <Section className="py-8">
      <Container>
        <AdminNav />
        <h1 className="text-2xl font-bold">Submissions</h1>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gold">
          Review queue ({queue.length})
        </h2>
        <div className="mt-3 space-y-3">
          {queue.length === 0 && (
            <p className="text-muted">Nothing waiting. Nice and clear.</p>
          )}
          {queue.map((r) => (
            <Row key={r.id} r={r} />
          ))}
        </div>

        {rest.length > 0 && (
          <>
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
              Processed ({rest.length})
            </h2>
            <div className="mt-3 space-y-3">
              {rest.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}

function Row({ r }: { r: Awaited<ReturnType<typeof prisma.meetup.findMany>>[number] }) {
  const photos = parsePhotos(r.photos);
  return (
    <Link
      href={`/admin/submissions/${r.id}`}
      className="card flex items-center gap-4 p-4 hover:border-gold/50"
    >
      {photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
          {photos.length}📷
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>
          {r.nodeNumber != null && (
            <span className="text-xs text-muted/60">Node #{padNode(r.nodeNumber)}</span>
          )}
          {r.newCityActivation && <Badge tone="success">🌱</Badge>}
        </div>
        <div className="mt-1 truncate font-medium">
          {r.city}: {r.title}
        </div>
        <div className="text-sm text-muted">
          👥 {r.attendeesTotal} · 🌱 {r.attendeesNewToZcash} new ·{" "}
          {formatDateIST(r.startsAt)} · {photos.length} photos
        </div>
      </div>
      <span className="text-gold">→</span>
    </Link>
  );
}
