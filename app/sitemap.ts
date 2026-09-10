import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getDocs } from "@/lib/content";
import { getCities, cityToSlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;
  const staticPaths = [
    "",
    "/learn",
    "/map",
    "/events",
    "/bounties/irl",
    "/bounties/irl/submit",
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
    ...cities,
    ...events,
    ...contributors,
  ];

  return all.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
