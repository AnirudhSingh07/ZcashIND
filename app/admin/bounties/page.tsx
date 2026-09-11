import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  saveBounty,
  activateBounty,
  deleteBounty,
  addBountyWinner,
  deleteBountyWinner,
  addBountySubmissions,
  deleteBountySubmission,
} from "@/app/actions/admin";
import { Container, Section, Badge } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Bounties",
  robots: { index: false, follow: false },
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";
const labelCls = "mb-1 block text-xs text-muted/70";

type PrizeRow = { place?: string; amountUsd?: number; note?: string };
type JudgeRow = { label?: string; weight?: number };

function prizesToText(json: string): string {
  try {
    return (JSON.parse(json) as PrizeRow[])
      .map((p) => `${p.place} | ${p.amountUsd} | ${p.note ?? ""}`)
      .join("\n");
  } catch {
    return "";
  }
}
function judgingToText(json: string): string {
  try {
    return (JSON.parse(json) as JudgeRow[]).map((j) => `${j.label} | ${j.weight}`).join("\n");
  } catch {
    return "";
  }
}
function istDate(d: Date | null): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  saved: { tone: "ok", text: "Saved." },
  invalid: {
    tone: "err",
    text: "Something was missing. A bounty needs a slug, title and start date. Winners need a handle and place. Submissions need valid X post links.",
  },
};

const KINDS = [
  ["irl_meetup", "IRL meetup (drives /bounties/irl + submit form)"],
  ["mini_meetup", "Mini meetup"],
  ["content", "Content"],
  ["meme", "Meme"],
  ["video", "Video"],
  ["explainer", "Explainer"],
] as const;

type BountyRow = NonNullable<Awaited<ReturnType<typeof prisma.bounty.findFirst>>>;

/** Shared field set for the "new" form and each per-bounty "edit" form. */
function BountyFields({ b }: { b?: BountyRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelCls}>Slug (URL) *</label>
        <input name="slug" defaultValue={b?.slug} className={inputCls} placeholder="meme-bounty-april-2026" readOnly={!!b} />
      </div>
      <div>
        <label className={labelCls}>Title *</label>
        <input name="title" defaultValue={b?.title} className={inputCls} placeholder="Zcash Meme Bounty" />
      </div>
      <div>
        <label className={labelCls}>Kind</label>
        <select name="kind" defaultValue={b?.kind ?? "content"} className={inputCls}>
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Status</label>
        <select name="status" defaultValue={b?.status ?? "active"} className={inputCls}>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Start date *</label>
        <input type="date" name="startDate" defaultValue={istDate(b?.startDate ?? null)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>End date</label>
        <input type="date" name="endDate" defaultValue={istDate(b?.endDate ?? null)} className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Format (one line)</label>
        <input name="format" defaultValue={b?.format ?? ""} className={inputCls} placeholder="Create original Zcash memes" />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Description (markdown)</label>
        <textarea name="description" rows={4} defaultValue={b?.description ?? ""} className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Rules (markdown, use "- " bullets)</label>
        <textarea name="rules" rows={4} defaultValue={b?.rules ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Topics (comma separated)</label>
        <input name="topics" defaultValue={b?.topics ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Accepted formats (comma separated)</label>
        <input name="acceptedFormats" defaultValue={b?.acceptedFormats ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Announcement URL (X)</label>
        <input name="announcementUrl" defaultValue={b?.announcementUrl ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Winner announcement URL (X)</label>
        <input name="winnerAnnouncementUrl" defaultValue={b?.winnerAnnouncementUrl ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Prize pool (USD)</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" name="prizePoolUsd" defaultValue={b?.prizePoolUsd ?? 0} className={inputCls} />
          <input
            type="number"
            name="initialPrizePoolUsd"
            defaultValue={b?.initialPrizePoolUsd ?? ""}
            placeholder="Launched at (if raised)"
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Submission count</label>
          <input type="number" name="submissionCount" defaultValue={b?.submissionCount ?? 0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Winner count</label>
          <input type="number" name="winnerCount" defaultValue={b?.winnerCount ?? 0} className={inputCls} />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Prizes, one per line: place | amount | note</label>
        <textarea
          name="prizes"
          rows={4}
          defaultValue={b ? prizesToText(b.prizes) : ""}
          className={`${inputCls} font-mono`}
          placeholder={"1st | 40 | Best meetup overall\n2nd | 25 | Runner-up"}
        />
      </div>

      <details className="sm:col-span-2 rounded-lg border border-line p-3" open={b?.kind === "irl_meetup"}>
        <summary className="cursor-pointer text-sm font-medium">IRL meetup settings (only for kind = IRL meetup)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Period (yyyy-mm)</label>
            <input name="period" defaultValue={b?.period ?? ""} className={inputCls} placeholder="2026-09" />
          </div>
          <div>
            <label className={labelCls}>Window label</label>
            <input name="windowLabel" defaultValue={b?.windowLabel ?? ""} className={inputCls} placeholder="Bounty window: September 2026" />
          </div>
          <div className="grid grid-cols-4 gap-2 sm:col-span-2">
            {[
              ["minAttendees", "Min attendees", b?.minAttendees ?? 4],
              ["minNewToZcash", "Min new", b?.minNewToZcash ?? 2],
              ["minMinutes", "Min minutes", b?.minMinutes ?? 20],
              ["minPhotos", "Min photos", b?.minPhotos ?? 3],
            ].map(([name, label, val]) => (
              <div key={name as string}>
                <label className={labelCls}>{label}</label>
                <input type="number" name={name as string} defaultValue={val as number} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Judging, one per line: label | weight</label>
            <textarea
              name="judging"
              rows={3}
              defaultValue={b ? judgingToText(b.judging) : ""}
              className={`${inputCls} font-mono`}
              placeholder={"Community impact | 30\nAttendance & reach | 20"}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={b?.active ?? false} className="h-4 w-4 accent-[#F4B728]" />
            Active IRL bounty (drives /bounties/irl and the submit form; only one at a time)
          </label>
        </div>
      </details>
    </div>
  );
}

export default async function AdminBounties({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const banner = (sp.saved && BANNERS.saved) || (sp.error && BANNERS[sp.error]) || null;

  const bounties = await prisma.bounty.findMany({
    orderBy: { startDate: "desc" },
    include: {
      winners: { orderBy: { sortOrder: "asc" } },
      submissions: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <Section className="py-8">
      <Container>
        <AdminNav />
        <h1 className="text-2xl font-bold">Bounties</h1>
        <p className="mt-1 text-sm text-muted">
          Each bounty is a page at /bounties/&lt;slug&gt;. The active IRL bounty also drives /bounties/irl and the
          submit form.
        </p>

        {banner && (
          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${
              banner.tone === "ok"
                ? "border-success/40 bg-success/10 text-success"
                : "border-danger/40 bg-danger/10 text-danger"
            }`}
          >
            {banner.text}
          </div>
        )}

        {/* New bounty */}
        <details className="card mt-6 p-5">
          <summary className="cursor-pointer font-semibold text-gold">+ New bounty</summary>
          <form action={saveBounty} className="mt-4">
            <BountyFields />
            <button className="btn-gold mt-4 px-5 py-2 text-sm">Create bounty</button>
          </form>
        </details>

        {/* Existing */}
        <div className="mt-8 space-y-6">
          {bounties.map((b) => (
            <div key={b.id} id={b.slug} className="card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={b.status === "active" ? "success" : "muted"}>{b.status}</Badge>
                <Badge tone="surface">{b.kind}</Badge>
                {b.active && <Badge tone="gold">Drives /bounties/irl</Badge>}
                <h2 className="ml-1 text-lg font-semibold">{b.title}</h2>
                <a href={`/bounties/${b.slug}`} target="_blank" className="ml-auto text-sm text-gold hover:underline">
                  View page ↗
                </a>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted hover:text-gold">Edit details</summary>
                <form action={saveBounty} className="mt-3">
                  <BountyFields b={b} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn-gold px-5 py-2 text-sm">Save changes</button>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.kind === "irl_meetup" && !b.active && (
                    <form action={activateBounty}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn-ghost px-4 py-2 text-sm">Make active IRL bounty</button>
                    </form>
                  )}
                  <form action={deleteBounty}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn-ghost border-danger px-4 py-2 text-sm text-danger">Delete bounty</button>
                  </form>
                </div>
              </details>

              {/* Winners */}
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-lg border border-line p-4">
                  <h3 className="text-sm font-semibold">Winners ({b.winners.length})</h3>
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {b.winners.map((w) => (
                      <li key={w.id} className="flex items-center gap-2 py-1.5">
                        <span className="w-32 shrink-0 text-muted">{w.place}</span>
                        <span className="font-medium">{w.xHandle ? `@${w.xHandle}` : w.name}</span>
                        <span className="text-gold">${w.prizeUsd}</span>
                        {w.submissionUrl && (
                          <a href={w.submissionUrl} target="_blank" className="text-xs text-muted hover:text-gold">
                            entry ↗
                          </a>
                        )}
                        <form action={deleteBountyWinner} className="ml-auto">
                          <input type="hidden" name="id" value={w.id} />
                          <button className="text-xs text-danger hover:underline">remove</button>
                        </form>
                      </li>
                    ))}
                    {b.winners.length === 0 && <li className="py-1.5 text-muted">None yet.</li>}
                  </ul>
                  <form action={addBountyWinner} className="mt-3 grid grid-cols-2 gap-2">
                    <input type="hidden" name="bountyId" value={b.id} />
                    <input name="xHandle" placeholder="@handle (if known)" className={inputCls} />
                    <input name="name" placeholder="Display name (if no handle)" className={inputCls} />
                    <input name="place" placeholder="1st / Honorable mention" className={inputCls} />
                    <input type="number" name="prizeUsd" placeholder="Prize USD" className={inputCls} />
                    <input name="submissionUrl" placeholder="https://x.com/…/status/…" className={`${inputCls} col-span-2`} />
                    <button className="btn-ghost col-span-2 px-4 py-1.5 text-sm">Add winner</button>
                  </form>
                </div>

                {/* Submissions */}
                <div className="rounded-lg border border-line p-4">
                  <h3 className="text-sm font-semibold">Submissions ({b.submissions.length})</h3>
                  <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto text-sm">
                    {b.submissions.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 py-1.5">
                        <a href={s.url} target="_blank" className="min-w-0 truncate hover:text-gold">
                          {s.xHandle ? `@${s.xHandle}` : s.url}
                        </a>
                        <form action={deleteBountySubmission} className="ml-auto">
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-xs text-danger hover:underline">remove</button>
                        </form>
                      </li>
                    ))}
                    {b.submissions.length === 0 && <li className="py-1.5 text-muted">None yet.</li>}
                  </ul>
                  <form action={addBountySubmissions} className="mt-3">
                    <input type="hidden" name="bountyId" value={b.id} />
                    <textarea
                      name="urls"
                      rows={3}
                      placeholder={"One X post link per line\nhttps://x.com/handle/status/123"}
                      className={inputCls}
                    />
                    <button className="btn-ghost mt-2 px-4 py-1.5 text-sm">Add submissions</button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
