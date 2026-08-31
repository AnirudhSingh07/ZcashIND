import type { Metadata } from "next";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Who Zcash India is, and what we're trying to do.",
};

export default function AboutPage() {
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          About
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Zcash India</h1>
        <p className="mt-4 text-lg text-muted">{site.tagline}</p>

        <div className="prose mt-8">
          <p>
            Zcash India is the India front door for Zcash — a grassroots
            community of people who care about financial privacy. We are not the
            Zcash Foundation, not Electric Coin Co., and not an exchange. We're
            organisers, hosts, students, freelancers and merchants who want more
            people in India to understand and use private money.
          </p>

          <h2>What we do</h2>
          <ul>
            <li>
              <strong>Teach.</strong> Plain-language lessons on what shielded
              money is and how to get a wallet.
            </li>
            <li>
              <strong>Gather.</strong> Official events and small IRL meetups
              across Indian cities.
            </li>
            <li>
              <strong>Map.</strong> A living map of where Zcash India is showing
              up, one verified meetup at a time.
            </li>
          </ul>

          <h2>What we believe</h2>
          <blockquote>{site.voice.impact}</blockquote>
          <p>
            We're not looking for influencers or big vanity numbers. We're
            looking for real conversations in real rooms. One city gaining its
            first host matters more than a viral post.
          </p>

          <h2>How we're funded</h2>
          <p>
            Activities like the IRL bounty are supported by community grants and
            contributions. We keep things small, transparent and local.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/contribute">Get involved</ButtonLink>
          <ButtonLink href={site.links.telegram} variant="ghost" external>
            Join Telegram
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
