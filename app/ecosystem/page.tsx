import type { Metadata } from "next";
import { ecosystem } from "@/config/ecosystem";
import { Container, Section, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ecosystem",
  description:
    "The Zcash ecosystem for India — protocol, local activity, tools and governance.",
};

function EcoCard({ title, blurb, links }: (typeof ecosystem.columns)[number]) {
  return (
    <div className="card flex flex-col p-6">
      <h2 className="text-lg font-semibold text-gold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
      <ul className="mt-4 space-y-3">
        {links.map((l) => {
          const external = l.href.startsWith("http");
          return (
            <li key={l.label}>
              <a
                href={l.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="font-medium hover:text-gold"
              >
                {l.label} ↗
              </a>
              {l.note && (
                <p className="text-xs text-muted/70">{l.note}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function EcosystemPage() {
  return (
    <Section>
      <Container>
        <Badge tone="gold" className="mb-4">
          Ecosystem
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">The Zcash ecosystem</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Everything worth knowing, in four columns: the protocol, what's
          happening in India, the tools you can use today, and how the community
          governs itself.
        </p>

        {/* This month */}
        <div className="card mt-10 border-gold/40 bg-gold/5 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
            This month
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {ecosystem.thisMonth.map((l) => {
              const external = l.href.startsWith("http");
              return (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="font-medium hover:text-gold"
                  >
                    {l.label} →
                  </a>
                  {l.note && <p className="text-xs text-muted/70">{l.note}</p>}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ecosystem.columns.map((c) => (
            <EcoCard key={c.title} {...c} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
