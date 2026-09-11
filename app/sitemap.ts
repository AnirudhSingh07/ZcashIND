import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getDocs } from "@/lib/content";
import { getCities, cityToSlug, getBounties } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;
  const staticPaths = [
    "",
    "/learn",
    "/map",
    "/events",
    "/bounties",
    "/bounties/irl",
    "/bounties/irl/submit",
    "/clubs",
    "/host",
    "/contributors",
    "/ecosystem",
    "/pay",
    "/updates",
    "/about",
    "/community",
    "/contribute",
    "/disclaimer",
    "/privacy",
  ];

  const learn = getDocs("learn").map((d) => `/learn/${d.slug}`);
  const bounties = (await getBounties())
    .filter((b) => !(b.kind === "irl_meetup" && b.active)) // that one lives at /bounties/irl
    .map((b) => `/bounties/${b.slug}`);
  const cities = (await getCities()).map((c) => `/map/${cityToSlug(c.city)}`);
  const events = (
    await prisma.meetup.findMany({
      where: { kind: "official_event", status: "verified" },
      select: { slug: true },
    })
  ).map((e) => `/events/${e.slug}`);
  const contributors = (
    await prisma.contributor.findMany({ select: { slug: true } })
  ).map((c) => `/contributors/${c.slug}`);

  const all = [
    ...staticPaths,
    ...learn,
    ...bounties,
    ...cities,
    ...events,
    ...contributors,
  ];

  return all.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
