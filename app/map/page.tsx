import type { Metadata } from "next";
import { getVerifiedMeetups } from "@/lib/data";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { MapExplorer } from "@/components/map/map-explorer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "The IRL Map",
  description:
    "Every verified Zcash India meetup on one map. Filter by city, kind and venue — or add your own.",
};

export default async function MapPage() {
  const meetups = await getVerifiedMeetups();

  return (
    <Section className="py-8">
      <Container>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="gold" className="mb-3">
              The map
            </Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Zcash India IRL Map
            </h1>
            <p className="mt-2 max-w-xl text-muted">
              Public map shows verified pins only. {site.voice.putCityOnMap}
            </p>
          </div>
          <div className="hidden sm:block">
            <ButtonLink href="/bounties/irl/submit">+ Add meetup</ButtonLink>
          </div>
        </div>

        <MapExplorer meetups={meetups} />
      </Container>
    </Section>
  );
}
