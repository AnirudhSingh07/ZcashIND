import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addUpdate, updateUpdate, deleteUpdate } from "@/app/actions/admin";
import { Container, Section, Badge } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Updates",
  robots: { index: false, follow: false },
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";
const labelCls = "mb-1 block text-xs text-muted/70";

const TAGS = ["Announcement", "Milestone", "Event", "Partnership", "Recap", "Shoutout"];

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  added: { tone: "ok", text: "Update posted." },
  saved: { tone: "ok", text: "Changes saved." },
  invalid: {
    tone: "err",
    text: "Paste a valid X post link (…x.com/handle/status/123…) or add a title/note.",
  },
};

function fmt(d: Date) {
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });
}

export default async function AdminUpdates({
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

  const updates = await prisma.update.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Updates &amp; What&apos;s New</h1>
        <p className="mt-2 text-muted">
          Post updates to the /updates feed. Usually you just paste an X post
          link. Add an optional title/note and tag for context.
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

        {/* Add — the star of the show */}
        <form
          action={addUpdate}
          className="relative mt-6 overflow-hidden rounded-[var(--radius-card)] border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-bg p-5 sm:p-6"
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold-bright/15 blur-[70px]" />
          <div className="relative">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden>𝕏</span> Post an update
            </h2>

            <div className="mt-3">
              <label className={labelCls}>X post link</label>
              <input
                name="xUrl"
                placeholder="https://x.com/ZcashIND/status/1234567890"
                className={`${inputCls} border-gold/30`}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
              <div>
                <label className={labelCls}>Title <span className="text-muted/40">(optional)</span></label>
                <input name="title" placeholder="We hit 1,500 on X 🎉" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tag <span className="text-muted/40">(optional)</span></label>
                <input name="tag" list="update-tags" placeholder="Milestone" className={inputCls} />
                <datalist id="update-tags">
                  {TAGS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Note <span className="text-muted/40">(optional)</span></label>
              <textarea
                name="body"
                rows={2}
                placeholder="A short line of context to show above the post."
                className={inputCls}
              />
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="pinned" className="h-4 w-4" />
              📌 Pin to the top
            </label>

            <button className="btn-gold mt-4 px-5 py-2 text-sm">Post update</button>
          </div>
        </form>

        {/* Existing */}
        <div className="mt-6 space-y-3">
          {updates.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No updates yet. Paste an X link above to post your first one.
            </p>
          )}

          {updates.map((u) => (
            <form key={u.id} action={updateUpdate} className="card p-5">
              <input type="hidden" name="id" value={u.id} />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {u.pinned && <Badge tone="gold">📌 Pinned</Badge>}
                  {u.tag && (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
                      {u.tag}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted/60">{fmt(u.createdAt)}</span>
              </div>

              {u.xUrl && (
                <a
                  href={u.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block truncate text-xs text-gold hover:underline"
                >
                  {u.xUrl} ↗
                </a>
              )}

              <div className="mt-2 grid gap-2">
                <input name="xUrl" defaultValue={u.xUrl ?? ""} placeholder="X post link" className={inputCls} />
                <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
                  <input name="title" defaultValue={u.title ?? ""} placeholder="Title" className={inputCls} />
                  <input name="tag" defaultValue={u.tag ?? ""} list="update-tags" placeholder="Tag" className={inputCls} />
                </div>
                <textarea name="body" rows={2} defaultValue={u.body ?? ""} placeholder="Note" className={inputCls} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="pinned" defaultChecked={u.pinned} className="h-4 w-4" />
                  Pinned
                </label>
                <button className="btn-gold px-4 py-1.5 text-sm">Save</button>
                <button
                  formAction={deleteUpdate}
                  className="btn-ghost px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </Container>
    </Section>
  );
}
