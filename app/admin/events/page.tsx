import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEvent } from "@/app/actions/admin";
import { Container, Section } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Manage events",
  robots: { index: false, follow: false },
};

// Return yyyy-mm-dd / HH:mm in IST for form inputs.
function istParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => fmt.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";

export default async function AdminEvents() {
  await requireAdmin();
  const events = await prisma.meetup.findMany({
    where: { kind: "official_event" },
    orderBy: { startsAt: "asc" },
  });

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Official events</h1>
        <p className="mt-2 text-muted">
          Edit the official events shown on /events. IRL meetups are managed via
          the submissions queue.
        </p>

        <div className="mt-6 space-y-4">
          {events.map((ev) => {
            const { date, time } = istParts(ev.startsAt);
            return (
              <form key={ev.id} action={updateEvent} className="card p-5">
                <input type="hidden" name="id" value={ev.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted/70">Title</label>
                    <input name="title" defaultValue={ev.title} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted/70">City</label>
                    <input name="city" defaultValue={ev.city} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted/70">Registration URL</label>
                    <input
                      name="registrationUrl"
                      defaultValue={ev.registrationUrl ?? ""}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted/70">Date (IST)</label>
                    <input type="date" name="date" defaultValue={date} className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted/70">Start time (IST)</label>
                    <input type="time" name="startTime" defaultValue={time} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted/70">Description</label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={ev.description ?? ""}
                      className={inputCls}
                    />
                  </div>
                </div>
                <button className="btn-gold mt-3 px-5 py-2 text-sm">Save changes</button>
              </form>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
