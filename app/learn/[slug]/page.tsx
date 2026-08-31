import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDoc, getDocs } from "@/lib/content";
import { Markdown } from "@/lib/markdown";
import { Container, Section } from "@/components/ui";

export function generateStaticParams() {
  return getDocs("learn").map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc("learn", slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.description };
}

export default async function LearnDoc({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc("learn", slug);
  if (!doc) notFound();

  const all = getDocs("learn");
  const idx = all.findIndex((d) => d.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <Section>
      <Container className="max-w-3xl">
        <Link href="/learn" className="text-sm text-gold hover:underline">
          ← All lessons
        </Link>
        <div className="mt-6 mb-2">
          <h1 className="text-3xl font-bold sm:text-4xl">{doc.title}</h1>
          {doc.hindi && (
            <p className="mt-1 text-lg text-muted/70">{doc.hindi}</p>
          )}
        </div>
        <div className="mt-8">
          <Markdown source={doc.body} />
        </div>

        <div className="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/learn/${prev.slug}`}
              className="card p-4 hover:border-gold/50"
            >
              <div className="text-xs text-muted/60">← Previous</div>
              <div className="font-medium">{prev.title}</div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/learn/${next.slug}`}
              className="card p-4 text-right hover:border-gold/50"
            >
              <div className="text-xs text-muted/60">Next →</div>
              <div className="font-medium">{next.title}</div>
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
