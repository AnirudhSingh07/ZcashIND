/**
 * Zcash India College Clubs (ZICC): the 12-event progressive roadmap and the
 * facts shown on /clubs. Edit here; the page renders from this file.
 */
export type RoadmapEvent = {
  n: number;
  title: string;
  kind: string;
  blurb: string;
};

export const clubs = {
  name: "Zcash India College Clubs",
  short: "ZICC",
  tagline:
    "Learn financial privacy. Build with zero-knowledge tech. Put your college on the map.",
  structure: {
    lead: 1,
    members: 10,
  },
  benefits: [
    {
      title: "Learning material that works in a classroom",
      body: "Slides, wallet walkthroughs and the Learn pages, ready to reuse for talks and workshops.",
    },
    {
      title: "A network across campuses",
      body: "Club leads meet each other, the Zcash India team, and builders from the wider ecosystem.",
    },
    {
      title: "Mentorship from people who ship",
      body: "Help with running events, writing content and building on Zcash from the core team.",
    },
    {
      title: "First access to bounties",
      body: "Clubs hear about new bounties first and get help turning submissions into wins.",
    },
    {
      title: "A path to Contributor status",
      body: "Consistent, real impact through a club is the fastest route to recognised Contributor status.",
    },
  ],
  roadmap: [
    {
      n: 1,
      title: "Why Financial Privacy Matters: Introduction to Zcash",
      kind: "Awareness talk",
      blurb: "A 40-minute talk for the whole college. Who can see your payments, and why that matters.",
    },
    {
      n: 2,
      title: "Zodl Wallet Workshop: Your First Shielded Transaction",
      kind: "Hands-on workshop",
      blurb: "Everyone installs a wallet, backs up a seed and sends a shielded transaction on testnet.",
    },
    {
      n: 3,
      title: "Chai & Privacy: Open Discussion on Surveillance and Digital Rights",
      kind: "Casual IRL meetup",
      blurb: "Small group, no slides. A real conversation about surveillance, data and dignity.",
    },
    {
      n: 4,
      title: "ZecMap Mission: Onboard a Local Merchant",
      kind: "Field activity",
      blurb: "Walk out of campus and help one shop near you start accepting ZEC. List it on ZecMap.",
    },
    {
      n: 5,
      title: "zk-SNARKs Deep Dive: How Zcash Actually Works",
      kind: "Technical workshop",
      blurb: "For the curious: what a zero-knowledge proof is, and how Zcash uses one to hide a payment.",
    },
    {
      n: 6,
      title: "Zcash India Live Watch Party",
      kind: "Online + IRL hybrid",
      blurb: "Gather the club, join the monthly Live session together, and win ZEC in the live quiz.",
    },
    {
      n: 7,
      title: "Regional Language Content Sprint",
      kind: "Content bounty",
      blurb: "A weekend to explain Zcash in your own language: Hindi, Gujarati, Marathi, Tamil, anything.",
    },
    {
      n: 8,
      title: "Developer Workshop: Zcash Infrastructure and Light Clients",
      kind: "Dev-focused workshop",
      blurb: "Nodes, lightwalletd, SDKs. Run a light client and understand what your wallet talks to.",
    },
    {
      n: 9,
      title: "Privacy Hackathon: Build on Zcash",
      kind: "24-hour hackathon, IRL",
      blurb: "One day, real teams, working demos. Judged by the Zcash India team and ecosystem builders.",
    },
    {
      n: 10,
      title: "ZICC City Meetup",
      kind: "IRL community event",
      blurb: "Clubs from the same city meet up. Share what worked, plan what's next.",
    },
    {
      n: 11,
      title: "ZecBharat Regional Summit",
      kind: "2 days: talks, showcase, internship drive, IRL",
      blurb: "The regional flagship. Talks, project showcase, and companies hiring from the clubs.",
    },
    {
      n: 12,
      title: "ZICC Demo Day",
      kind: "Product showcase + pitch contest",
      blurb: "The year's best projects pitched to the ecosystem. Prizes, feedback, and next steps.",
    },
  ] as RoadmapEvent[],
  steps: [
    {
      title: "Find your first ten",
      body: "One lead and ten members. Classmates, a coding club, a hostel floor. That's a club.",
    },
    {
      title: "Tell us on Telegram",
      body: "Message the Zcash India team with your college, city and the lead's contact. We reply within a few days.",
    },
    {
      title: "Run event #1",
      body: "We send the slides and a run of show. You host the intro talk and post the photos.",
    },
    {
      title: "Keep going",
      body: "Work through the roadmap at your own pace. Every event puts your college further on the map.",
    },
  ],
} as const;
