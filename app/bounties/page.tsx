import type { Metadata } from "next";
import { getBounties } from "@/lib/data";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { BountyCard } from "@/components/bounty/bounty-card";
import { IndiaMap } from "@/components/india-map";

export const metadata: Metadata = {
  title: "Bounties",
  description:
    "Every Zcash India bounty: what's open right now, and the archive of memes, videos, meetups and regional content the community has shipped.",
};

export default async function BountiesIndex() {
  const bounties = await getBounties();
  const active = bounties.filter((b) => b.status === "active");
  const completed = bounties.filter((b) => b.status === "completed");
  const totalPaid = completed.reduce((s, b) => s + b.prizePoolUsd, 0);
  const totalWinners = completed.reduce((s, b) => s + (b.winnerCount || b.winners.length), 0);
  const totalSubs = completed.reduce((s, b) => s + (b.submissionCount || b.submissions.length), 0);

  return (
    <Section className="py-8">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-bg p-8 sm:p-12">
          <IndiaMap
            variant="dotted"
            className="pointer-events-none absolute -right-10 -top-10 hidden h-72 w-72 opacity-10 sm:block"
          />
          <div className="relative max-w-2xl">
            <Badge tone="gold" className="mb-4">
              Bounties
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Do something real. Get paid in ZEC.</h1>
            <p className="mt-4 text-lg text-muted">
              One bounty a month. Memes, videos, meetups, content in your language. Every bounty is
              small, public and paid out in ZEC, and the pool goes up when the community over-delivers.{" "}
              {site.voice.impact}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-2xl font-bold text-gold">${totalPaid}</span>
                <span className="ml-2 text-muted">paid out so far</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{totalWinners}</span>
                <span className="ml-2 text-muted">winners</span>
              </div>
              <div>
                <span className="text-2xl font-bold">{totalSubs}</span>
                <span className="ml-2 text-muted">submissions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3">
          <h2 className="text-2xl font-bold">Open now</h2>
          <Badge tone="success">{active.length}</Badge>
        </div>
        <p className="mt-1 text-muted">This month's bounty. Winners are announced on X when it closes.</p>
        {active.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-muted">
            No bounty is open right now. Follow{" "}
            <a href={site.links.x} className="text-gold hover:underline" target="_blank" rel="noopener noreferrer">
              @ZcashIND
            </a>{" "}
            to catch the next one.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {active.map((b) => (
              <BountyCard key={b.id} b={b} />
            ))}
          </div>
        )}

        <div className="mt-14 flex items-center gap-3">
          <h2 className="text-2xl font-bold">Completed</h2>
          <Badge tone="muted">{completed.length}</Badge>
        </div>
        <p className="mt-1 text-muted">
          Every past bounty with its winners, what they won, and every submission that came in.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {completed.map((b) => (
            <BountyCard key={b.id} b={b} />
          ))}
        </div>

        <div className="card mt-14 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Want to host instead of post?</h2>
            <p className="mt-1 text-muted">The host kit has everything for a 40-minute meetup.</p>
          </div>
          <ButtonLink href="/host" variant="ghost">
            Get the host kit
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
