import type { Metadata } from "next";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Host kit: meetup in a box",
  description:
    "Everything you need to run a 20–40 minute Zcash India meetup: run of show, photo checklist, and what counts.",
};

const RUN_OF_SHOW = [
  ["0–5 min", "Welcome + why privacy", "Introduce yourself. Ask the room: who can see your payments right now? Set the tone: calm, curious, no hype."],
  ["5–15 min", "What is Zcash", "Explain shielded vs transparent in plain language. Use the Learn pages as your script. Keep it concrete."],
  ["15–30 min", "Hands-on wallet", "Help everyone install Zashi or Zingo from an official source and back up a seed. Practise a testnet transaction together."],
  ["30–40 min", "Q&A + next steps", "Answer honestly. Point people to Telegram. Take your group photo. Thank everyone."],
];

const PHOTO_CHECKLIST = [
  "At least 3 photos (the bounty minimum).",
  "1 clear group photo of the room.",
  "1 photo showing Zcash / Zcash India branding (poster, slide, or sticker).",
  "1 candid photo of the actual activity: phones out, wallet on screen, discussion.",
  "Real photos only. No AI-generated or manipulated images.",
];

const DOESNT_COUNT = [
  "A quick photo-op with no real conversation.",
  "Fewer than 4 attendees.",
  "Fewer than 2 people genuinely new to Zcash.",
  "Under 20 minutes.",
  "No visible Zcash / Zcash India branding.",
  "Inflated or fake attendance. This means disqualification.",
];

export default function HostPage() {
  return (
    <Section>
      <Container className="max-w-4xl">
        <Badge tone="gold" className="mb-4">
          Host kit
        </Badge>
        <h1 className="text-4xl font-bold sm:text-5xl">Meetup in a box</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          You don't need to be an expert. You need four people, forty minutes, and
          a willingness to have a real conversation. Here's everything to run one.
        </p>

        {/* Run of show */}
        <div className="card mt-10 p-6">
          <h2 className="text-xl font-semibold">Run of show (20–40 min)</h2>
          <div className="mt-4 divide-y divide-line">
            {RUN_OF_SHOW.map(([time, title, desc]) => (
              <div key={time} className="grid gap-1 py-4 sm:grid-cols-[110px_1fr]">
                <div className="text-sm font-semibold text-gold">{time}</div>
                <div>
                  <div className="font-medium">{title}</div>
                  <p className="text-sm text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Photo checklist */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Photo checklist</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {PHOTO_CHECKLIST.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-success">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Counting new-to-Zcash */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold">How to count "new to Zcash"</h2>
            <p className="mt-3 text-sm text-muted">
              Simply ask the room: "Who's here and had never used a Zcash wallet
              before today?" Count those hands. Be honest. The number is about
              real reach, not a bigger score. {site.voice.impact}
            </p>
          </div>
        </div>

        {/* Branding note */}
        <div className="card mt-6 border-gold/40 bg-gold/5 p-6">
          <h2 className="text-lg font-semibold">Printable branding</h2>
          <p className="mt-2 text-muted">
            Print this simple poster and put it where your group photo will
            capture it. That satisfies the "branding visible" requirement.
          </p>
          <div className="mt-4">
            <ButtonLink href="/brand/poster.svg" variant="ghost" external>
              Open the poster (SVG)
            </ButtonLink>
          </div>
        </div>

        {/* What doesn't count */}
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-semibold">What does not count</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {DOESNT_COUNT.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="text-danger">✕</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/bounties/irl/submit">Submit your meetup</ButtonLink>
          <ButtonLink href="/bounties/irl" variant="ghost">
            Read the bounty rules
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
