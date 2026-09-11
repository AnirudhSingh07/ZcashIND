import Link from "next/link";
import type { PublicBounty } from "@/lib/data";
import { formatDateIST } from "@/lib/utils";
import { Badge } from "@/components/ui";

export const KIND_LABEL: Record<string, string> = {
  irl_meetup: "IRL meetup",
  mini_meetup: "Mini meetup",
  content: "Content",
  meme: "Meme",
  video: "Video",
  explainer: "Explainer",
};

export const KIND_EMOJI: Record<string, string> = {
  irl_meetup: "📍",
  mini_meetup: "☕",
  content: "✍️",
  meme: "😂",
  video: "🎬",
  explainer: "💡",
};

/** Month + year span, e.g. "Jul to Aug 2026" or "Sep 2026". */
export function bountyWindow(b: Pick<PublicBounty, "startDate" | "endDate">): string {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
      new Date(iso),
    );
  const a = fmt(b.startDate);
  const z = b.endDate ? fmt(b.endDate) : null;
  return z && z !== a ? `${a.split(" ")[0]} to ${z}` : a;
}

export function bountyHref(b: Pick<PublicBounty, "slug" | "kind" | "active">): string {
  return b.kind === "irl_meetup" && b.active ? "/bounties/irl" : `/bounties/${b.slug}`;
}

export function BountyCard({ b }: { b: PublicBounty }) {
  const active = b.status === "active";
  return (
    <Link
      href={bountyHref(b)}
      className={`card group flex flex-col p-6 transition-colors hover:border-gold/50 ${
        active ? "border-gold/40 bg-gold/5" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={active ? "success" : "muted"}>{active ? "● Active" : "Completed"}</Badge>
        <Badge tone="surface">
          {KIND_EMOJI[b.kind] ?? "🏷️"} {KIND_LABEL[b.kind] ?? b.kind}
        </Badge>
      </div>
      <h2 className="mt-3 text-xl font-semibold leading-snug group-hover:text-gold">{b.title}</h2>
      {b.format && <p className="mt-2 text-sm text-muted">{b.format}</p>}

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted/70">Prize pool</dt>
          <dd className="mt-0.5 font-semibold text-gold">
            ${b.prizePoolUsd}
            {b.initialPrizePoolUsd != null && b.initialPrizePoolUsd < b.prizePoolUsd && (
              <span className="ml-1 text-xs font-medium text-success">↑ from ${b.initialPrizePoolUsd}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted/70">{active ? "Winners" : "Submissions"}</dt>
          <dd className="mt-0.5 font-semibold">
            {active ? b.winnerCount || "TBD" : b.submissionCount || b.winners.length || "TBD"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted/70">{active ? "Closes" : "Winners"}</dt>
          <dd className="mt-0.5 font-semibold">
            {active ? (b.endDate ? formatDateIST(b.endDate) : "Open") : b.winnerCount || b.winners.length}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted/60">{bountyWindow(b)}</p>
      <span className="mt-auto pt-4 text-sm text-gold group-hover:underline">
        {active ? "See how to enter" : "See winners and submissions"}
      </span>
    </Link>
  );
}
