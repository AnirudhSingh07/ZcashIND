import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBounties, getBountyBySlug } from "@/lib/data";
import { formatDateIST, isPast } from "@/lib/utils";
import { Markdown } from "@/lib/markdown";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { SubmissionGrid } from "@/components/bounty/submission-grid";
import { KIND_LABEL, KIND_EMOJI, bountyWindow } from "@/components/bounty/bounty-card";

export async function generateStaticParams() {
  const all = await getBounties();
  return all.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBountyBySlug(slug);
  if (!b) return {};
  const status = b.status === "active" ? "Open now" : "Completed";
  const description = `$${b.prizePoolUsd} in ${b.currency}. ${b.format ?? KIND_LABEL[b.kind] ?? "Bounty"}. ${status}, ${bountyWindow(b)}.`;
  const title = `${b.title} | Zcash India Bounty`;
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${site.url}/bounties/${b.slug}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BountyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBountyBySlug(slug);
  if (!b) notFound();
  // The active IRL bounty has its own richer page with the leaderboard + form.
  if (b.kind === "irl_meetup" && b.active) redirect("/bounties/irl");

  const active = b.status === "active";
  const closed = b.endDate ? isPast(b.endDate) : false;
  const winnersWithLinks = b.winners.filter((w) => w.submissionUrl);
  const winnerUrls = new Set(winnersWithLinks.map((w) => w.submissionUrl));
  const otherSubmissions = b.submissions.filter((s) => !winnerUrls.has(s.url));

  return (
    <Section className="py-8">
      <Container>
        <Link href="/bounties" className="text-sm text-gold hover:underline">
          ← All bounties
        </Link>

        {/* Hero */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={active ? "success" : "muted"}>{active ? "● Open now" : "Completed"}</Badge>
              <Badge tone="surface">
                {KIND_EMOJI[b.kind] ?? "🏷️"} {KIND_LABEL[b.kind] ?? b.kind}
              </Badge>
              <span className="text-sm text-muted">{bountyWindow(b)}</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{b.title}</h1>
            {b.format && <p className="mt-4 max-w-2xl text-lg text-muted">{b.format}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              {active && b.announcementUrl && (
                <ButtonLink href={b.announcementUrl} external>
                  Enter on X
                </ButtonLink>
              )}
              {!active && b.winnerAnnouncementUrl && (
                <ButtonLink href={b.winnerAnnouncementUrl} external>
                  Winner announcement
                </ButtonLink>
              )}
              {!active && !b.winnerAnnouncementUrl && b.announcementUrl && (
                <ButtonLink href={b.announcementUrl} variant="ghost" external>
                  Original announcement
                </ButtonLink>
              )}
              <ShareButton
                title={`${b.title} | Zcash India Bounty`}
                text={`$${b.prizePoolUsd} in ZEC. ${b.format ?? ""}`}
                path={`/bounties/${b.slug}`}
              />
            </div>
          </div>

          {/* At a glance */}
          <div className="card p-6">
            <div className="text-xs text-muted/70">Prize pool</div>
            <div className="text-4xl font-bold text-gold">${b.prizePoolUsd}</div>
            <div className="text-sm text-muted">paid in {b.currency}</div>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted/70">Opened</dt>
                <dd className="font-medium">{formatDateIST(b.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted/70">{active && !closed ? "Closes" : "Closed"}</dt>
                <dd className="font-medium">{b.endDate ? formatDateIST(b.endDate) : "Open"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted/70">Submissions</dt>
                <dd className="font-medium">{b.submissionCount || b.submissions.length || (active ? "Open" : "TBD")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted/70">Winners</dt>
                <dd className="font-medium">{b.winnerCount || b.winners.length || "TBD"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Description + prizes */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {b.description && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold">About this bounty</h2>
                <div className="mt-2">
                  <Markdown source={b.description} />
                </div>
              </div>
            )}

            {(b.topics.length > 0 || b.acceptedFormats.length > 0) && (
              <div className="card p-6">
                {b.topics.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold">Topics</h2>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {b.topics.map((t) => (
                        <li key={t} className="card-2 rounded-full px-3 py-1 text-sm">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {b.acceptedFormats.length > 0 && (
                  <>
                    <h2 className={`text-lg font-semibold ${b.topics.length > 0 ? "mt-6" : ""}`}>
                      Formats accepted
                    </h2>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {b.acceptedFormats.map((t) => (
                        <li key={t} className="rounded-full border border-line px-3 py-1 text-sm text-muted">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {b.rules && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold">{active ? "How to participate" : "The rules"}</h2>
                <div className="mt-2">
                  <Markdown source={b.rules} />
                </div>
                {active && (
                  <p className="mt-4 text-sm text-muted">
                    Questions? Ask in{" "}
                    <a href={site.links.telegram} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                      Telegram
                    </a>
                    . The Zcash India team's decisions are final.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Prize breakdown */}
          <div className="card h-fit p-6">
            <h2 className="text-lg font-semibold">Prize breakdown</h2>
            {b.prizes.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Split across all winners at the team's discretion.</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-line">
                  {b.prizes.map((p) => (
                    <tr key={p.place}>
                      <td className="py-2.5 pr-3 align-top">
                        <div className="font-medium">{p.place}</div>
                        {p.note && <div className="text-xs text-muted">{p.note}</div>}
                      </td>
                      <td className="py-2.5 text-right align-top font-semibold text-gold">${p.amountUsd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-4 text-xs text-muted/70">Paid in ZEC equivalent at the time of payout.</p>
          </div>
        </div>

        {/* Winners */}
        {b.winners.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Winners</h2>
              <Badge tone="gold">{b.winners.length}</Badge>
            </div>
            <div className="card mt-4 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Place</th>
                    <th className="px-4 py-2.5 font-semibold">Winner</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Prize</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Entry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {b.winners.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-medium">{w.place}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://x.com/${w.xHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-gold"
                        >
                          @{w.xHandle}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gold">${w.prizeUsd}</td>
                      <td className="px-4 py-3 text-right">
                        {w.submissionUrl ? (
                          <a href={w.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                            View ↗
                          </a>
                        ) : (
                          <span className="text-muted/50">·</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {winnersWithLinks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Winning entries</h3>
                <div className="mt-3">
                  <SubmissionGrid
                    initial={6}
                    posts={winnersWithLinks.map((w) => ({
                      id: w.id,
                      url: w.submissionUrl!,
                      xHandle: w.xHandle,
                      label: `${w.place} · $${w.prizeUsd}`,
                    }))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* All submissions */}
        {otherSubmissions.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">
                {winnersWithLinks.length > 0 ? "More submissions" : "All submissions"}
              </h2>
              <Badge tone="muted">{otherSubmissions.length}</Badge>
            </div>
            <p className="mt-1 text-muted">Everything the community sent in, in the order it arrived.</p>
            <div className="mt-4">
              <SubmissionGrid
                initial={6}
                posts={otherSubmissions.map((s) => ({ id: s.id, url: s.url, xHandle: s.xHandle }))}
              />
            </div>
          </div>
        )}

        {/* Active CTA */}
        {active && (
          <div className="card mt-14 border-gold/40 bg-gold/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to enter?</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted">
              Post your entry on X, tag @ZcashIND, and you're in.
              {b.endDate && ` Entries close ${formatDateIST(b.endDate)}.`}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {b.announcementUrl && (
                <ButtonLink href={b.announcementUrl} external>
                  Read the announcement
                </ButtonLink>
              )}
              <ButtonLink href={site.links.telegram} variant="ghost" external>
                Ask on Telegram
              </ButtonLink>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
