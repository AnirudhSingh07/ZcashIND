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
    youtube: "https://www.youtube.com/@ZcashIND",
    luma: "https://luma.com/user/zcashindia",
    zechub: "https://zechub.wiki/",
    zecmap: "https://zecmap.com/map",
    zecmapAdd: "https://zecmap.com/add",
    zcash: "https://z.cash/",
    donation: "", // empty = "coming soon" in the footer; set a shielded address URL when ready
    lightClientStatus: "https://status.openlightnodes.org/status/status",
    lightClientSource: "https://github.com/jatinsahijwani/openlightnodes",
    zodlHindiPr: "https://github.com/zodl-inc/zodl-android/pull/2453",
    ironwood: "https://z.cash/upgrade/ironwood/",
    forumReport: "https://forum.zcashcommunity.com/t/zcash-india-2026/54762",
  },

  // Luma events. The profile can't be iframed (SAMEORIGIN), so we link out to it
  // and embed individual events via their Luma embed IDs. To show a live preview
  // of an event, paste its Luma embed ID below (from the event's Share → Embed).
  // ID looks like "evt-XXXXXXXXXXXX" (or the full lu.ma/<slug>).
  luma: {
    profileUrl: "https://luma.com/user/zcashindia",
    // Optional: featured events to embed on /events, newest first.
    featured: [] as { id: string; title?: string }[],
  },

  // Bounty campaign config.
  bounty: {
    period: "2026-09",
    windowLabel: "Bounty window: September 2026",
    prizePoolUsd: 150,
    prizes: [
      { place: "1st", amountUsd: 40, note: "Best meetup overall" },
      { place: "2nd", amountUsd: 25, note: "Runner-up" },
      { place: "3rd", amountUsd: 20, note: "Third place" },
      { place: "Outstanding x5", amountUsd: 10, note: "5 outstanding meetups" },
      { place: "New-city x5", amountUsd: 3, note: "5 new-city activations" },
    ],
    minimums: {
      attendees: 4,
      newToZcash: 2,
      minutes: 20,
      photos: 3,
    },
    judging: [
      { label: "Community impact", weight: 30 },
      { label: "Attendance & reach", weight: 20 },
      { label: "Meetup quality", weight: 20 },
      { label: "Geographic impact", weight: 15 },
      { label: "Documentation", weight: 15 },
    ],
  },

  // Map default bounds — fit India on load.
  map: {
    // [west, south], [east, north] — north extends to ~37.4 to show all of J&K.
    bounds: [
      [67.6, 6.5],
      [97.6, 37.4],
    ] as [[number, number], [number, number]],
    styleUrl:
      process.env.NEXT_PUBLIC_MAP_STYLE ||
      "https://tiles.openfreemap.org/styles/positron",
  },

  // ZEC climber on the homepage hero. The climber starts mid-route at the
  // price seen when the page loads and moves a fixed distance per dollar from
  // there (world units; the climber is about 1.9 units tall). 0.6 means a $5
  // tick is about a body-and-a-half of climbing.
  zecHiker: {
    unitsPerDollar: 0.6,
  },

  legal: "Not an exchange. Not financial advice.",
} as const;

export type Site = typeof site;
