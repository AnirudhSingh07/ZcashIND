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
        { label: "ZecHub: learn the protocol", href: site.links.zechub },
        {
          label: "Ironwood upgrade",
          href: site.links.ironwood,
          note: "NU6.3: what's changing and when",
        },
        { label: "z.cash: the official project", href: site.links.zcash },
      ],
    },
    {
      title: "India",
      blurb: "Local events, bounties, cities and infrastructure.",
      links: [
        { label: "Zcash India events", href: "/events" },
        { label: "Bounties", href: "/bounties" },
        { label: "The IRL map", href: "/map" },
        { label: "College clubs (ZICC)", href: "/clubs" },
        {
          label: "Mumbai light client status",
          href: site.links.lightClientStatus,
          note: "Independent lightwalletd node, open source",
        },
        {
          label: "Light client source code",
          href: site.links.lightClientSource,
          note: "github.com/jatinsahijwani/openlightnodes",
        },
      ],
    },
    {
      title: "Tools",
      blurb: "Wallets, maps and explorers you can actually use today.",
      links: [
        { label: "Wallets (Zashi, Zodl, Zingo)", href: "/learn/wallets" },
        { label: "Pay with ZEC in India", href: "/pay" },
        { label: "ZecMap: merchants & meetups", href: site.links.zecmap },
        {
          label: "Zodl Hindi localisation",
          href: site.links.zodlHindiPr,
          note: "Our PR to the Zodl Android wallet",
        },
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
        {
          label: "Zcash India 2026 report",
          href: site.links.forumReport,
          note: "Our numbers, published on the community forum",
        },
      ],
    },
  ],
  thisMonth: [
    {
      label: "Explain Zcash Like I'm New",
      href: "/bounties/explain-zcash-september-2026",
      note: "This month's bounty: $150 in ZEC, 16 winners",
    },
    {
      label: "Put your city on the map",
      href: "/bounties/irl",
      note: "Host a meetup, submit it, get a node number",
    },
    {
      label: "Zcash India Live (online series)",
      href: "/events",
      note: "Monthly online sessions, win real ZEC",
    },
  ],
};
