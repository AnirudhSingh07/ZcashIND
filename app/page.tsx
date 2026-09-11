import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/config/site";
import { media } from "@/config/media";
import { siteStats, roundedPlus } from "@/config/stats";
import { lumaUrl } from "@/config/luma-events";
import {
  getCounters,
  getCities,
  cityToSlug,
  getFeaturedPosts,
  getLumaEvents,
  getUpdates,
  getBounties,
} from "@/lib/data";
import { formatDateIST, formatIST } from "@/lib/utils";
import {
  Container,
  Section,
  SectionHeading,
  ButtonLink,
  Stat,
  Badge,
} from "@/components/ui";
import { IndiaMap } from "@/components/india-map";
import { XTimeline } from "@/components/social/x-timeline";
import { YouTubeVideos } from "@/components/social/youtube-videos";
import { getYouTubeVideos } from "@/lib/youtube";
import { getZecPrice } from "@/lib/zec-price";
import { ZecHiker } from "@/components/zec-hiker";

export const metadata: Metadata = {
  title: `${site.name}: ${site.tagline}`,
  description: site.description,
};

export default async function HomePage() {
  const [counters, cities, featuredPosts, lumaEvents, youtubeVideos, updates, bounties, zec] =
    await Promise.all([
      getCounters(),
      getCities(),
      getFeaturedPosts(),
      getLumaEvents(),
      getYouTubeVideos(3),
      getUpdates(),
      getBounties(),
      getZecPrice(),
    ]);
  const recentUpdates = updates.slice(0, 3);
  const recentEvents = lumaEvents.slice(0, 3);
  const openBounties = bounties.filter((b) => b.status === "active");
  const cityNames = cities.map((c) => c.city);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-gold-bright/15 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-gold-bright/10 blur-[120px]" />
        </div>

        <Container className="relative">
          <div className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(300px,460px)] lg:gap-12 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge tone="gold">🇮🇳 Official community</Badge>
                <Badge tone="muted">
                  Since {siteStats.since} · {counters.citiesLit} {counters.citiesLit === 1 ? "city" : "cities"}
                </Badge>
              </div>
              <h1 className="display text-5xl leading-[0.98] sm:text-7xl">
                The home of <span className="text-gold">Zcash</span> in India.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted">
                A grassroots community learning financial privacy together: real
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

              {/* ZEC Live prize callout */}
              <Link
                href="/events"
                className="mt-6 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold-bright/10 py-2 pl-3 pr-4 text-sm transition-colors hover:bg-gold-bright/20"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-bright px-2.5 py-0.5 text-xs font-bold text-text">
                  🏆 ZEC Live
                </span>
                <span className="text-text">
                  Win <strong className="font-semibold">real ZEC</strong> at our
                  online Live sessions
                </span>
                <span className="text-gold" aria-hidden="true">
                  →
                </span>
              </Link>

              {/* Social proof row */}
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
                <span>Find us on</span>
                <a href={site.links.x} target="_blank" rel="noopener noreferrer" className="hover:text-gold">X / Twitter</a>
                <a href={site.links.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Telegram</a>
                <a href={site.links.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold">Instagram</a>
              </div>
            </div>

            {/* ZEC hiker: the price, drawn as a climb */}
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <ZecHiker
                price={zec?.price ?? null}
                change24h={zec?.change24h ?? null}
                priceMin={site.zecHiker.priceMin}
                priceMax={site.zecHiker.priceMax}
              />
              <p className="mt-2 text-center text-xs text-muted/60 lg:text-right">
                ZEC price, live every 20 seconds. Up means climbing, down means a slip, flat means
                anchors and rope checks.
              </p>
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
          <Stat value={roundedPlus(siteStats.xFollowers)} label="Community on X" />
        </div>
      </Container>

      {/* ---------- Open bounties ---------- */}
      {openBounties.length > 0 && (
        <Container className="mt-6">
          <div className="card flex flex-col gap-3 border-gold/40 p-4 sm:flex-row sm:items-center sm:gap-6">
            <Badge tone="success" className="shrink-0">
              ● {openBounties.length} {openBounties.length === 1 ? "bounty" : "bounties"} open
            </Badge>
            <div className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-1 text-sm">
              {openBounties.map((b) => (
                <Link
                  key={b.id}
                  href={b.kind === "irl_meetup" && b.active ? "/bounties/irl" : `/bounties/${b.slug}`}
                  className="hover:text-gold"
                >
                  <span className="font-medium">{b.title}</span>
                  <span className="text-muted"> · ${b.prizePoolUsd} in ZEC</span>
                </Link>
              ))}
            </div>
            <Link href="/bounties" className="shrink-0 text-sm text-gold hover:underline">
              All bounties
            </Link>
          </div>
        </Container>
      )}

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
                d: "Two minutes on what Zcash protects: who can see a payment and who can't.",
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
            sub="Campus editions, community connects and our online Live series, all on Luma."
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
                {e.attendees && (
                  <p className="mt-1 text-sm text-muted">👥 {e.attendees}{e.series === "irl" ? " students" : " attendees"}</p>
                )}
                <span className="mt-auto pt-4 text-sm text-gold group-hover:underline">
                  View on Luma ↗
                </span>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- Cities we've reached ---------- */}
      <Section className="py-8">
        <Container>
          <div className="card relative overflow-hidden p-6 sm:p-8">
            <IndiaMap
              variant="outline"
              className="pointer-events-none absolute -right-8 top-1/2 hidden h-[150%] -translate-y-1/2 opacity-15 sm:block"
            />
            <div className="relative">
              <SectionHeading
                eyebrow="Across India"
                title="Cities we've reached"
                sub="Campus editions and community connects, with space for yours."
                cta={
                  <ButtonLink href="/map" variant="ghost">
                    Open the map
                  </ButtonLink>
                }
              />
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {cities.map((c) => (
                  <Link
                    key={c.city}
                    href={`/map/${cityToSlug(c.city)}`}
                    className="card-2 group flex items-center justify-between p-4 transition-colors hover:border-gold/50"
                  >
                    <span className="font-medium">📍 {c.city}</span>
                    <span className="text-xs text-muted/70 group-hover:text-gold">
                      {c.meetups.length}
                      {c.meetups.length === 1 ? " event" : " events"}
                    </span>
                  </Link>
                ))}
                <Link
                  href="/host"
                  className="flex items-center justify-center rounded-[var(--radius-card)] border border-dashed border-gold/50 p-4 text-sm text-gold hover:bg-gold/10"
                >
                  + Your city
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- Latest from X ---------- */}
      <Section className="py-8">
        <Container>
          <SectionHeading
            eyebrow="On X"
            title={`Latest from @${media.xHandle}`}
            sub="Announcements, recap videos and moments from the ground, live from our feed."
            cta={
              <ButtonLink href={media.xUrl} variant="ghost" external>
                Follow @{media.xHandle}
              </ButtonLink>
            }
          />
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_400px]">
            {/* Aftermovies teaser */}
            <div className="card relative flex h-full flex-col justify-center overflow-hidden border-gold/30 p-8 sm:p-10">
              <IndiaMap
                variant="dotted"
                className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 opacity-10"
              />
              <div className="relative">
                <Badge tone="gold" className="mb-3">
                  Aftermovies
                </Badge>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Relive every meetup
                </h2>
                <p className="mt-2 max-w-lg text-muted">
                  Recap videos from{" "}
                  {cityNames.length > 1
                    ? `${cityNames.slice(0, -1).join(", ")} and ${cityNames[cityNames.length - 1]}`
                    : cityNames[0] ?? "every city"}
                  , straight from our X.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/events">Watch recaps</ButtonLink>
                  <ButtonLink href={media.xUrl} variant="ghost" external>
                    Follow @{media.xHandle}
                  </ButtonLink>
                </div>
              </div>
            </div>

            {/* Live @handle timeline (with graceful fallback to recent posts) */}
            <XTimeline
              handle={media.xHandle}
              height={560}
              fallbackPosts={featuredPosts}
            />
          </div>
        </Container>
      </Section>

      {/* ---------- From YouTube ---------- */}
      {youtubeVideos.length > 0 && (
        <Section className="py-8">
          <Container>
            <SectionHeading
              eyebrow="On YouTube"
              title="Watch & learn"
              sub="Talks, explainers and our Live series, fresh from the Zcash India channel."
              cta={
                <ButtonLink href={site.links.youtube} variant="ghost" external>
                  Subscribe on YouTube
                </ButtonLink>
              }
            />
            <YouTubeVideos videos={youtubeVideos} />
          </Container>
        </Section>
      )}

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
                d: "Remittances, freelancers, students, merchants. Privacy is normal.",
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
              { label: "YouTube", href: site.links.youtube, emoji: "▶️", desc: "Talks, explainers & Live." },
              { label: "Instagram", href: site.links.instagram, emoji: "📸", desc: "Photos from the ground." },
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

      {/* ---------- What's new ---------- */}
      {recentUpdates.length > 0 && (
        <Section className="py-8">
          <Container>
            <SectionHeading
              eyebrow="What's new"
              title="Updates from Zcash India"
              cta={
                <ButtonLink href="/updates" variant="ghost">
                  All updates
                </ButtonLink>
              }
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {recentUpdates.map((u) => (
                <Link
                  key={u.id}
                  href="/updates"
                  className="card group flex flex-col p-6 transition-colors hover:border-gold/50"
                >
                  <div className="flex items-center gap-2">
                    {u.pinned && <Badge tone="gold">📌 Pinned</Badge>}
                    {u.tag && !u.pinned && <Badge tone="gold">{u.tag}</Badge>}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-gold">
                    {u.title ?? u.tag ?? "New update"}
                  </h3>
                  {u.body && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{u.body}</p>
                  )}
                  <p className="mt-auto pt-3 text-xs text-muted/60">
                    {formatDateIST(u.createdAt)}
                    {u.xUrl && <span className="ml-2 text-gold">𝕏 post</span>}
                  </p>
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
