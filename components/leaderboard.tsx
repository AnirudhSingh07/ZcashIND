import Link from "next/link";
import { getLeaderboard, getBounty, cityToSlug } from "@/lib/data";
import { padNode } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { site } from "@/config/site";

export async function Leaderboard() {
  const { period } = await getBounty();
  const rows = await getLeaderboard(period);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-5">
        <h3 className="text-lg font-semibold">Public leaderboard</h3>
        <p className="mt-1 text-sm text-muted">
          Verified {period} meetups only. Ranked by reach, not private
          judge scores. {site.voice.impact}
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-muted">
          No verified meetups yet this window. Be the first —{" "}
          <Link href="/bounties/irl/submit" className="text-gold hover:underline">
            add yours
          </Link>
          .
        </div>
      ) : (
        <ol className="divide-y divide-line">
          {rows.map((m, i) => (
            <li key={m.id} className="flex items-center gap-4 p-4">
              <span className="w-6 shrink-0 text-center text-lg font-bold text-gold tabular-nums">
                {i + 1}
              </span>
              <Link
                href={`/map/${cityToSlug(m.city)}`}
                className="min-w-0 flex-1 hover:text-gold"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">
                    {m.city} — Node #{padNode(m.nodeNumber)}
                  </span>
                  {m.newCityActivation && <Badge tone="success">🌱 New city</Badge>}
                </div>
                <div className="text-sm text-muted">
                  👥 {m.attendeesTotal} attendees · 🌱 {m.attendeesNewToZcash} new
                  to Zcash
                  {m.hostNamePublic && <> · 🟢 {m.hostNamePublic}</>}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="border-t border-line p-4 text-xs text-muted/60">
        This is a reach leaderboard, not the final ranking. Private judge scores
        (Impact, Quality, Documentation) are never shown publicly.
      </p>
    </div>
  );
}
