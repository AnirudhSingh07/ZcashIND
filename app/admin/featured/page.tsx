import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addFeaturedPost,
  updateFeaturedPost,
  deleteFeaturedPost,
  moveFeaturedPost,
} from "@/app/actions/admin";
import { Container, Section } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Featured posts",
  robots: { index: false, follow: false },
};

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-gold";

const BANNERS: Record<string, { tone: "ok" | "err"; text: string }> = {
  added: { tone: "ok", text: "Post added." },
  saved: { tone: "ok", text: "Changes saved." },
  invalid: {
    tone: "err",
    text: "Need a title and a valid X post URL (…x.com/handle/status/123…).",
  },
  duplicate: { tone: "err", text: "That post is already featured." },
};

export default async function AdminFeatured({
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

  const posts = await prisma.featuredPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <Section className="py-8">
      <Container className="max-w-3xl">
        <AdminNav />
        <h1 className="text-2xl font-bold">Featured posts</h1>
        <p className="mt-2 text-muted">
          Hand-picked @ZcashIND posts spotlighted in the “Latest from @ZcashIND”
          section on the homepage and /events. Newest/top first. Independent of
          the aftermovies list.
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

        {/* Add a new post */}
        <form action={addFeaturedPost} className="card mt-6 p-5">
          <h2 className="text-sm font-semibold">Add a post</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted/70">
                X post URL
              </label>
              <input
                name="url"
                required
                placeholder="https://x.com/ZcashIND/status/1234567890"
                className={inputCls}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
                  Subtitle <span className="text-muted/40">(optional)</span>
                </label>
                <input
                  name="subtitle"
                  placeholder="Recap from the ground"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
          <button className="btn-gold mt-4 px-5 py-2 text-sm">
            Add featured post
          </button>
        </form>

        {/* Existing posts */}
        <div className="mt-6 space-y-3">
          {posts.length === 0 && (
            <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No featured posts yet. Until you add one, the site shows the
              built-in starter list from the config.
            </p>
          )}

          {posts.map((p, i) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start gap-3">
                {/* Reorder */}
                <div className="flex flex-none flex-col gap-1">
                  <form action={moveFeaturedPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button
                      className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30"
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveFeaturedPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button
                      className="btn-ghost px-2 py-0.5 text-xs disabled:opacity-30"
                      disabled={i === posts.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                </div>

                {/* Edit form */}
                <form action={updateFeaturedPost} className="min-w-0 flex-1">
                  <input type="hidden" name="id" value={p.id} />
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs text-gold hover:underline"
                  >
                    {p.url} ↗
                  </a>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      name="title"
                      defaultValue={p.title}
                      className={inputCls}
                    />
                    <input
                      name="subtitle"
                      defaultValue={p.subtitle ?? ""}
                      placeholder="Subtitle (optional)"
                      className={inputCls}
                    />
                  </div>
                  <button className="btn-ghost mt-2 px-4 py-1.5 text-sm">
                    Save
                  </button>
                </form>

                {/* Delete */}
                <form action={deleteFeaturedPost} className="flex-none">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    className="btn-ghost px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
