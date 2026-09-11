import { lumaUrl, lumaEmbedUrl, type LumaEvent } from "@/config/luma-events";
import { getLumaEvents } from "@/lib/data";
import { site } from "@/config/site";
import { formatIST } from "@/lib/utils";
import { Badge, ButtonLink } from "@/components/ui";

function EventRow({ e }: { e: LumaEvent }) {
  return (
    <a
      href={lumaUrl(e.slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="card group flex items-start justify-between gap-3 p-4 transition-colors hover:border-gold/50"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span>{e.isOnline ? "🖥️" : "📍"}</span>
          <span className="font-medium group-hover:text-gold">{e.title}</span>
        </div>
        <div className="mt-1 text-sm text-muted">{formatIST(e.startsAt)}</div>
        {e.venue && <div className="text-sm text-muted/70">{e.venue}</div>}
        {e.coHosts && (
          <div className="mt-0.5 text-xs text-muted/60">with {e.coHosts}</div>
        )}
        {e.topics && (
          <div className="mt-1 text-xs text-muted/70">Topics: {e.topics}</div>
        )}
        {(e.attendees || e.note) && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {e.attendees && (
              <span className="rounded-full bg-gold/10 px-2 py-0.5 font-medium text-gold">
                👥 {e.attendees}{e.isOnline ? " attendees" : " students"}
              </span>
            )}
            {e.note && <span className="text-muted">{e.note}</span>}
          </div>
        )}
      </div>
      <span className="shrink-0 text-sm text-gold">Luma ↗</span>
    </a>
  );
}

export async function LumaEvents() {
  const lumaEvents = await getLumaEvents();
  const featured = lumaEvents.slice(0, 3);
  const irl = lumaEvents.filter((e) => e.series === "irl");
  const online = lumaEvents.filter((e) => e.series !== "irl");
  const irlAttendees = irl.reduce((s, e) => s + (e.attendees ?? 0), 0);
  const onlineAttendees = online.reduce((s, e) => s + (e.attendees ?? 0), 0);

  return (
    <div>
      {/* Featured — live Luma previews */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Recent events</h2>
          <p className="mt-1 text-muted">
            Live from our Luma. Tap any card to see the full event and RSVP.
          </p>
        </div>
        <ButtonLink href={site.luma.profileUrl} variant="ghost" external>
          All on Luma
        </ButtonLink>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((e) => (
          <div key={e.slug} className="card overflow-hidden">
            <iframe
              src={lumaEmbedUrl(e.slug)}
              title={e.title}
              className="h-[500px] w-full"
              style={{ border: "none" }}
              allow="fullscreen; payment"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* In-person editions */}
      <div className="mt-12 flex items-center gap-3">
        <h3 className="text-xl font-bold">In-person editions</h3>
        <Badge tone="gold">{irl.length}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        Campus workshops and community connects across India.
        {irlAttendees > 0 && ` ${irlAttendees.toLocaleString("en-IN")} students so far.`}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {irl.map((e) => (
          <EventRow key={e.slug} e={e} />
        ))}
      </div>

      {/* Online Live series */}
      <div className="mt-12 flex items-center gap-3">
        <h3 className="text-xl font-bold">Zcash India Live & Dev series</h3>
        <Badge tone="muted">{online.length}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        Our online sessions: ecosystem updates, privacy talks and dev workshops.
        {onlineAttendees > 0 && ` ${onlineAttendees.toLocaleString("en-IN")} attendees across the series.`}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {online.map((e) => (
          <EventRow key={e.slug} e={e} />
        ))}
      </div>
    </div>
  );
}
