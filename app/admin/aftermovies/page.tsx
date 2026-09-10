import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCities } from "@/lib/data";
import {
  addAftermovie,
  updateAftermovie,
  deleteAftermovie,
  moveAftermovie,
} from "@/app/actions/admin";
import { Container, Section } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Aftermovies",
  robots: { index: false, follow: false },
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  added: { tone: "ok", text: "Aftermovie added." },
  saved: { tone: "ok", text: "Changes saved." },
  invalid: {
    tone: "err",
    text: "Need a title, an event label, and one source (link, embed, or an uploaded video ≤ 80 MB).",
  },
};

/** Short label describing where an aftermovie's video comes from. */
function sourceLabel(url: string | null, embed: string | null): string {
  if (embed) return "Embed snippet";
  if (!url) return "—";
  if (url.startsWith("/uploads/")) return "Uploaded file";
  if (/(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/.test(url)) return "X post";
  if (/youtu\.be|youtube\.com/.test(url)) return "YouTube";
  if (/vimeo\.com/.test(url)) return "Vimeo";
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return "Video file";
  return "Link";
}

export default async function AdminAftermovies({
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

  const [movies, cities] = await Promise.all([
    prisma.aftermovie.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getCities(),
  ]);
  const cityOptions = cities.map((c) => c.city);

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Aftermovies</h1>
        <p className="mt-2 text-muted">
          Event recap videos shown in the grid on /events. Add by pasting a link
          (X post, YouTube, Vimeo), pasting an embed snippet, or uploading a
          video file. Independent of the featured-posts list.
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

        {/* Add a new aftermovie */}
        <form action={addAftermovie} className="card mt-6 p-5">
          <h2 className="text-sm font-semibold">Add an aftermovie</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted/70">Title</label>
              <input
                name="title"
                required
                placeholder="Zcash Community Connect: Surat Edition"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted/70">
                Event label
              </label>
              <input
                name="event"
                required
                placeholder="Surat · Aftermovie"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted/70">
                City{" "}
                <span className="text-muted/40">
                  (shows on that city&apos;s map page)
                </span>
              </label>
              <input
                name="city"
                list="am-cities"
                placeholder="Surat"
                className={inputCls}
              />
              <datalist id="am-cities">
                {cityOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-line p-4">
            <p className="text-xs font-medium text-muted">
              Video source — provide ONE of the following:
            </p>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted/70">
                1. Link (X post, YouTube, Vimeo, or direct .mp4)
              </label>
              <input
                name="url"
                placeholder="https://x.com/ZcashIND/status/1234567890"
                className={inputCls}
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted/70">
                2. Or upload a video file{" "}
                <span className="text-muted/40">(mp4 / webm / mov, ≤ 80 MB)</span>
              </label>
              <input
                type="file"
                name="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-text"
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs text-muted/70">
                3. Or paste an embed snippet{" "}
                <span className="text-muted/40">(iframe / blockquote)</span>
              </label>
              <textarea
                name="embed"
                rows={2}
                placeholder='<blockquote class="twitter-tweet">…</blockquote>'
                className={inputCls}
              />
            </div>
            <p className="mt-2 text-xs text-muted/50">
              If more than one is filled, an uploaded file wins, then the link.
              Only paste embeds from sources you trust.
            </p>
          </div>

          <button className="btn-gold mt-4 px-5 py-2 text-sm">
            Add aftermovie
          </button>
        </form>

        {/* Existing aftermovies */}
        <div className="mt-6 space-y-3">
          {movies.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No aftermovies yet. Until you add one, /events shows the built-in
              starter list from the config.
            </p>
          )}

          {movies.map((m, i) => {
            const link = m.url && !m.url.startsWith("/uploads/") ? m.url : m.url ?? "";
            return (
              <div key={m.id} className="card p-5">
                <div className="flex items-start gap-3">
                  {/* Reorder */}
                  <div className="flex flex-none flex-col gap-1">
                    <form action={moveAftermovie}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button
                        className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30"
                        disabled={i === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={moveAftermovie}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button
                        className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30"
                        disabled={i === movies.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </form>
                  </div>

                  {/* Edit */}
                  <form action={updateAftermovie} className="min-w-0 flex-1">
                    <input type="hidden" name="id" value={m.id} />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
                        {sourceLabel(m.url, m.embed)}
                      </span>
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-gold hover:underline"
                        >
                          {link} ↗
                        </a>
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <input
                        name="title"
                        defaultValue={m.title}
                        placeholder="Title"
                        className={inputCls}
                      />
                      <input
                        name="event"
                        defaultValue={m.event}
                        placeholder="Event label"
                        className={inputCls}
                      />
                      <input
                        name="city"
                        defaultValue={m.city ?? ""}
                        list="am-cities"
                        placeholder="City"
                        className={inputCls}
                      />
                    </div>
                    <button className="btn-ghost mt-2 px-4 py-1.5 text-sm">
                      Save
                    </button>
                  </form>

                  {/* Delete */}
                  <form action={deleteAftermovie} className="flex-none">
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      className="btn-ghost px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
