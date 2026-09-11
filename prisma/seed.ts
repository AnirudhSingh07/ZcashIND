import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ZcashIND seed: real data from the Zcash India 2026 programme.
 *
 * Sources: the official Luma (https://luma.com/user/zcashindia), the
 * @ZcashIND X feed, and the community forum report
 * (https://forum.zcashcommunity.com/t/zcash-india-2026/54762).
 *
 * Community-submitted IRL meetups (the Meetup table) stay empty: they fill up
 * as real hosts submit and admins verify. Everything else is seeded here.
 */

const IST = "+05:30";
const d = (iso: string) => new Date(`${iso}${IST}`);
const xStatus = (url: string) => {
  const m = url.match(/x\.com\/([^/]+)\/status/);
  return m ? m[1] : null;
};

// ---------------------------------------------------------------------------
// Events (Luma)
// ---------------------------------------------------------------------------

const CITY = {
  Surat: { lat: 21.1702, lng: 72.8311, state: "Gujarat" },
  Ahmedabad: { lat: 23.0225, lng: 72.5714, state: "Gujarat" },
  Bhopal: { lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
  Vadodara: { lat: 22.3072, lng: 73.1812, state: "Gujarat" },
  Udaipur: { lat: 24.5854, lng: 73.7125, state: "Rajasthan" },
  Indore: { lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
} as const;

type CityName = keyof typeof CITY;

const irl = (
  slug: string,
  title: string,
  startsAt: string,
  city: CityName,
  venue: string,
  extra: { coHosts?: string; attendees?: number; note?: string; xUrl?: string },
) => ({
  slug,
  title,
  startsAt: d(startsAt),
  city,
  state: CITY[city].state,
  lat: CITY[city].lat,
  lng: CITY[city].lng,
  venue,
  isOnline: false,
  series: "irl",
  ...extra,
});

const online = (
  slug: string,
  title: string,
  startsAt: string,
  series: "live" | "dev",
  extra: { venue?: string; attendees?: number; note?: string; topics?: string; xUrl?: string },
) => ({
  slug,
  title,
  startsAt: d(startsAt),
  city: "Online",
  isOnline: true,
  series,
  ...extra,
});

const lumaEvents = [
  online("8scuih0r", "Zcash IND Developer Workshop #03", "2026-08-22T17:00:00", "dev", {
    topics: "Zodl wallet, CrossPay via NEAR Intents, ZecMap, Ramp Labs, Zapp, ZecHub bounties",
    xUrl: "https://x.com/ZcashIND/status/2091859163274158193",
  }),
  irl(
    "dukui59n",
    "Zcash Community Connect: Surat Edition",
    "2026-08-13T11:00:00",
    "Surat",
    "P P Savani University, Vesu, Surat NIC Campus",
    {
      coHosts: "PU DAO & Web3surat",
      attendees: 160,
      note: "150+ new Zodl wallets created on the spot",
      xUrl: "https://x.com/ZcashIND/status/2092235721256177673",
    },
  ),
  irl(
    "z0hxivdc",
    "NEAR Legion India x Zcash India Builder Workshop: Ahmedabad",
    "2026-08-10T12:30:00",
    "Ahmedabad",
    "L.D. College of Engineering",
    {
      coHosts: "NEAR Legion India, PU DAO & Swayam",
      attendees: 50,
      note: "50+ new Zodl wallets. Volunteer contribution with NEAR Legion.",
      xUrl: "https://x.com/ZcashIND/status/2090139303573868866",
    },
  ),
  online("aq163nqq", "ZcashIND Live #05: Ironwood & Ecosystem Update", "2026-08-09T16:30:00", "live", {
    attendees: 83,
    xUrl: "https://x.com/ZcashIND/status/2085315606954565850",
  }),
  online("t1kopefw", "Zcash IND Developer Workshop #02", "2026-07-22T16:30:00", "dev", {
    venue: "ZecHub Hackathon",
    topics: "Nodes, lightwallet infrastructure, Zakura",
  }),
  online("e0yvb64e", "ZcashIND Live #04: From Wallets To Builders", "2026-07-16T17:00:00", "live", {
    attendees: 80,
    xUrl: "https://x.com/ZcashIND/status/2078125850348900408",
  }),
  irl(
    "y4o0fdyr",
    "Zcash Community Connect: Bhopal Edition",
    "2026-07-13T10:30:00",
    "Bhopal",
    "Oriental Institute of Science and Technology",
    {
      coHosts: "Arnav Tiwari & Ayush Malviya",
      attendees: 216,
      note: "Every attendee left with a Zodl wallet and real ZEC",
      xUrl: "https://x.com/ZcashIND/status/2079170866798350411",
    },
  ),
  online("qcyft7m0", "Zcash IND Developer Workshop #01", "2026-06-28T17:30:00", "dev", {
    venue: "ZecHub Hackathon",
    attendees: 38,
    topics: "Zcash architecture, ZK proofs, dev tools, SDKs, ZcashNames (ZNS) demo",
  }),
  irl(
    "aye9lq9s",
    "Zcash Community Connect: Vadodara Edition",
    "2026-06-18T12:30:00",
    "Vadodara",
    "Parul University",
    {
      coHosts: "Saurabh Nage, PU DAO & Khushi Pradhan",
      attendees: 229,
      note: "Wallets created, ZEC distributed, real-time engagement",
      xUrl: "https://x.com/ZcashIND/status/2070045791855817036",
    },
  ),
  online("hqvdlxv7", "Zcash IND Ecosystem Live #03: Privacy & What's New", "2026-06-13T17:00:00", "live", {
    attendees: 82,
  }),
  irl(
    "ehp8fmq5",
    "Zcash Community Connect: Udaipur Edition",
    "2026-05-27T10:30:00",
    "Udaipur",
    "Geetanjali Institute of Technical Studies (GITS)",
    {
      attendees: 192,
      xUrl: "https://x.com/ZcashIND/status/2061710153976869027",
    },
  ),
  online("k6mrjz81", "Zcash IND LIVE #02: Privacy, Crypto & The Future", "2026-05-22T17:00:00", "live", {
    attendees: 70,
  }),
  irl(
    "2snzqd45",
    "Zcash Community Connect: Indore Edition",
    "2026-04-16T11:00:00",
    "Indore",
    "Acropolis Institute of Technology and Research (AITR)",
    {
      attendees: 50,
      note: "The first Zcash India campus edition",
      xUrl: "https://x.com/ZcashIND/status/2049154827641561498",
    },
  ),
  online("3n364m7y", "Zcash India Live #01: Privacy, ZK Proofs & What's Next", "2026-04-14T17:00:00", "live", {
    venue: "Google Meet",
    attendees: 77,
    note: "77 live attendees on day one, past the 65+ target",
  }),
];

// ---------------------------------------------------------------------------
// Aftermovies (recap videos on /events and city pages)
// ---------------------------------------------------------------------------

const aftermovies = [
  { title: "Zcash Community Connect: Surat Edition", event: "Surat aftermovie", city: "Surat", url: "https://x.com/ZcashIND/status/2092235721256177673", date: d("2026-08-13T00:00:00") },
  { title: "NEAR Legion India x Zcash India Builder Workshop", event: "Ahmedabad aftermovie", city: "Ahmedabad", url: "https://x.com/ZcashIND/status/2090139303573868866", date: d("2026-08-10T00:00:00") },
  { title: "Zcash Community Connect: Bhopal Edition", event: "Bhopal aftermovie", city: "Bhopal", url: "https://x.com/ZcashIND/status/2079170866798350411", date: d("2026-07-13T00:00:00") },
  { title: "Zcash Community Connect: Vadodara Edition", event: "Vadodara aftermovie", city: "Vadodara", url: "https://x.com/ZcashIND/status/2070045791855817036", date: d("2026-06-18T00:00:00") },
  { title: "Exploring Zcash Ecosystem: Udaipur Edition", event: "Udaipur aftermovie", city: "Udaipur", url: "https://x.com/ZcashIND/status/2061710153976869027", date: d("2026-05-27T00:00:00") },
  { title: "Exploring Zcash Ecosystem: Indore Edition", event: "Indore aftermovie", city: "Indore", url: "https://x.com/ZcashIND/status/2049154827641561498", date: d("2026-04-16T00:00:00") },
];

// ---------------------------------------------------------------------------
// Featured posts (fallback for the live X timeline)
// ---------------------------------------------------------------------------

const featuredPosts = [
  { title: "New bounty: Explain Zcash Like I'm New", subtitle: "$150 in ZEC, 16 winners", url: "https://x.com/ZcashIND/status/2097660304138387900" },
  { title: "Mini Meetup Bounty #2: winners announced", subtitle: "12 hosts across India", url: "https://x.com/ZcashIND/status/2092613796712096066" },
  { title: "Zcash Community Connect: Surat Edition", subtitle: "160 students, 150+ wallets", url: "https://x.com/ZcashIND/status/2092235721256177673" },
  { title: "Developer Workshop #03 recap", subtitle: "Zodl, CrossPay, ZecMap, Zapp", url: "https://x.com/ZcashIND/status/2091859163274158193" },
  { title: "NEAR Legion India x Zcash India", subtitle: "Ahmedabad builder workshop", url: "https://x.com/ZcashIND/status/2090139303573868866" },
  { title: "5 businesses in India now accept ZEC", subtitle: "Live on ZecMap", url: "https://x.com/ZcashIND/status/2084200884108710268" },
];

// ---------------------------------------------------------------------------
// Updates feed
// ---------------------------------------------------------------------------

const updates = [
  {
    createdAt: d("2026-02-22T10:00:00"),
    title: "Zcash India launched",
    tag: "Milestone",
    body: "Zcash India officially launched with 1 follower on X and 5 members on Telegram. The mission: bring financial privacy education to India.",
  },
  {
    createdAt: d("2026-04-14T19:30:00"),
    title: "First online event: 77 attendees",
    tag: "Event",
    body: "Zcash India Live #01 delivered 77 live attendees on Google Meet, exceeding the 65+ target on day one.",
  },
  {
    createdAt: d("2026-06-18T18:00:00"),
    title: "Vadodara IRL: 229 students",
    tag: "Event",
    body: "229 students showed up at our Vadodara offline event. Wallets created, ZEC distributed, real-time engagement.",
    xUrl: "https://x.com/ZcashIND/status/2070045791855817036",
  },
  {
    createdAt: d("2026-06-28T20:00:00"),
    title: "First developer workshop",
    tag: "Event",
    body: "38 developers joined our first-ever dev event covering Zcash architecture, ZK proofs, and dev tools.",
  },
  {
    createdAt: d("2026-07-05T12:00:00"),
    title: "X crosses 1,300 followers",
    tag: "Milestone",
    body: "X grew from 390 to 1,310 in a single month. All organic, zero paid promotion.",
  },
  {
    createdAt: d("2026-07-13T18:00:00"),
    title: "Bhopal IRL: 216 students",
    tag: "Event",
    body: "216 attendees at our Bhopal edition. Every attendee walked out with a Zodl wallet and real ZEC.",
    xUrl: "https://x.com/ZcashIND/status/2079170866798350411",
  },
  {
    createdAt: d("2026-07-18T12:00:00"),
    title: "Light client infrastructure live in Mumbai",
    tag: "Milestone",
    body: "Deployed an independent lightwalletd node in Mumbai. Live, wallet-usable, fully open-source.",
    xUrl: "https://x.com/ZcashIND/status/2081055142888284362",
  },
  {
    createdAt: d("2026-07-22T12:00:00"),
    title: "First ZecMap business in India",
    tag: "Milestone",
    body: "Raj NX Mobiles in Ujjain is now listed on ZecMap as a Zcash-accepting business. The first merchant adoption driven by Zcash India.",
  },
  {
    createdAt: d("2026-07-26T12:00:00"),
    title: "Regional language content bounty: 27 submissions",
    tag: "Announcement",
    body: "First-of-its-kind bounty for Zcash content in Indian regional languages. 27 submissions across Hindi, Gujarati, Marathi, Tamil, Telugu, and more. Prize pool increased from $150 to $200.",
    xUrl: "https://x.com/ZcashIND/status/2076288625348943945",
  },
  {
    createdAt: d("2026-08-03T12:00:00"),
    title: "5 businesses now accept ZEC in India",
    tag: "Milestone",
    body: "India now has 5 active business listings on ZecMap accepting ZEC as payment.",
    xUrl: "https://x.com/ZcashIND/status/2084200884108710268",
  },
  {
    createdAt: d("2026-08-10T18:00:00"),
    title: "NEAR Legion x Zcash India: Ahmedabad",
    tag: "Partnership",
    body: "Joint event with NEAR Legion in Ahmedabad. 50+ attendees, 50+ new wallets. Covered CrossPay and the Zcash-NEAR dev landscape.",
    xUrl: "https://x.com/ZcashIND/status/2090139303573868866",
  },
  {
    createdAt: d("2026-08-13T18:00:00"),
    title: "Surat IRL: 160 students, 150+ wallets",
    tag: "Event",
    body: "160 attendees in Surat. 150+ brand new Zodl wallets created on the spot.",
    xUrl: "https://x.com/ZcashIND/status/2092235721256177673",
  },
  {
    createdAt: d("2026-08-20T12:00:00"),
    title: "Zodl Hindi localization PR",
    tag: "Milestone",
    body: "Raised a Hindi language localization PR for the Zodl Android wallet, making Zodl accessible to 600 million+ Hindi speakers.",
  },
  {
    createdAt: d("2026-08-24T12:00:00"),
    title: "Instagram launched",
    tag: "Announcement",
    body: "Started @zcashind on Instagram as a voluntary contribution. Not part of any KPI. We saw an opportunity and took it.",
  },
  {
    createdAt: d("2026-08-28T12:00:00"),
    title: "Telegram crosses 1,300 members",
    tag: "Milestone",
    body: "Telegram grew 62% in one month, from 824 to 1,332. Driven by the Surat event and Mini Meetup Bounty #2.",
  },
  {
    createdAt: d("2026-09-02T12:00:00"),
    title: "New bounty: Explain Zcash Like I'm New",
    tag: "Announcement",
    pinned: true,
    body: "New bounty is live. Explain Zcash to someone who has never heard of it. 16 winners, $150 prize pool in ZEC.",
    xUrl: "https://x.com/ZcashIND/status/2097660304138387900",
  },
];

// ---------------------------------------------------------------------------
// Bounties
// ---------------------------------------------------------------------------

const REGIONAL_SUBMISSIONS = [
  "https://x.com/ucofweb3/status/2079709532939255877",
  "https://x.com/ranjit_kr12/status/2076594432863076805",
  "https://x.com/AdarshKumar1217/status/2077723877543948433",
  "https://x.com/KrrishRath29455/status/2080320911727821154",
  "https://x.com/cryptokidxx/status/2080260381805601116",
  "https://x.com/noush7n/status/2079546971010769050",
  "https://x.com/Lakhan_997/status/2080239190969925645",
  "https://x.com/SisodiyaRa92495/status/2080231892058874004",
  "https://x.com/validcrypt/status/2078650400467550508",
  "https://x.com/global_loba/status/2078931352955891902",
  "https://x.com/webeditx_04/status/2079897722933723545",
  "https://x.com/BagdawatGo59741/status/2079826282494509099",
  "https://x.com/NoniRichies29/status/2079630034050896359",
  "https://x.com/jaishiv_sen/status/2078901538748301808",
  "https://x.com/KrrishRath29455/status/2078826468378042764",
  "https://x.com/iamarctyxian/status/2078783580365271478",
  "https://x.com/PrachiPorw12/status/2076416760870511009",
  "https://x.com/0x_devesh/status/2076373529940160596",
  "https://x.com/epiccryptotv/status/2078442309339992313",
  "https://x.com/Anoopbalan100/status/2076697921748406438",
  "https://x.com/Ritikdhanotiya0/status/2076384673870348742",
  "https://x.com/i/status/2079132085001044392",
  "https://x.com/web3withBurian/status/2080605524878352825",
  "https://x.com/BhupalamS/status/2080708465883074816",
  "https://x.com/l_etim/status/2080718705596735559",
  "https://x.com/VaibhavRaj9538/status/2080714116042568084",
  "https://x.com/0xAlfiya/status/2080648166152810778",
];

const MINI2_SUBMISSIONS = [
  "https://x.com/KrrishRath29455/status/2088598377609179337",
  "https://x.com/KartikM16956282/status/2088602951262912629",
  "https://x.com/AdarshKumar1217/status/2088863301728141547",
  "https://x.com/tushar1962005/status/2089551051041218608",
  "https://x.com/LaveshBhandari5/status/2089554345838911905",
  "https://x.com/MadhuramDo78142/status/2089656217790779843",
  "https://x.com/Lakhan_997/status/2091618621500068005",
  "https://x.com/0xAlfiya/status/2091831227640676730",
  "https://x.com/VaibhavRaj9538/status/2091935496570290434",
  "https://x.com/jayesh_iot/status/2092191544677945406",
  "https://x.com/SisodiyaRa92495/status/2092234860807233840",
  "https://x.com/cryptokidxx/status/2090295072504029251",
];

const findSub = (list: string[], handle: string) =>
  list.find((u) => u.toLowerCase().includes(`x.com/${handle.toLowerCase()}/`));

const W = (xHandle: string, place: string, prizeUsd: number, submissionUrl?: string) => ({
  xHandle,
  place,
  prizeUsd,
  submissionUrl: submissionUrl ?? null,
});

const J = (v: unknown) => JSON.stringify(v);

const bounties = [
  {
    slug: "meme-bounty-april-2026",
    title: "Zcash Meme Bounty",
    kind: "meme",
    status: "completed",
    startDate: d("2026-04-20T00:00:00"),
    endDate: d("2026-05-10T23:59:00"),
    format: "Create original Zcash memes",
    description:
      "The first Zcash India bounty. Make an original meme about Zcash, financial privacy or shielded money and post it on X tagging @ZcashIND.\n\nThe prize pool started at $100 and was raised to $120 after the response: 22 original memes came in from across the community.",
    rules:
      "- Original work only. No reposts, no stolen templates.\n- Post on X and tag @ZcashIND.\n- One entry per person counts for the main prizes.\n- Keep it clean. Memes that punch down or spread misinformation are disqualified.",
    acceptedFormats: "Image meme, short video meme, comic",
    prizePoolUsd: 120,
    submissionCount: 22,
    winnerCount: 10,
    prizes: J([
      { place: "Prize pool", amountUsd: 120, note: "Split across 10 winners, paid in ZEC" },
    ]),
  },
  {
    slug: "video-bounty-may-2026",
    title: "Zcash Video Explainer Bounty",
    kind: "video",
    status: "completed",
    startDate: d("2026-05-15T00:00:00"),
    endDate: d("2026-06-10T23:59:00"),
    format: "Create Zcash educational or creative videos",
    description:
      "Explain Zcash on camera. Anything from a 30-second reel to a five-minute explainer, in any language. 24 original explainer videos were submitted and $100 in ZEC was paid out across 11 winners.",
    rules:
      "- Original video only. Your face or voice, your script.\n- Post on X (or YouTube with an X post) and tag @ZcashIND.\n- Any Indian language welcome. Subtitles help.\n- No financial advice, no price talk.",
    acceptedFormats: "Reel, YouTube short, explainer, vlog, skit",
    prizePoolUsd: 100,
    submissionCount: 24,
    winnerCount: 11,
    prizes: J([
      { place: "Prize pool", amountUsd: 100, note: "Split across 11 winners, paid in ZEC" },
    ]),
  },
  {
    slug: "mini-meetup-bounty-1-june-2026",
    title: "Mini Meetup Bounty #1",
    kind: "mini_meetup",
    status: "completed",
    startDate: d("2026-06-05T00:00:00"),
    endDate: d("2026-06-30T23:59:00"),
    format: "Host a small, real Zcash meetup and document it",
    description:
      "The first time we asked the community to host, not just attend. Get four or more people in a room, talk about shielded money, help them install a wallet, and post the photos.\n\nThe pool started at $150 and was raised to $200. 14 community members hosted real Zcash meetups across India, and the full $200 was paid out in ZEC.",
    rules:
      "- At least 4 attendees, 2 of them new to Zcash.\n- 20 minutes or longer. A real conversation, not a photo-op.\n- 3+ photos including one group photo with Zcash branding visible.\n- Post the recap on X tagging @ZcashIND.\n- Fake or inflated attendance is disqualification.",
    acceptedFormats: "Meetup recap thread on X with photos",
    prizePoolUsd: 200,
    submissionCount: 14,
    winnerCount: 14,
    prizes: J([
      { place: "Prize pool", amountUsd: 200, note: "Split across 14 hosts, paid in ZEC" },
    ]),
  },
  {
    slug: "regional-content-bounty-july-2026",
    title: "Regional Language Content Bounty",
    kind: "content",
    status: "completed",
    startDate: d("2026-07-20T00:00:00"),
    endDate: d("2026-08-08T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2076288625348943945",
    format: "Educational Zcash content in Indian regional languages",
    description:
      "A first-of-its-kind bounty: explain Zcash in the language people actually think in. Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Rajasthani. Any format, as long as it teaches.\n\n27 submissions came in. The pool was raised from $150 to $200 and paid to 10 winners in ZEC.",
    rules:
      "- Content must be in an Indian regional language (not English).\n- Original work: your script, your voice, your design.\n- Post on X tagging @ZcashIND with the language in the post.\n- Accuracy matters. Content that gets Zcash wrong is not eligible.",
    topics: "What is Zcash, shielded vs transparent, wallets, why privacy matters, Ironwood",
    acceptedFormats: "Video, thread, carousel, infographic, blog, comic",
    prizePoolUsd: 200,
    submissionCount: 27,
    winnerCount: 10,
    prizes: J([
      { place: "1st", amountUsd: 50, note: "Best overall" },
      { place: "2nd", amountUsd: 35, note: "Runner-up" },
      { place: "3rd x3", amountUsd: 25, note: "Three third places" },
      { place: "Honorable mention x3", amountUsd: 10, note: "" },
      { place: "Honorable mention x2", amountUsd: 5, note: "" },
    ]),
    winners: [
      W("validcrypt", "1st", 50, findSub(REGIONAL_SUBMISSIONS, "validcrypt")),
      W("0xAlfiya", "2nd", 35, findSub(REGIONAL_SUBMISSIONS, "0xAlfiya")),
      W("noush7n", "3rd", 25, findSub(REGIONAL_SUBMISSIONS, "noush7n")),
      W("BhupalamS", "3rd", 25, findSub(REGIONAL_SUBMISSIONS, "BhupalamS")),
      W("ucofweb3", "3rd", 25, findSub(REGIONAL_SUBMISSIONS, "ucofweb3")),
      W("AdarshKumar1217", "Honorable mention", 10, findSub(REGIONAL_SUBMISSIONS, "AdarshKumar1217")),
      W("KrrishRath29455", "Honorable mention", 10, findSub(REGIONAL_SUBMISSIONS, "KrrishRath29455")),
      W("VaibhavRaj9538", "Honorable mention", 10, findSub(REGIONAL_SUBMISSIONS, "VaibhavRaj9538")),
      W("CRYPTO___BUNNY", "Honorable mention", 5),
      W("cryptokidxx", "Honorable mention", 5, findSub(REGIONAL_SUBMISSIONS, "cryptokidxx")),
    ],
    submissions: REGIONAL_SUBMISSIONS,
  },
  {
    slug: "mini-meetup-bounty-2-august-2026",
    title: "Mini Meetup Bounty #2",
    kind: "mini_meetup",
    status: "completed",
    startDate: d("2026-08-08T00:00:00"),
    endDate: d("2026-08-24T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2084919775688552584",
    winnerAnnouncementUrl: "https://x.com/ZcashIND/status/2092613796712096066",
    format: "Host a small Zcash meetup covering Ironwood (NU6.3) and Zakura",
    description:
      "Round two of the mini meetups, with a twist: every host had to cover what's new. Ironwood (NU6.3) and Zakura were required topics, so the community learned the roadmap by teaching it.\n\n12 community members hosted. $150 in ZEC was paid out across all 12.",
    rules:
      "- At least 4 attendees, 2 of them new to Zcash.\n- Cover Ironwood (NU6.3) and Zakura in the session.\n- 20 minutes or longer, 3+ photos, one group photo with branding visible.\n- Post the recap on X tagging @ZcashIND.\n- Fake or inflated attendance is disqualification.",
    topics: "Ironwood (NU6.3), Zakura, shielded wallets",
    acceptedFormats: "Meetup recap thread on X with photos",
    prizePoolUsd: 150,
    submissionCount: 12,
    winnerCount: 12,
    prizes: J([
      { place: "1st", amountUsd: 30, note: "Best meetup" },
      { place: "2nd (shared) x2", amountUsd: 20, note: "Two runners-up" },
      { place: "Successful host x9", amountUsd: 10, note: "Every host who met the requirements" },
    ]),
    winners: [
      W("0xAlfiya", "1st", 30, findSub(MINI2_SUBMISSIONS, "0xAlfiya")),
      W("Lakhan_997", "2nd", 20, findSub(MINI2_SUBMISSIONS, "Lakhan_997")),
      W("cryptokidxx", "2nd", 20, findSub(MINI2_SUBMISSIONS, "cryptokidxx")),
      ...MINI2_SUBMISSIONS.filter((u) => {
        const h = xStatus(u)?.toLowerCase();
        return h && !["0xalfiya", "lakhan_997", "cryptokidxx"].includes(h);
      }).map((u) => W(xStatus(u)!, "Successful host", 10, u)),
    ],
    submissions: MINI2_SUBMISSIONS,
  },
  {
    slug: "irl-bounty-september-2026",
    title: "IRL Meetup Bounty",
    kind: "irl_meetup",
    status: "active",
    active: true,
    period: "2026-09",
    windowLabel: "Bounty window: September 2026",
    startDate: d("2026-09-01T00:00:00"),
    endDate: d("2026-09-30T23:59:00"),
    format: "Host a real meetup, get it verified, put your city on the map",
    description:
      "Host a small, real meetup. Get it verified by the Zcash India team. Earn a spot on the map, a share of the prize pool, and a path to becoming a contributor.\n\nSubmit through the form on this site: no account needed. Verified meetups get a node number and appear on the public map.",
    rules:
      "- Meetups must happen inside the bounty window.\n- One submission per meetup.\n- You may host multiple meetups, but only your strongest counts for the main prizes.\n- Real photos only. No AI-generated or manipulated proof.\n- Our team may verify details, contact you, or visit.\n- Fake or inflated attendance means disqualification.\n- The Zcash India team's decisions are final.",
    acceptedFormats: "Submission form on this site",
    prizePoolUsd: 150,
    prizes: J([
      { place: "1st", amountUsd: 40, note: "Best meetup overall" },
      { place: "2nd", amountUsd: 25, note: "Runner-up" },
      { place: "3rd", amountUsd: 20, note: "Third place" },
      { place: "Outstanding x5", amountUsd: 10, note: "5 outstanding meetups" },
      { place: "New-city x5", amountUsd: 3, note: "5 new-city activations" },
    ]),
    minAttendees: 4,
    minNewToZcash: 2,
    minMinutes: 20,
    minPhotos: 3,
    judging: J([
      { label: "Community impact", weight: 30 },
      { label: "Attendance & reach", weight: 20 },
      { label: "Meetup quality", weight: 20 },
      { label: "Geographic impact", weight: 15 },
      { label: "Documentation", weight: 15 },
    ]),
  },
  {
    slug: "explain-zcash-september-2026",
    title: "Explain Zcash Like I'm New",
    kind: "explainer",
    status: "active",
    startDate: d("2026-09-02T00:00:00"),
    endDate: d("2026-09-30T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2097660304138387900",
    format: "Explain one Zcash concept to a beginner, without jargon",
    description:
      "Pick one idea and explain it to someone who has never heard of Zcash. No jargon, no assumptions. If your cousin who has never used crypto gets it, you win.\n\nThe best submissions may become part of a Zcash India Beginner Library that we point every newcomer to.",
    rules:
      "- One concept per entry, explained for a complete beginner.\n- Post on X tagging @ZcashIND.\n- Original work. AI tools are fine, but the idea and the explanation must be yours.\n- No price talk, no financial advice.\n- 16 winners will be announced after the window closes.",
    topics:
      "What is Zcash, why financial privacy matters, what is a shielded transaction, Zcash vs Bitcoin, what is a Zcash wallet, why shouldn't every transaction be public, what makes Zcash different, what is Ironwood",
    acceptedFormats:
      "Video, meme, comic, carousel, illustration, AI content, skit, poster, song or rap, creative social post",
    prizePoolUsd: 150,
    winnerCount: 16,
    prizes: J([
      { place: "Best overall", amountUsd: 25, note: "" },
      { place: "2nd", amountUsd: 20, note: "" },
      { place: "3rd", amountUsd: 15, note: "" },
      { place: "Category winners x5", amountUsd: 10, note: "Funniest, Most creative, Simplest explanation, Best short video, Best regional language" },
      { place: "Community picks x8", amountUsd: 5, note: "Chosen by the community" },
    ]),
  },
];

// ---------------------------------------------------------------------------
// Contributors
// ---------------------------------------------------------------------------

const contributors = [
  {
    slug: "0xalfiya",
    name: "@0xAlfiya",
    xHandle: "0xAlfiya",
    role: "Community host & creator",
    bio: "One of the most consistent contributors in Zcash India. Won 1st place in Mini Meetup Bounty #2 and 2nd place in the Regional Language Content Bounty.",
    meetupsHosted: 1,
    highlights: J(["1st place, Mini Meetup Bounty #2", "2nd place, Regional Language Content Bounty"]),
  },
  {
    slug: "validcrypt",
    name: "@validcrypt",
    xHandle: "validcrypt",
    role: "Content creator",
    bio: "Won 1st place in the Regional Language Content Bounty with an explainer in a regional language that set the bar for the whole round.",
    highlights: J(["1st place, Regional Language Content Bounty ($50)"]),
  },
  {
    slug: "lakhan-997",
    name: "@Lakhan_997",
    xHandle: "Lakhan_997",
    role: "Meetup host",
    bio: "Active meetup host. Won 2nd place in Mini Meetup Bounty #2 and submitted to the Regional Language Content Bounty.",
    meetupsHosted: 1,
    highlights: J(["2nd place, Mini Meetup Bounty #2", "Regional Language Content Bounty entrant"]),
  },
  {
    slug: "cryptokidxx",
    name: "@cryptokidxx",
    xHandle: "cryptokidxx",
    role: "Meetup host & creator",
    bio: "Won 2nd place in Mini Meetup Bounty #2 and an honorable mention in the Regional Language Content Bounty. Shows up for every bounty.",
    meetupsHosted: 1,
    highlights: J(["2nd place, Mini Meetup Bounty #2", "Honorable mention, Regional Language Content Bounty"]),
  },
  {
    slug: "vaibhav-raj-singh-panwar",
    name: "Vaibhav Raj Singh Panwar",
    xHandle: "VaibhavRaj9538",
    role: "Distribution & Partnerships Lead",
    bio: "Started as a community host and content creator: honorable mention in the Regional Language Content Bounty and a Mini Meetup #2 host. Now on the core team leading partnerships, regional content and distribution.",
    meetupsHosted: 1,
    highlights: J(["Core team: Distribution & Partnerships Lead", "Honorable mention, Regional Language Content Bounty", "Host, Mini Meetup Bounty #2"]),
  },
  {
    slug: "krrishrath29455",
    name: "@KrrishRath29455",
    xHandle: "KrrishRath29455",
    role: "Meetup host & creator",
    bio: "Honorable mention in the Regional Language Content Bounty and a host in Mini Meetup Bounty #2. Active across multiple bounties.",
    meetupsHosted: 1,
    highlights: J(["Honorable mention, Regional Language Content Bounty", "Host, Mini Meetup Bounty #2"]),
  },
  {
    slug: "adarshkumar1217",
    name: "@AdarshKumar1217",
    xHandle: "AdarshKumar1217",
    role: "Meetup host & creator",
    bio: "Honorable mention in the Regional Language Content Bounty and a host in Mini Meetup Bounty #2. Active across multiple bounties.",
    meetupsHosted: 1,
    highlights: J(["Honorable mention, Regional Language Content Bounty", "Host, Mini Meetup Bounty #2"]),
  },
  {
    slug: "jayesh-sharma",
    name: "Jayesh Sharma",
    xHandle: "jayesh_iot",
    role: "Media Lead",
    bio: "Hosted a meetup in Mini Meetup Bounty #2, then joined the core team as Media Lead. Shoots and edits every event recording, aftermovie and YouTube upload.",
    meetupsHosted: 1,
    highlights: J(["Core team: Media Lead", "Host, Mini Meetup Bounty #2"]),
  },
].map((c) => ({ official: true, x: `https://x.com/${c.xHandle}`, ...c }));

// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding ZcashIND with real programme data…");

  // Tables that are fully owned by the seed.
  await prisma.bountySubmission.deleteMany();
  await prisma.bountyWinner.deleteMany();
  await prisma.bounty.deleteMany();
  await prisma.lumaEvent.deleteMany();
  await prisma.aftermovie.deleteMany();
  await prisma.featuredPost.deleteMany();
  await prisma.update.deleteMany();
  await prisma.contributor.deleteMany();
  // Community submissions are never seeded, but a reseed starts clean.
  await prisma.meetup.deleteMany();

  for (const e of lumaEvents) await prisma.lumaEvent.create({ data: e });

  let i = 0;
  for (const a of aftermovies) await prisma.aftermovie.create({ data: { ...a, sortOrder: i++ } });

  i = 0;
  for (const p of featuredPosts) await prisma.featuredPost.create({ data: { ...p, sortOrder: i++ } });

  for (const u of updates) await prisma.update.create({ data: u });

  for (const c of contributors) await prisma.contributor.create({ data: c });

  for (const b of bounties) {
    const { winners = [], submissions = [], ...data } = b as typeof b & {
      winners?: ReturnType<typeof W>[];
      submissions?: string[];
    };
    await prisma.bounty.create({
      data: {
        ...data,
        winners: {
          create: winners.map((w, idx) => ({ ...w, sortOrder: idx })),
        },
        submissions: {
          create: submissions.map((url, idx) => ({
            url,
            xHandle: xStatus(url) === "i" ? null : xStatus(url),
            sortOrder: idx,
          })),
        },
      },
    });
  }

  const counts = {
    lumaEvents: await prisma.lumaEvent.count(),
    aftermovies: await prisma.aftermovie.count(),
    featuredPosts: await prisma.featuredPost.count(),
    updates: await prisma.update.count(),
    contributors: await prisma.contributor.count(),
    bounties: await prisma.bounty.count(),
    winners: await prisma.bountyWinner.count(),
    submissions: await prisma.bountySubmission.count(),
    meetups: await prisma.meetup.count(),
  };
  console.log("Done.", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
