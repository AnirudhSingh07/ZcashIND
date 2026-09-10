import type { Metadata } from "next";
import { site } from "@/config/site";
import { getBounty } from "@/lib/data";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { BountyPrizes } from "@/components/bounty-prizes";
import { JudgingBars } from "@/components/judging-bars";
import { Leaderboard } from "@/components/leaderboard";

export const metadata: Metadata = {
  title: "IRL Meetup Bounty",
  description:
    "Host a mini-meetup, get it verified, and put your city on the Zcash India map. Prizes, rules, judging and the contributor path.",
};

const WHAT_COUNTS = [
  ["🎓", "College", "A talk, a club session, a classroom discussion."],
  ["☕", "Café / chai", "A relaxed chat over chai. The classic."],
  ["🏠", "Hostel / home", "Friends, roommates, a living-room session."],
  ["💼", "Coworking", "A focused session in a shared workspace."],
  ["🏢", "Office", "A lunch-and-learn with colleagues."],
  ["📢", "Public", "A stall, a park, a community space."],
];

const FORMATS = [
  "Privacy talk",
  "Zcash intro",
  "Ironwood session",
  "Quiz / game",
  "Dev session",
  "Chai & privacy",
  "College discussion",
];

const RULES = [
  "Meetups must happen inside the bounty window.",
  "One submission per meetup. Don't submit the same event twice.",
  "You may host multiple meetups, but only your strongest counts for the main prizes.",
  "No AI-generated or manipulated proof. Real photos only.",
  "Our team may verify details, contact you, or visit.",
  "Fake or inflated attendance means disqualification.",
  "The Zcash India team's decisions are final.",
];

const PERKS = [
  "Official Zcash India Contributor status",
  "Merch",
  "A feature on the map",
  "A certificate",
  "A social spotlight",
  "Access to the contributor community",
  "Co-hosting opportunities",
  "Priority for events and future bounties",
  "A portfolio record of your work",
];

export default async function IrlBountyPage() {
  const bounty = await getBounty();
  const min = bounty.minimums;
  return (
    <Section className="py-8">
      <Container>
        {/* Hero */}
        <div className="max-w-2xl">
          <Badge tone="success" className="mb-4">
            IRL Meetup Bounty
          </Badge>
          <h1 className="text-4xl font-bold sm:text-5xl">
            {site.voice.putCityOnMap}
          </h1>
          <p className="mt-4 text-lg text-muted">
            Host a small, real meetup. Get it verified. Earn a spot on the map, a
            share of the prize pool, and a path to becoming a contributor.{" "}
            {site.voice.notInfluencers} {site.voice.impact}
          </p>
          <p className="mt-3 font-medium text-gold">{bounty.windowLabel}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/bounties/irl/submit">Submit your meetup</ButtonLink>
            <ButtonLink href="/host" variant="ghost">
              Get the host kit
            </ButtonLink>
          </div>
        </div>

        {/* Prizes + Judging */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <BountyPrizes />
          <JudgingBars />
        </div>

        {/* Minimums */}
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-semibold">Minimum to qualify</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [`${min.attendees}+`, "Attendees"],
              [`${min.newToZcash}+`, "New to Zcash"],
              [`${min.minutes}+ min`, "Duration"],
              [`${min.photos}+ photos`, "Incl. 1 group photo"],
            ].map(([v, l]) => (
              <div key={l} className="card-2 p-4 text-center">
                <div className="text-2xl font-bold text-gold">{v}</div>
                <div className="mt-1 text-xs text-muted">{l}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            Plus: Zcash / Zcash India branding visible in a photo, and a real
            conversation — not a photo-op.
          </p>
        </div>

        {/* What counts */}
        <h2 className="mt-12 text-2xl font-bold">What counts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WHAT_COUNTS.map(([emoji, title, desc]) => (
            <div key={title} className="card p-5">
              <div className="text-2xl">{emoji}</div>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <Badge key={f} tone="surface">
              {f}
            </Badge>
          ))}
        </div>

        {/* Rules */}
        <h2 className="mt-12 text-2xl font-bold">The rules</h2>
        <ul className="mt-4 space-y-2">
          {RULES.map((r) => (
            <li key={r} className="flex gap-3 text-muted">
              <span className="text-gold">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>

        {/* Contributor path */}
        <div className="card mt-12 border-gold/40 bg-gold/5 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">The contributor path</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Hosting is how many people become recognised{" "}
            <a href="/contributors" className="text-gold hover:underline">
              Zcash India Contributors
            </a>
            . Consistent, real impact can unlock:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PERKS.map((p) => (
              <span key={p} className="card-2 rounded-full px-3 py-1.5 text-sm">
                ✓ {p}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted/80">
            Participation alone does not guarantee contributor status. We look at
            impact, not numbers.
          </p>
        </div>

        {/* Leaderboard */}
        <div className="mt-12">
          <Leaderboard />
        </div>

        {/* CTA */}
        <div className="card mt-12 flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready?</h2>
          <p className="max-w-lg text-muted">{site.voice.oneAtATime}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/bounties/irl/submit">Submit your meetup</ButtonLink>
            <ButtonLink href="/host" variant="ghost">
              Get the host kit
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
