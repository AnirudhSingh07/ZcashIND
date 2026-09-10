import type { Metadata } from "next";
import { SubmitForm } from "@/components/submit-form";
import { Container, Section, Badge } from "@/components/ui";
import { site } from "@/config/site";
import { getBounty } from "@/lib/data";

export const metadata: Metadata = {
  title: "Submit a meetup",
  description:
    "Submit your Zcash India IRL meetup for review. No account needed.",
};

export default async function SubmitPage() {
  const bounty = await getBounty();
  return (
    <Section>
      <Container className="max-w-3xl">
        <Badge tone="gold" className="mb-4">
          Submit a meetup
        </Badge>
        <h1 className="text-3xl font-bold sm:text-4xl">
          Put your city on the map
        </h1>
        <p className="mt-3 text-muted">
          No account needed. Fill this in, add your photos, and our team reviews
          every submission. Verified meetups appear on the public map with a node
          number. {site.voice.impact}
        </p>
        <p className="mt-2 text-sm text-gold">{bounty.windowLabel}</p>

        <div className="mt-8">
          <SubmitForm minimums={bounty.minimums} period={bounty.period} />
        </div>
      </Container>
    </Section>
  );
}
