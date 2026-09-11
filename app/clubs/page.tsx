import type { Metadata } from "next";
import { site } from "@/config/site";
import { clubs } from "@/config/clubs";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { IndiaMap } from "@/components/india-map";

export const metadata: Metadata = {
  title: "College Clubs (ZICC)",
  description: `${clubs.tagline} Start a Zcash India College Club: one lead, ten members, a 12-event roadmap.`,
};

export default function ClubsPage() {
  return (
    <Section className="py-8">
      <Container>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-bg p-8 sm:p-12">
          <IndiaMap
            variant="fill"
            className="pointer-events-none absolute -right-10 top-1/2 hidden h-[150%] -translate-y-1/2 opacity-[0.07] sm:block"
          />
          <div className="relative max-w-2xl">
            <Badge tone="gold" className="mb-4">
              {clubs.short}
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">{clubs.name}</h1>
            <p className="mt-4 text-lg text-muted">{clubs.tagline}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="#start">Start a club</ButtonLink>
              <ButtonLink href="#roadmap" variant="ghost">
                See the 12-event roadmap
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* What is a ZICC */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card p-6 sm:p-8">
            <h2 className="text-2xl font-bold">What a ZICC is</h2>
            <p className="mt-3 text-muted">
              A Zcash India College Club is a small, student-run group on one campus. It runs the events on
              the roadmap below, at its own pace, with material and support from the Zcash India team. No
              money changes hands to start one. You need people, not permission.
            </p>
            <p className="mt-3 text-muted">
              Clubs are how we go from one-off campus editions with 200 people in a hall to something that
              keeps going after we leave: a lead who knows the material, ten members who can run a workshop,
              and a college that shows up on the map.
            </p>
          </div>
          <div className="card-2 flex flex-col justify-center p-6 text-center">
            <div className="text-5xl font-bold text-gold">
              {clubs.structure.lead}
              <span className="text-2xl text-muted"> + </span>
              {clubs.structure.members}
            </div>
            <p className="mt-2 font-medium">One lead, ten members</p>
            <p className="mt-1 text-sm text-muted">That's the whole structure. The lead is the point of contact; members run events together.</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold">What students get</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.benefits.map((b) => (
              <div key={b.title} className="card p-6">
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-muted">{b.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div id="roadmap" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold">The 12-event roadmap</h2>
          <p className="mt-1 max-w-2xl text-muted">
            In order, from a first talk anyone can give to a demo day the whole ecosystem watches. Clubs move
            through it at their own pace. Most take a year.
          </p>
          <ol className="relative mt-6 space-y-3">
            <div
              aria-hidden
              className="absolute bottom-6 left-[19px] top-6 hidden w-px bg-gradient-to-b from-gold/60 via-line to-transparent sm:block"
            />
            {clubs.roadmap.map((e) => (
              <li key={e.n} className="relative sm:pl-14">
                <span
                  aria-hidden
                  className="absolute left-0 top-5 hidden h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-surface text-sm font-bold text-gold sm:flex"
                >
                  {e.n}
                </span>
                <div className="card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gold sm:hidden">{e.n}.</span>
                    <Badge tone="surface">{e.kind}</Badge>
                  </div>
                  <h3 className="mt-2 font-semibold">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted">{e.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* How to start */}
        <div id="start" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-bold">How to start a club</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clubs.steps.map((s, i) => (
              <div key={s.title} className="card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-bright font-bold text-text">
                  {i + 1}
                </div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="card mt-6 border-gold/40 bg-gold/5 p-8 text-center">
            <h2 className="text-2xl font-bold">Put your college on the map</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted">
              Message the team on Telegram with your college, city and the club lead's contact. We'll send the
              starter kit for event #1.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ButtonLink href={site.links.telegram} external>
                Message us on Telegram
              </ButtonLink>
              <ButtonLink href="/host" variant="ghost">
                Read the host kit
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
