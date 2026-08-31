import Link from "next/link";
import type { Metadata } from "next";
import { getDocs } from "@/lib/content";
import { Container, Section, ButtonLink, Badge } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Learn — financial privacy for India",
  description:
    "Short, plain-language lessons on Zcash and financial privacy, written for India.",
};

export default function LearnIndex() {
  const docs = getDocs("learn");
  return (
    <Section>
      <Container>
        <Badge tone="gold" className="mb-4">
          Learn
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">
          Financial privacy, explained for India
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          No jargon, no moon-speak. Start at the top and work down, or jump to
          what you need. Deep protocol docs link out to ZecHub.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {docs.map((d, i) => (
            <Link
              key={d.slug}
              href={`/learn/${d.slug}`}
              className="card group flex flex-col p-6 transition-colors hover:border-gold/50"
            >
              <div className="mb-2 flex items-center gap-2 text-sm text-muted">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs">
                  {i + 1}
                </span>
                {d.hindi && <span className="text-muted/60">{d.hindi}</span>}
              </div>
              <h2 className="text-xl font-semibold group-hover:text-gold">
                {d.title}
              </h2>
              {d.description && (
                <p className="mt-2 text-sm text-muted">{d.description}</p>
              )}
              <span className="mt-4 text-sm text-gold group-hover:underline">
                Read →
              </span>
            </Link>
          ))}
        </div>

        <div className="card mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold">Want the deep protocol docs?</h3>
            <p className="mt-1 text-muted">
              ZecHub covers ZIPs, network upgrades and cryptography in depth. We
              link out rather than rewrite them.
            </p>
          </div>
          <ButtonLink href={site.links.zechub} variant="ghost" external>
            Open ZecHub
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
