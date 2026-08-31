import Link from "next/link";
import type { Metadata } from "next";
import { getNews } from "@/lib/content";
import { formatDateIST } from "@/lib/utils";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "News",
  description: "Recaps and announcements from Zcash India.",
};

export default function NewsPage() {
  const news = getNews();
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          News
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">From Zcash India</h1>
        <p className="mt-4 text-lg text-muted">
          Regional recaps, local how-tos, and community announcements.
        </p>

        <div className="mt-10 space-y-4">
          {news.map((n) => (
            <Link
              key={n.slug}
              href={`/news/${n.slug}`}
              className="card group block p-6 transition-colors hover:border-gold/50"
            >
              <div className="flex items-center gap-3">
                {n.tag && <Badge tone="gold">{n.tag}</Badge>}
                {n.date && (
                  <span className="text-xs text-muted/60">
                    {formatDateIST(n.date)}
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-xl font-semibold group-hover:text-gold">
                {n.title}
              </h2>
              {n.description && (
                <p className="mt-2 text-muted">{n.description}</p>
              )}
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
