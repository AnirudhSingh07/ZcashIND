import type { Metadata } from "next";
import { Container, Section, ButtonLink } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Thanks, submission received",
  description: "Your meetup was submitted for review.",
};

export default function ThanksPage() {
  return (
    <Section>
      <Container className="max-w-2xl">
        <div className="card p-8 text-center sm:p-12">
          <div className="text-5xl">🌱</div>
          <h1 className="mt-4 text-3xl font-bold">Submission received</h1>
          <p className="mt-3 text-muted">
            Thank you for hosting. Your meetup is now <strong>pending review</strong>.
          </p>

          <div className="mt-8 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gold">
              What happens next
            </h2>
            <ol className="mt-3 space-y-3 text-sm text-muted">
              <li>
                <strong className="text-text">1. Review.</strong> Our team checks
                your photos, attendee counts and details. We may reach out on your
                private contact if we need more info.
              </li>
              <li>
                <strong className="text-text">2. Verify.</strong> Once verified,
                your meetup gets a node number and appears on the public map.
              </li>
              <li>
                <strong className="text-text">3. Leaderboard.</strong> Verified
                meetups from the bounty window show on the public leaderboard.
              </li>
            </ol>
          </div>

          <p className="mt-6 text-sm text-muted/70">
            Decisions are made by the Zcash India team and are final. {site.voice.impact}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/map">See the map</ButtonLink>
            <ButtonLink href={site.links.telegram} variant="ghost" external>
              Join Telegram
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
