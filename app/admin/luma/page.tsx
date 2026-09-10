import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addLumaEvent,
  updateLumaEvent,
  deleteLumaEvent,
} from "@/app/actions/admin";
import { lumaUrl } from "@/config/luma-events";
import { formatIST } from "@/lib/utils";
import { Container, Section } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Events (Luma)",
  robots: { index: false, follow: false },
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";
const labelCls = "mb-1 block text-xs text-muted/70";

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  added: { tone: "ok", text: "Event added." },
  saved: { tone: "ok", text: "Changes saved." },
  invalid: {
    tone: "err",
    text: "Need at least a Luma slug, title, date, time and city.",
  },
  duplicate: { tone: "err", text: "An event with that Luma slug already exists." },
};

// yyyy-mm-dd / HH:mm in IST for the form inputs.
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

const SERIES = [
  ["irl", "In-person (IRL)"],
  ["live", "Live series"],
  ["dev", "Dev series"],
] as const;

function SeriesSelect({ value }: { value?: string }) {
  return (
    <select name="series" defaultValue={value ?? "irl"} className={inputCls}>
      {SERIES.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export default async function AdminLuma({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const banner =
    (sp.added && BANNERS.added) ||
    (sp.saved && BANNERS.saved) ||
    (sp.error && BANNERS[sp.error]) ||
    null;

  const events = await prisma.lumaEvent.findMany({
    orderBy: { startsAt: "desc" },
  });

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Events (Luma)</h1>
        <p className="mt-2 text-muted">
          The single source for the events shown on /events, the homepage, and
          the map. Paste the lu.ma slug from an event link
          (lu.ma/<span className="text-gold">slug</span>); the featured cards
          embed live from Luma. For a new in-person city, add its state and map
          coordinates so it appears on the map.
        </p>

        {banner && (
          <div
            className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
              banner.tone === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* Add */}
        <form action={addLumaEvent} className="card mt-6 p-5">
          <h2 className="text-sm font-semibold">Add an event</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Luma slug</label>
              <input name="slug" required placeholder="8scuih0r" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Series</label>
              <SeriesSelect />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Title</label>
              <input
                name="title"
                required
                placeholder="Zcash IND Developer Workshop #03"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date (IST)</label>
              <input type="date" name="date" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start time (IST)</label>
              <input type="time" name="startTime" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input name="city" required placeholder="Surat / Online" className={inputCls} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input type="checkbox" id="add-online" name="isOnline" className="h-4 w-4" />
              <label htmlFor="add-online" className="text-sm text-muted">
                Online event
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Venue (optional)</label>
              <input name="venue" placeholder="L.D. College of Engineering" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Co-hosts (optional)</label>
              <input name="coHosts" placeholder="PU DAO & Swayam" className={inputCls} />
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted/70">
              New in-person city? Add map location (optional)
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>State</label>
                <input name="state" placeholder="Gujarat" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Latitude</label>
                <input name="lat" placeholder="21.1702" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Longitude</label>
                <input name="lng" placeholder="72.8311" className={inputCls} />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted/50">
              Known cities (Surat, Ahmedabad, Bhopal, Vadodara, Udaipur, Indore)
              resolve automatically — leave blank.
            </p>
          </details>

          <button className="btn-gold mt-4 px-5 py-2 text-sm">Add event</button>
        </form>

        {/* Existing */}
        <div className="mt-6 space-y-3">
          {events.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No events in the DB yet — the site is showing the built-in config
              list. Add one here to take over.
            </p>
          )}

          {events.map((ev) => {
            const { date, time } = istParts(ev.startsAt);
            return (
              <form key={ev.id} action={updateLumaEvent} className="card p-5">
                <input type="hidden" name="id" value={ev.id} />
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={lumaUrl(ev.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline"
                  >
                    lu.ma/{ev.slug} ↗
                  </a>
                  <span className="text-xs text-muted">{formatIST(ev.startsAt.toISOString())}</span>
                </div>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <input name="title" defaultValue={ev.title} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Slug</label>
                    <input name="slug" defaultValue={ev.slug} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Series</label>
                    <SeriesSelect value={ev.series} />
                  </div>
                  <div>
                    <label className={labelCls}>Date (IST)</label>
                    <input type="date" name="date" defaultValue={date} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Time (IST)</label>
                    <input type="time" name="startTime" defaultValue={time} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input name="city" defaultValue={ev.city} className={inputCls} />
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <input
                      type="checkbox"
                      id={`online-${ev.id}`}
                      name="isOnline"
                      defaultChecked={ev.isOnline}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`online-${ev.id}`} className="text-sm text-muted">
                      Online
                    </label>
                  </div>
                  <div>
                    <label className={labelCls}>Venue</label>
                    <input name="venue" defaultValue={ev.venue ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Co-hosts</label>
                    <input name="coHosts" defaultValue={ev.coHosts ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input name="state" defaultValue={ev.state ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Lat</label>
                    <input name="lat" defaultValue={ev.lat ?? ""} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Lng</label>
                    <input name="lng" defaultValue={ev.lng ?? ""} className={inputCls} />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-gold px-4 py-1.5 text-sm">Save</button>
                  <button
                    formAction={deleteLumaEvent}
                    className="btn-ghost px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
