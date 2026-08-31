import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDoc, getNews } from "@/lib/content";
import { Markdown } from "@/lib/markdown";
import { formatDateIST } from "@/lib/utils";
import { Container, Section, Badge } from "@/components/ui";

export function generateStaticParams() {
  return getNews().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc("news", slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.description };
}

export default async function NewsPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc("news", slug);
  if (!doc) notFound();

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link href="/news" className="text-sm text-gold hover:underline">
          ← All news
        </Link>
        <div className="mt-6 flex items-center gap-3">
          {doc.tag && <Badge tone="gold">{doc.tag}</Badge>}
          {doc.date && (
            <span className="text-xs text-muted/60">
              {formatDateIST(doc.date)}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{doc.title}</h1>
        <div className="mt-8">
          <Markdown source={doc.body} />
        </div>
      </Container>
    </Section>
  );
}
