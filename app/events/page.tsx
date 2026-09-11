import Link from "next/link";
import type { Metadata } from "next";
import { Container, Section, Badge, ButtonLink } from "@/components/ui";
import { site } from "@/config/site";
import { media } from "@/config/media";
import { LumaEvents } from "@/components/social/luma-events";
import { XTimeline } from "@/components/social/x-timeline";
import { VideoGrid } from "@/components/social/video-grid";
import { getFeaturedPosts, getAftermovies } from "@/lib/data";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Official Zcash India events: campus editions, community connects and the online Live & Dev series. Straight from our Luma.",
};

export default async function EventsPage() {
  const [featuredPosts, aftermovies] = await Promise.all([
    getFeaturedPosts(),
    getAftermovies(),
  ]);
  return (
    <Section>
      <Container>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge tone="gold" className="mb-4">
              Events
            </Badge>
            <h1 className="text-4xl font-bold sm:text-5xl">Official events</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Campus editions, community connects, and the online Live &amp; Dev
              series, all on our Luma. For community-hosted IRL meetups, see the{" "}
              <Link href="/map" className="text-gold hover:underline">
                map
              </Link>
              .
            </p>
          </div>
          <ButtonLink href={site.links.luma} variant="ghost" external>
            RSVP on Luma
          </ButtonLink>
        </div>

        {/* Real Luma events */}
        <div className="mt-10">
          <LumaEvents />
        </div>

        {/* Aftermovies & recaps */}
        <div className="mt-16">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <Badge tone="gold" className="mb-3">
                Aftermovies & recaps
              </Badge>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Videos from our events
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Recaps and aftermovies from every Zcash India campus edition,
                straight from our X feed. {site.voice.impact}
              </p>
            </div>
            <ButtonLink href={media.xUrl} variant="ghost" external>
              Follow @{media.xHandle}
            </ButtonLink>
          </div>

          {aftermovies.length > 0 && (
            <div className="mt-6">
              <VideoGrid videos={aftermovies} />
            </div>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
            <XTimeline
              handle={media.xHandle}
              height={620}
              fallbackPosts={featuredPosts}
            />
            <div className="card flex flex-col justify-center p-6">
              <h3 className="text-lg font-semibold">Catch every aftermovie</h3>
              <p className="mt-2 text-sm text-muted">
                We post recap videos and photos after each meetup. Follow along on
                X and Instagram, or relive them on the{" "}
                <Link href="/map" className="text-gold hover:underline">
                  IRL map
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={media.xUrl} external>
                  Watch on X
                </ButtonLink>
                <ButtonLink href={media.instagramUrl} variant="ghost" external>
                  Instagram
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
