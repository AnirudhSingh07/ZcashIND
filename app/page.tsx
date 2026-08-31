import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { media } from "@/config/media";
import { lumaEvents, lumaUrl } from "@/config/luma-events";
import {
  getCounters,
  getCities,
  getMapPins,
  cityToSlug,
} from "@/lib/data";
import { getNews } from "@/lib/content";
import { formatDateIST, formatIST } from "@/lib/utils";
import {
  Container,
  Section,
  SectionHeading,
  ButtonLink,
  Stat,
  Badge,
} from "@/components/ui";
import { MeetupMap } from "@/components/map/meetup-map";
import { IndiaMap } from "@/components/india-map";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
};

export default async function HomePage() {
  const [counters, cities, pins] = await Promise.all([
    getCounters(),
    getCities(),
    getMapPins(),
  ]);
  const recentEvents = lumaEvents.slice(0, 3);
  const news = getNews().slice(0, 2);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        {/* India map backdrop */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <IndiaMap
            variant="outline"
            className="absolute -right-16 top-1/2 h-[130%] -translate-y-1/2 opacity-[0.18] sm:right-0 lg:opacity-25"
          />
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-gold/10 blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-transparent" />
        </div>

        <Container className="relative">
          <div className="max-w-2xl py-20 sm:py-28">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone="gold">🇮🇳 Official community</Badge>
              <Badge tone="muted">Since 2026 · 6 cities</Badge>
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-6xl">
              The home of <span className="text-gold">Zcash</span> in India.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              A grassroots community learning financial privacy together — real
              meetups on real campuses, an online Live series, and a growing map
              of cities. {site.voice.oneAtATime}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={site.links.telegram} external>
                Join the community
              </ButtonLink>
              <ButtonLink href="/learn/start-here" variant="ghost">
                Start here
              </ButtonLink>
              <ButtonLink href="/map" variant="ghost">
                See the map
              </ButtonLink>
            </div>

            {/* Social proof row */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span>Find us on</span>
              <a href={site.links.x} target="_blank" rel="noopener noreferrer" className="hover:text-gold">X / Twitter</a>
              <a href={site.links.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Telegram</a>
              <a href={site.links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Instagram</a>
              <a href={site.links.forum} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Forum</a>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- Live stats ---------- */}
      <Container className="relative -mt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={counters.citiesLit} label="Cities across India" accent />
          <Stat value={counters.eventsHosted} label="Events hosted" accent />
          <Stat value={counters.onlineSessions} label="Online sessions" />
          <Stat value="1,500+" label="Community on X" />
        </div>
      </Container>

      {/* ---------- Start in 15 minutes ---------- */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="New to Zcash?"
            title="Start in 15 minutes"
            sub="No jargon. No wallet connect. We never ask for your seed."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Understand shielded money",
                d: "Two minutes on what Zcash protects — who can see a payment and who can't.",
                href: "/learn/what-is-zcash",
              },
              {
                n: "2",
                t: "Get a shielded wallet",
                d: "Install Zashi or Zingo from an official source and back up your seed.",
                href: "/learn/wallets",
              },
              {
                n: "3",
                t: "Join the community",
                d: "Say hi on Telegram, find the next event, or host your own.",
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

      {/* ---------- Recent events ---------- */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="Events"
            title="What we've been up to"
            sub="Campus editions, community connects and our online Live series — all on Luma."
            cta={
              <ButtonLink href="/events" variant="ghost">
                All events
              </ButtonLink>
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {recentEvents.map((e) => (
              <a
                key={e.slug}
                href={lumaUrl(e.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="card group flex flex-col p-6 transition-colors hover:border-gold/50"
              >
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>{e.isOnline ? "🖥️" : "📍"}</span>
                  <span>{e.isOnline ? "Online" : e.city}</span>
                </div>
                <h3 className="mt-2 font-semibold leading-snug group-hover:text-gold">
                  {e.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{formatIST(e.startsAt)}</p>
                <span className="mt-auto pt-4 text-sm text-gold group-hover:underline">
                  View on Luma ↗
                </span>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- Map preview ---------- */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="The map"
            title="Zcash India across the country"
            sub="Every city where we've shown up — and space for yours."
            cta={
              <ButtonLink href="/map" variant="ghost">
                Open full map
              </ButtonLink>
            }
          />
          <div className="card h-[400px] overflow-hidden">
            <MeetupMap meetups={pins} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.city}
                href={`/map/${cityToSlug(c.city)}`}
                className="card-2 rounded-full px-4 py-1.5 text-sm hover:border-gold/50"
              >
                📍 {c.city}
              </Link>
            ))}
            <Link
              href="/host"
              className="rounded-full border border-dashed border-gold/50 px-4 py-1.5 text-sm text-gold hover:bg-gold/10"
            >
              + Your city
            </Link>
          </div>
        </Container>
      </Section>

      {/* ---------- Aftermovies teaser ---------- */}
      <Section className="py-8">
        <Container>
          <div className="card relative overflow-hidden border-gold/30 p-8 sm:p-10">
            <IndiaMap
              variant="dotted"
              className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-10"
            />
            <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <Badge tone="gold" className="mb-3">
                  Aftermovies
                </Badge>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Relive every meetup
                </h2>
                <p className="mt-2 max-w-lg text-muted">
                  Recap videos from Surat, Ahmedabad, Bhopal, Vadodara, Udaipur
                  and Indore — straight from our X.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/events">Watch recaps</ButtonLink>
                <ButtonLink href={media.xUrl} variant="ghost" external>
                  Follow @{media.xHandle}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- Learn ---------- */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="Learn"
            title="Financial privacy, explained for India"
            cta={
              <ButtonLink href="/learn" variant="ghost">
                All lessons
              </ButtonLink>
            }
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

      {/* ---------- Community ---------- */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="Community"
            title="Come build with us"
            sub={site.voice.hcc}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Telegram", href: site.links.telegram, emoji: "💬", desc: "The main hub. Start here." },
              { label: "X / Twitter", href: site.links.x, emoji: "𝕏", desc: "Announcements & aftermovies." },
              { label: "Instagram", href: site.links.instagram, emoji: "📸", desc: "Photos from the ground." },
              { label: "Forum", href: site.links.forum, emoji: "🗣️", desc: "Planning & long-form." },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card group p-6 transition-colors hover:border-gold/50"
              >
                <div className="text-2xl">{c.emoji}</div>
                <h3 className="mt-2 font-semibold group-hover:text-gold">
                  {c.label} ↗
                </h3>
                <p className="mt-1 text-sm text-muted">{c.desc}</p>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- Latest news ---------- */}
      {news.length > 0 && (
        <Section className="py-8">
          <Container>
            <SectionHeading
              eyebrow="News"
              title="Latest from Zcash India"
              cta={
                <ButtonLink href="/news" variant="ghost">
                  All news
                </ButtonLink>
              }
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

      {/* ---------- Closing CTA ---------- */}
      <Section className="pb-20 pt-8">
        <Container>
          <div className="card relative overflow-hidden border-gold/40 bg-gold/5 p-8 text-center sm:p-14">
            <IndiaMap
              variant="fill"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[160%] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
            />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">
                {site.voice.putCityOnMap}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted">
                Host a meetup, write local how-tos, help newcomers. {site.voice.becomeContributor}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/host">Get the host kit</ButtonLink>
                <ButtonLink href="/contribute" variant="ghost">
                  How to contribute
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
