import type { Metadata } from "next";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Host meetups, write local how-tos, help newcomers. Become a Zcash India Contributor.",
};

const WAYS = [
  {
    t: "Host a meetup",
    d: "The highest-impact thing you can do. Four people, one real conversation. Grab the host kit and put your city on the map.",
    href: "/host",
    cta: "Get the host kit",
  },
  {
    t: "Write local content",
    d: "Regional recaps, how-tos in your language, notes for your city. Coordinate with us on Telegram.",
    href: site.links.telegram,
    cta: "Join Telegram",
    external: true,
  },
  {
    t: "Help newcomers",
    d: "Answer questions in Telegram. Walk someone through their first wallet. Patience is a contribution.",
    href: site.links.telegram,
    cta: "Join Telegram",
    external: true,
  },
  {
    t: "Submit to the bounty",
    d: "Run an IRL meetup during the bounty window and submit it for review. Verified meetups earn a spot on the map.",
    href: "/bounties/irl",
    cta: "See the bounty",
  },
];

export default function ContributePage() {
  return (
    <Section>
      <Container className="max-w-4xl">
        <Badge tone="gold" className="mb-4">
          Contribute
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">
          {site.voice.becomeContributor}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          {site.voice.hcc} There are many ways to help, and none of them require
          you to be an expert or an influencer. {site.voice.impact}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {WAYS.map((w) => (
            <div key={w.t} className="card flex flex-col p-6">
              <h2 className="text-lg font-semibold text-gold">{w.t}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{w.d}</p>
              <div className="mt-4">
                <ButtonLink href={w.href} variant="ghost" external={w.external}>
                  {w.cta}
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>

        <div className="card mt-8 border-gold/40 bg-gold/5 p-6">
          <h2 className="text-lg font-semibold">Becoming a Contributor</h2>
          <p className="mt-2 text-muted">
            Consistent, real impact can lead to recognised{" "}
            <a href="/contributors" className="text-gold hover:underline">
              Contributor
            </a>{" "}
            status — with perks like merch, a map feature, a certificate and
            co-hosting opportunities. It is <strong>not automatic</strong>.
            Participation alone doesn't guarantee it. We look at impact, not
            numbers.
          </p>
        </div>
      </Container>
    </Section>
  );
}
