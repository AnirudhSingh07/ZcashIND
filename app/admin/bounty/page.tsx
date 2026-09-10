import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBounty, activateBounty, deleteBounty } from "@/app/actions/admin";
import { Container, Section, Badge } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Bounty",
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
    return (JSON.parse(json) as JudgeRow[])
      .map((j) => `${j.label} | ${j.weight}`)
      .join("\n");
  } catch {
    return "";
  }
}

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  saved: { tone: "ok", text: "Bounty saved." },
  invalid: { tone: "err", text: "Need at least a period (e.g. 2026-09) and a window label." },
};

/** Reusable field set for both the "new" and per-bounty "edit" forms. */
function BountyFields({
  b,
}: {
  b?: {
    period: string;
    windowLabel: string;
    prizePoolUsd: number;
    prizes: string;
    minAttendees: number;
    minNewToZcash: number;
    minMinutes: number;
    minPhotos: number;
    judging: string;
    active: boolean;
  };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Period</label>
          <input
            name="period"
            required
            defaultValue={b?.period}
            placeholder="2026-09"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Window label</label>
          <input
            name="windowLabel"
            required
            defaultValue={b?.windowLabel}
            placeholder="Bounty window: September 2026 (confirm dates)"
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-5">
        <div>
          <label className={labelCls}>Prize pool $</label>
          <input name="prizePoolUsd" type="number" defaultValue={b?.prizePoolUsd ?? 0} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min attendees</label>
          <input name="minAttendees" type="number" defaultValue={b?.minAttendees ?? 4} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min new-to-Zcash</label>
          <input name="minNewToZcash" type="number" defaultValue={b?.minNewToZcash ?? 2} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min minutes</label>
          <input name="minMinutes" type="number" defaultValue={b?.minMinutes ?? 20} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Min photos</label>
          <input name="minPhotos" type="number" defaultValue={b?.minPhotos ?? 3} className={inputCls} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>
            Prizes — one per line: <code>place | amount | note</code>
          </label>
          <textarea
            name="prizes"
            rows={5}
            defaultValue={b ? prizesToText(b.prizes) : "1st | 40 | Best meetup overall"}
            className={`${inputCls} font-mono text-xs`}
          />
        </div>
        <div>
          <label className={labelCls}>
            Judging — one per line: <code>label | weight</code>
          </label>
          <textarea
            name="judging"
            rows={5}
            defaultValue={b ? judgingToText(b.judging) : "Impact | 30"}
            className={`${inputCls} font-mono text-xs`}
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="active" defaultChecked={b?.active ?? true} className="h-4 w-4" />
        Make this the active bounty (shown on the site)
      </label>
    </>
  );
}

export default async function AdminBounty({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const banner = (sp.saved && BANNERS.saved) || (sp.error && BANNERS[sp.error]) || null;

  const bounties = await prisma.bounty.findMany({ orderBy: { period: "desc" } });

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Bounty</h1>
        <p className="mt-2 text-muted">
          Configure the IRL meetup bounty shown on /bounties/irl — prize pool,
          prizes, minimums and judging weights. The <strong>active</strong> bounty
          is the one used across the site.
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

        {bounties.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">
            No bounty in the DB yet — the site is using the built-in config
            values. Save one below to take over.
          </p>
        )}

        {/* Add new */}
        <form action={saveBounty} className="card mt-6 p-5">
          <h2 className="text-sm font-semibold">Add a bounty cycle</h2>
          <div className="mt-3">
            <BountyFields />
          </div>
          <button className="btn-gold mt-4 px-5 py-2 text-sm">Save bounty</button>
        </form>

        {/* Existing */}
        <div className="mt-6 space-y-4">
          {bounties.map((b) => (
            <form key={b.id} action={saveBounty} className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold">Bounty {b.period}</h2>
                {b.active && <Badge tone="success">Active</Badge>}
              </div>
              <BountyFields b={b} />
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-gold px-4 py-1.5 text-sm">Save changes</button>
                {!b.active && (
                  <button formAction={activateBounty} className="btn-ghost px-4 py-1.5 text-sm">
                    Make active
                  </button>
                )}
                <button
                  formAction={deleteBounty}
                  className="btn-ghost px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
              {/* activate/delete only need the id */}
              <input type="hidden" name="id" value={b.id} />
            </form>
          ))}
        </div>
      </Container>
    </Section>
  );
}
