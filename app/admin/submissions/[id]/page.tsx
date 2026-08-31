import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePhotos, formatIST, padNode } from "@/lib/utils";
import { VENUE_LABELS, FORMAT_LABELS } from "@/lib/validation";
import { Container, Section, Badge } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  verifyMeetup,
  needsInfoMeetup,
  rejectMeetup,
  disqualifyMeetup,
} from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Review submission",
  robots: { index: false, follow: false },
};

export default async function SubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const m = await prisma.meetup.findUnique({ where: { id } });
  if (!m) notFound();
  const photos = parsePhotos(m.photos);

  const rows: [string, React.ReactNode][] = [
    ["Status", <Badge key="s" tone="gold">{m.status}</Badge>],
    ["City", `${m.city}${m.state ? ", " + m.state : ""}`],
    ["When", formatIST(m.startsAt)],
    ["Duration", `${m.durationMinutes} min`],
    ["Venue", `${m.venueName ?? "—"} (${VENUE_LABELS[m.venueType] ?? m.venueType})`],
    ["Format", FORMAT_LABELS[m.format] ?? m.format],
    ["Online", m.isOnline ? "Yes" : "No"],
    ["Language", m.language ?? "—"],
    ["Attendees", `${m.attendeesTotal} total · ${m.attendeesNewToZcash} new to Zcash`],
    ["New-city activation", m.newCityActivation ? "Yes 🌱" : "No"],
    ["Node number", m.nodeNumber != null ? `#${padNode(m.nodeNumber)}` : "—"],
    ["Coordinates", `${m.lat}, ${m.lng}`],
    ["Branding visible", m.brandingVisible ? "Yes" : "No"],
    ["Registration", m.registrationUrl ?? "—"],
    ["Bounty period", m.bountyPeriod ?? "—"],
    ["Public host name", m.hostNamePublic ?? "—"],
  ];

  return (
    <Section className="py-8">
      <Container className="max-w-4xl">
        <AdminNav />
        <Link href="/admin/submissions" className="text-sm text-gold hover:underline">
          ← Back to queue
        </Link>
        <h1 className="mt-3 text-2xl font-bold">{m.title}</h1>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p}
                src={p}
                alt=""
                className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {m.summary && (
          <div className="card mt-6 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              What was discussed
            </h2>
            <p className="mt-2 text-muted">{m.summary}</p>
          </div>
        )}

        {/* Fields */}
        <dl className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
              <dt className="text-muted/70">{k}</dt>
              <dd className="text-right font-medium">{val}</dd>
            </div>
          ))}
        </dl>

        {/* Private contact — admin only */}
        <div className="card mt-6 border-danger/30 bg-danger/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
            Private contact — never shown publicly
          </h2>
          <p className="mt-2 font-mono text-text">{m.hostContactPrivate ?? "—"}</p>
        </div>

        {m.adminNotes && (
          <div className="card mt-4 p-5">
            <h2 className="text-sm font-semibold text-muted">Admin notes</h2>
            <p className="mt-1 text-muted">{m.adminNotes}</p>
          </div>
        )}
        {m.rejectionReason && (
          <div className="card mt-4 p-5">
            <h2 className="text-sm font-semibold text-muted">Rejection reason</h2>
            <p className="mt-1 text-muted">{m.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <form action={verifyMeetup} className="card p-5">
            <input type="hidden" name="id" value={m.id} />
            <h3 className="font-semibold text-success">Verify</h3>
            <p className="mt-1 text-sm text-muted">
              Assigns the next node number for {m.city} and publishes it on the
              map. Flags a new-city activation if it's the first here.
            </p>
            <button className="btn-gold mt-3 px-5 py-2 text-sm">Verify meetup</button>
          </form>

          <form action={needsInfoMeetup} className="card p-5">
            <input type="hidden" name="id" value={m.id} />
            <h3 className="font-semibold">Request more info</h3>
            <textarea
              name="adminNotes"
              rows={2}
              defaultValue={m.adminNotes ?? ""}
              placeholder="What do you need from the host?"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
            <button className="btn-ghost mt-3 px-5 py-2 text-sm">Mark needs info</button>
          </form>

          <form action={rejectMeetup} className="card p-5">
            <input type="hidden" name="id" value={m.id} />
            <h3 className="font-semibold text-danger">Reject</h3>
            <input
              name="rejectionReason"
              placeholder="Reason (optional)"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
            <button className="btn-ghost mt-3 border-danger px-5 py-2 text-sm text-danger">
              Reject
            </button>
          </form>

          <form action={disqualifyMeetup} className="card p-5">
            <input type="hidden" name="id" value={m.id} />
            <h3 className="font-semibold text-danger">Disqualify</h3>
            <input
              name="rejectionReason"
              placeholder="Rule violation (optional)"
              className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            />
            <button className="btn-ghost mt-3 border-danger px-5 py-2 text-sm text-danger">
              Disqualify
            </button>
          </form>
        </div>
      </Container>
    </Section>
  );
}
