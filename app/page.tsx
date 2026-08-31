import Link from "next/link";
import { site } from "@/config/site";
import {
  getCounters,
  getCities,
  getVerifiedByKind,
  getNextOfficialEvent,
  cityToSlug,
} from "@/lib/data";
import { getNews } from "@/lib/content";
import { formatIST, formatDateIST } from "@/lib/utils";
import { Container, Section, SectionHeading, ButtonLink, Stat, Badge } from "@/components/ui";
import { MeetupCard } from "@/components/meetup-card";
import { MeetupMap } from "@/components/map/meetup-map";

export default async function HomePage() {
  const [counters, cities, irl, nextEvent] = await Promise.all([
    getCounters(),
    getCities(),
    getVerifiedByKind("irl_bounty"),
    getNextOfficialEvent(),
  ]);
  const news = getNews().slice(0, 2);
  const mapMeetups = [...irl, ...(await getVerifiedByKind("official_event"))];

  return (
    <>
      {/* Hero */}
      <Section className="pt-16 pb-8 sm:pt-24">
        <Container>
          <div className="max-w-3xl">
            <Badge tone="gold" className="mb-5">
              🇮🇳 The India front door for Zcash
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] sm:text-6xl">
              Learn financial privacy.
              <br />
              Find the next meetup.
              <br />
              <span className="text-gold">Put your city on the map.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Zcash India is a grassroots community. We teach shielded money in
              plain language, run real IRL meetups, and help you host one in your
              city. {site.voice.oneAtATime}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/learn/start-here">Start here</ButtonLink>
              <ButtonLink href="/map" variant="ghost">
                See the map
              </ButtonLink>
              <ButtonLink href={site.links.telegram} variant="ghost" external>
                Join Telegram
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Next official event strip */}
      {nextEvent && (
        <Container>
          <Link
            href="/events"
            className="card flex flex-col items-start justify-between gap-3 border-gold/40 bg-gold/5 p-5 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎪</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                  Next official event
                </p>
                <p className="font-semibold">
                  {nextEvent.title} · {nextEvent.city}
                </p>
                <p className="text-sm text-muted">{formatIST(nextEvent.startsAt)}</p>
              </div>
            </div>
            <span className="btn-ghost px-4 py-2 text-sm">View events →</span>
          </Link>
        </Container>
      )}

      {/* IRL bounty band with counters */}
      <Section className="py-12">
        <Container>
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-lg">
                <Badge tone="success" className="mb-3">
                  IRL Meetup Bounty · September 2026
                </Badge>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {site.voice.putCityOnMap}
                </h2>
                <p className="mt-2 text-muted">
                  Host a mini-meetup, get it verified, and light up your city.{" "}
                  {site.voice.impact} {site.voice.notInfluencers}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href="/bounties/irl">See the bounty</ButtonLink>
                  <ButtonLink href="/bounties/irl/submit" variant="ghost">
                    Add your meetup
                  </ButtonLink>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat value={counters.citiesLit} label="Cities lit" accent />
                <Stat value={counters.meetupsVerified} label="Meetups verified" accent />
                <Stat value={counters.peopleNew} label="New to Zcash" accent />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Mini map */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="The map"
            title="Zcash India IRL Map"
            sub="Every gold pin is a real, verified meetup. Tap one to read the story."
            cta={<ButtonLink href="/map" variant="ghost">Open full map</ButtonLink>}
          />
          <div className="card h-[380px] overflow-hidden">
            <MeetupMap meetups={mapMeetups} />
          </div>
        </Container>
      </Section>

      {/* Start in 15 minutes */}
      <Section className="py-12">
        <Container>
          <SectionHeading
            eyebrow="New here?"
            title="Start in 15 minutes"
            sub="Three steps. No jargon. No wallet connect. We never ask for your seed."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Understand shielded money",
                d: "Two minutes on what Zcash actually protects — who can see a payment and who can't.",
                href: "/learn/what-is-zcash",
              },
              {
                n: "2",
                t: "Get a shielded wallet",
                d: "Install Zashi or Zingo from an official source. Back up your seed. That's it.",
                href: "/learn/wallets",
              },
              {
                n: "3",
                t: "Join the community",
                d: "Say hi on Telegram, find the next meetup, or host your own.",
                href: site.links.telegram,
              },
            ].map((s) => (
              <Link
                key={s.n}
                href={s.href}
                className="card group p-6 transition-colors hover:border-gold/50"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gold font-bold text-bg">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted">{s.d}</p>
                <span className="mt-3 inline-block text-sm text-gold group-hover:underline">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3 learn cards */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="Learn"
            title="Financial privacy, explained for India"
            cta={<ButtonLink href="/learn" variant="ghost">All lessons</ButtonLink>}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                t: "What is Zcash?",
                d: "Digital cash with real privacy. Shielded by default when you choose it.",
                href: "/learn/what-is-zcash",
              },
              {
                t: "Shielded vs transparent",
                d: "Who can see a payment, and how unified addresses keep you private.",
                href: "/learn/shielded-vs-transparent",
              },
              {
                t: "Why privacy in India",
                d: "Remittances, freelancers, students, merchants — privacy is normal.",
                href: "/learn/privacy-in-india",
              },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="card group p-6 transition-colors hover:border-gold/50"
              >
                <h3 className="font-semibold text-gold">{c.t}</h3>
                <p className="mt-2 text-sm text-muted">{c.d}</p>
                <span className="mt-3 inline-block text-sm text-gold group-hover:underline">
                  Read →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Latest IRL cards */}
      {irl.length > 0 && (
        <Section className="py-8">
          <Container>
            <SectionHeading
              eyebrow="From the ground"
              title="Latest IRL meetups"
              cta={<ButtonLink href="/map" variant="ghost">See all pins</ButtonLink>}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {irl.slice(0, 3).map((m) => (
                <MeetupCard key={m.id} m={m} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Cities grid */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="Cities"
            title="Where Zcash India is showing up"
            sub="Don't see your city? It just needs a host."
          />
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.city}
                href={`/map/${cityToSlug(c.city)}`}
                className="card-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm hover:border-gold/50"
              >
                <span>📍 {c.city}</span>
                {c.newCity && <Badge tone="success">🌱</Badge>}
                <span className="text-muted/60">
                  {c.nodeCount > 0 ? `${c.nodeCount} node${c.nodeCount > 1 ? "s" : ""}` : "official"}
                </span>
              </Link>
            ))}
            <Link
              href="/host"
              className="rounded-full border border-dashed border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10"
            >
              + Host in your city
            </Link>
          </div>
        </Container>
      </Section>

      {/* Pay with ZEC teaser */}
      <Section className="py-8">
        <Container>
          <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-semibold">Pay with ZEC in India</h3>
              <p className="mt-1 max-w-xl text-muted">
                Merchants across India already accept Zcash. Find them — and add
                your own — on ZecMap. We don't run a second merchant database.
              </p>
            </div>
            <ButtonLink href="/pay" variant="ghost">
              How paying works
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* Latest news */}
      {news.length > 0 && (
        <Section className="py-8">
          <Container>
            <SectionHeading
              eyebrow="News"
              title="Latest from Zcash India"
              cta={<ButtonLink href="/news" variant="ghost">All news</ButtonLink>}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {news.map((n) => (
                <Link
                  key={n.slug}
                  href={`/news/${n.slug}`}
                  className="card group p-6 transition-colors hover:border-gold/50"
                >
                  {n.tag && <Badge tone="gold">{n.tag}</Badge>}
                  <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">
                    {n.title}
                  </h3>
                  {n.description && (
                    <p className="mt-2 text-sm text-muted">{n.description}</p>
                  )}
                  {n.date && (
                    <p className="mt-3 text-xs text-muted/60">
                      {formatDateIST(n.date)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Contribute CTA */}
      <Section className="pb-20 pt-8">
        <Container>
          <div className="card border-gold/40 bg-gold/5 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {site.voice.becomeContributor}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              {site.voice.hcc} Host meetups, write local how-tos, help newcomers.
              Participation alone doesn't guarantee status — impact does.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contribute">How to contribute</ButtonLink>
              <ButtonLink href="/host" variant="ghost">
                Get the host kit
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
