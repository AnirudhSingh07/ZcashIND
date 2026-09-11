import type { Metadata } from "next";
import { site } from "@/config/site";
import { team } from "@/config/team";
import { siteStats } from "@/config/stats";
import { getCounters } from "@/lib/data";
import { Container, Section, Badge, ButtonLink, Stat } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Who Zcash India is, what we're trying to do, and the team behind it.",
};

function Initials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-bright/20 text-lg font-bold text-gold">
      {initials}
    </div>
  );
}

export default async function AboutPage() {
  const counters = await getCounters();
  return (
    <Section>
      <Container className="max-w-4xl">
        <Badge tone="gold" className="mb-4">
          About
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Zcash India</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{site.tagline}</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={counters.citiesLit} label="Cities reached" accent />
          <Stat value={siteStats.totalIrlAttendees.toLocaleString("en-IN")} label="People at IRL events" accent />
          <Stat value={`${siteStats.walletsCreated}+`} label="Wallets created at events" />
          <Stat value={counters.eventsHosted} label="Events since Feb 2026" />
        </div>

        <div className="prose mt-10">
          <p>
            Zcash India is the India front door for Zcash: a grassroots community of people who care about
            financial privacy. We are not the Zcash Foundation, not Electric Coin Co., and not an exchange.
            We're organisers, hosts, students, freelancers and merchants who want more people in India to
            understand and use private money.
          </p>

          <h2>What we do</h2>
          <ul>
            <li>
              <strong>Teach.</strong> Plain-language lessons on what shielded money is and how to get a
              wallet.
            </li>
            <li>
              <strong>Gather.</strong> Campus editions with hundreds of students, a monthly online Live
              series, developer workshops, and small IRL meetups across Indian cities.
            </li>
            <li>
              <strong>Map.</strong> A living map of where Zcash India is showing up, one verified meetup at a
              time.
            </li>
            <li>
              <strong>Build.</strong> Infrastructure like an independent lightwalletd node in Mumbai, Hindi
              localisation for the Zodl wallet, and merchants onboarded to ZecMap.
            </li>
          </ul>

          <h2>What we believe</h2>
          <blockquote>{site.voice.impact}</blockquote>
          <p>
            We're not looking for influencers or big vanity numbers. We're looking for real conversations in
            real rooms. One city gaining its first host matters more than a viral post.
          </p>

          <h2>How we're funded</h2>
          <p>
            Zcash India started in February {siteStats.since} with one follower on X and five people on
            Telegram. Activities like the bounties and campus editions are supported by community grants and
            contributions. We keep things small, transparent and local, and we publish our numbers on the
            Zcash community forum.
          </p>
        </div>

        {/* Team */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold">The team</h2>
          <p className="mt-1 max-w-2xl text-muted">
            Five people run the day-to-day. Everyone else you see hosting, filming and writing is a
            community contributor.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {team.map((m) => (
              <div key={m.name} className="card flex items-start gap-4 p-6">
                <Initials name={m.name} />
                <div className="min-w-0">
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm text-gold">{m.role}</p>
                  <p className="mt-2 text-sm text-muted">{m.bio}</p>
                  {m.xHandle && (
                    <a
                      href={`https://x.com/${m.xHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-muted hover:text-gold"
                    >
                      @{m.xHandle} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/contribute">Get involved</ButtonLink>
          <ButtonLink href="/contributors" variant="ghost">
            Meet the contributors
          </ButtonLink>
          <ButtonLink href={site.links.telegram} variant="ghost" external>
            Join Telegram
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
