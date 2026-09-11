import Link from "next/link";
import { PublicMeetup, cityToSlug } from "@/lib/data";
import { formatDateIST, isPast, padNode } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/validation";
import { Badge } from "@/components/ui";

/**
 * The signature IRL card:
 *   🟡 Indore , Zcash IRL Node #01
 *   👥 8 attendees
 *   🌱 5 new to Zcash
 *   🟢 Hosted by [Name]
 * Official events render with a distinct icon + accent border.
 */
export function MeetupCard({ m }: { m: PublicMeetup }) {
  const past = isPast(m.startsAt);
  const official = m.kind === "official_event";
  const pin = official ? "🎪" : past ? "⚪" : "🟡";

  return (
    <Link
      href={`/map/${cityToSlug(m.city)}`}
      className={`card block p-5 transition-colors hover:border-gold/50 ${
        official ? "border-gold/40 bg-gold/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold leading-snug">
          <span className="mr-1">{pin}</span>
          {m.city}
          {official ? (
            <span className="text-muted">: {m.title}</span>
          ) : (
            <span className="text-muted">
              {" "}
              , Zcash IRL Node #{padNode(m.nodeNumber)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>👥 {m.attendeesTotal} attendees</span>
        <span>🌱 {m.attendeesNewToZcash} new to Zcash</span>
      </div>

      {m.hostNamePublic && (
        <div className="mt-1 text-sm text-muted">
          🟢 Hosted by {m.hostNamePublic}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={official ? "gold" : past ? "muted" : "gold"}>
          {official ? "Official event" : "IRL meetup"}
        </Badge>
        {m.newCityActivation && <Badge tone="success">🌱 New city</Badge>}
        {past && <Badge tone="muted">Past</Badge>}
        <span className="text-xs text-muted/70">
          {formatDateIST(m.startsAt)} · {FORMAT_LABELS[m.format] ?? m.format}
        </span>
      </div>
    </Link>
  );
}
