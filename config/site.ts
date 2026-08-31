// Central site configuration. Import from here everywhere — never hardcode links.

export const site = {
  name: "Zcash India",
  shortName: "ZcashIND",
  wordmark: "Zcash India 🇮🇳",
  tagline:
    "Learn financial privacy, find the next meetup, put your city on the map.",
  description:
    "Zcash India is the India front door for Zcash. Learn what shielded money is, find real IRL meetups, and put your city on the map.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  // Voice lines — reuse across the site.
  voice: {
    putCityOnMap: "Put your city on the map.",
    impact: "Impact > numbers.",
    notInfluencers: "We are not looking for influencers.",
    hcc: "Host. Connect. Contribute.",
    becomeContributor: "Become a Zcash India Contributor.",
    oneAtATime: "One conversation. One meetup. One city at a time.",
  },

  // Live community + ecosystem links.
  links: {
    x: "https://x.com/ZcashIND",
    telegram: "https://t.me/ZcashIN",
    instagram: "https://www.instagram.com/zcashind",
    forum: "https://forum.zcashcommunity.com/t/zcash-india-2026/54762",
    luma: "https://luma.com/user/zcashindia",
    zechub: "https://zechub.wiki/",
    zecmap: "https://zecmap.com/map",
    zecmapAdd: "https://zecmap.com/add",
    zcash: "https://z.cash/",
    donation: "#", // donation placeholder — wire up in Phase 2
  },

  // Bounty campaign config.
  bounty: {
    period: "2026-09",
    windowLabel: "Bounty window: September 2026 (confirm dates)",
    prizePoolUsd: 150,
    prizes: [
      { place: "1st", amountUsd: 40, note: "Best meetup overall" },
      { place: "2nd", amountUsd: 25, note: "Runner-up" },
      { place: "3rd", amountUsd: 20, note: "Third place" },
      { place: "Outstanding ×5", amountUsd: 10, note: "5 outstanding meetups" },
      { place: "New-city ×5", amountUsd: 3, note: "5 new-city activations" },
    ],
    minimums: {
      attendees: 4,
      newToZcash: 2,
      minutes: 20,
      photos: 3,
    },
    judging: [
      { label: "Impact", weight: 30 },
      { label: "Attendance", weight: 20 },
      { label: "Quality", weight: 20 },
      { label: "Geographic reach", weight: 15 },
      { label: "Documentation", weight: 15 },
    ],
  },

  // Map default bounds — fit India on load.
  map: {
    // [west, south], [east, north]
    bounds: [
      [68.1, 6.5],
      [97.4, 35.7],
    ] as [[number, number], [number, number]],
    styleUrl:
      process.env.NEXT_PUBLIC_MAP_STYLE ||
      "https://tiles.openfreemap.org/styles/dark",
  },

  legal: "Not an exchange. Not financial advice.",
} as const;

export type Site = typeof site;
