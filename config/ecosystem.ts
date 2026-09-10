import { site } from "./site";

// Curated ecosystem for the /ecosystem page. Update "thisMonth" monthly.

export type EcoLink = { label: string; href: string; note?: string };

export const ecosystem: {
  columns: { title: string; blurb: string; links: EcoLink[] }[];
  thisMonth: EcoLink[];
} = {
  columns: [
    {
      title: "Protocol",
      blurb: "How Zcash actually works. Read the deep docs at ZecHub.",
      links: [
        { label: "ZecHub — learn the protocol", href: site.links.zechub },
        {
          label: "Ironwood roadmap",
          href: "https://zechub.wiki/",
          note: "Next-gen Zcash direction",
        },
        { label: "z.cash — the official project", href: site.links.zcash },
      ],
    },
    {
      title: "India",
      blurb: "Local events, bounties, cities and infrastructure.",
      links: [
        { label: "Zcash India events", href: "/events" },
        { label: "IRL meetup bounty", href: "/bounties/irl" },
        { label: "The IRL map", href: "/map" },
        { label: "Mumbai light client (infra)", href: "/ecosystem" },
      ],
    },
    {
      title: "Tools",
      blurb: "Wallets, maps and explorers you can actually use today.",
      links: [
        { label: "Wallets (Zashi, Zingo)", href: "/learn/wallets" },
        { label: "ZecMap — merchants & meetups", href: site.links.zecmap },
        {
          label: "Block explorer",
          href: "https://mainnet.zcashexplorer.app/",
          note: "Public chain data",
        },
      ],
    },
    {
      title: "Governance",
      blurb: "Grants and community decisions.",
      links: [
        {
          label: "Zcash Community Grants",
          href: "https://zcashcommunitygrants.org/",
        },
      ],
    },
  ],
  thisMonth: [
    {
      label: "IRL meetup bounty — September 2026",
      href: "/bounties/irl",
      note: "Host a meetup, put your city on the map",
    },
    {
      label: "Zcash India Live (online series)",
      href: "/events",
      note: "Monthly online sessions",
    },
    {
      label: "Regional content bounty",
      href: "/contribute",
      note: "Write local how-tos and recaps",
    },
  ],
};
