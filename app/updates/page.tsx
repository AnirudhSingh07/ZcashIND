import type { Metadata } from "next";
import { getUpdates } from "@/lib/data";
import { site } from "@/config/site";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { UpdateFeed } from "@/components/social/update-feed";

export const metadata: Metadata = {
  title: "Updates & What's New",
  description:
    "The latest from Zcash India — announcements, milestones and moments, straight from our X.",
};

export default async function UpdatesPage() {
  const updates = await getUpdates();

  return (
    <Section>
      <Container className="max-w-3xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-bg p-8 sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-bright/15 blur-[90px]" />
          <div className="relative">
            <Badge tone="gold" className="mb-4">
              ✨ What&apos;s new
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Updates &amp; What&apos;s New</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Announcements, milestones and moments from the Zcash India
              community — freshest first, straight from our X.
            </p>
            <div className="mt-6">
              <ButtonLink href={site.links.x} variant="ghost" external>
                Follow @ZcashIND
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="mt-10">
          <UpdateFeed updates={updates} />
        </div>
      </Container>
    </Section>
  );
}
