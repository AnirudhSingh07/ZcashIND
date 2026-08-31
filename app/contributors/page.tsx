import Link from "next/link";
import type { Metadata } from "next";
import { getContributors } from "@/lib/data";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contributors",
  description:
    "The people making Zcash India happen. Recognition is earned through impact, not automatic.",
};

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-14 w-14 rounded-full object-cover" />;
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-gold">
      {initials}
    </div>
  );
}

export default async function ContributorsPage() {
  const contributors = await getContributors();

  return (
    <Section>
      <Container>
        <Badge tone="gold" className="mb-4">
          Contributors
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">
          The people making it happen
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Contributors are recognised for consistent, real impact — hosting
          meetups, teaching newcomers, writing local content. It is{" "}
          <strong className="text-text">not automatic</strong>. Participation
          alone doesn't guarantee status. {site.voice.impact}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contributors.map((c) => (
            <Link
              key={c.id}
              href={`/contributors/${c.slug}`}
              className="card group flex items-start gap-4 p-6 transition-colors hover:border-gold/50"
            >
              <Avatar name={c.name} src={c.avatar} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold group-hover:text-gold">{c.name}</h2>
                  {c.official && <Badge tone="success">✓ Official</Badge>}
                </div>
                {c.city && <p className="text-sm text-muted">{c.city}</p>}
                {c.bio && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted/80">{c.bio}</p>
                )}
              </div>
            </Link>
          ))}
          {contributors.length === 0 && (
            <p className="text-muted">No contributors listed yet.</p>
          )}
        </div>

        <div className="card mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Want to be here?</h2>
            <p className="mt-1 text-muted">{site.voice.hcc}</p>
          </div>
          <ButtonLink href="/contribute">How to contribute</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
