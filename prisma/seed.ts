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
    createdAt: d("2026-03-05T18:30:00"),
    title: "First bounty: $100 in ZEC for the best Zcash thread",
    tag: "Announcement",
    body: "Two weeks after launch, the first Zcash India bounty went live: write an original thread about Zcash and get paid in ZEC. HackTour India amplified it to 900+ developers.",
    xUrl: "https://x.com/ZcashIND/status/2029622501408657790",
  },
  {
    createdAt: d("2026-03-28T12:00:00"),
    title: "Thread bounty complete: 21 submissions, pool raised to $150",
    tag: "Milestone",
    body: "21 threads came in for a $100 pool. We added $50 and paid 10 winners $150 in ZEC within days. One developer built a working Zcash demo on top.",
  },
  {
    createdAt: d("2026-03-30T12:00:00"),
    title: "ZecHub grant received",
    tag: "Milestone",
    body: "ZecHub funded two months of structured execution: one campus workshop a month, one online event a month, and continued content and bounties.",
  },
  {
    createdAt: d("2026-04-14T19:30:00"),
    title: "First online event: 77 attendees",
    tag: "Event",
    body: "Zcash India Live #01 delivered 77 live attendees on Google Meet, exceeding the 65+ target on day one.",
  },
  {
    createdAt: d("2026-05-02T12:00:00"),
    title: "Meme bounty: 22 memes, pool raised to $120",
    tag: "Milestone",
    body: "The #ZcashIndiaMeme bounty pulled in 22 original memes. Posts crossed 1,000 views organically. We raised the pool from $100 to $120 and paid 10 winners instead of 5.",
  },
  {
    createdAt: d("2026-06-06T12:00:00"),
    title: "Video bounty: 24 explainers in a week",
    tag: "Milestone",
    body: "24 original Zcash explainer videos from the community for the #ZcashIndiaExplainer bounty. $100 in ZEC paid to 11 winners.",
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
    createdAt: d("2026-06-27T12:00:00"),
    title: "Mini Meetup Bounty #1: 14 hosts, pool raised to $200",
    tag: "Milestone",
    body: "The community hosted their own Zcash meetups in colleges, cafés and co-working spaces across India. 14 hosts. We raised the pool from $150 to $200, the third increase in a row.",
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
    createdAt: d("2026-08-26T14:30:00"),
    title: "Mini Meetup Bounty #2: 12 hosts taught Ironwood and Zakura",
    tag: "Milestone",
    body: "12 community members ran meetups in canteens, cafés, hostels and co-working spaces, every one covering Ironwood (NU6.3) and Zakura. $150 in ZEC paid across all 12.",
    xUrl: "https://x.com/ZcashIND/status/2092613796712096066",
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
// Bounties. Source of truth: the monthly forum reports at
// https://forum.zcashcommunity.com/t/zcash-india-2026/54762
// One bounty runs per month. Winners, amounts, prize-pool increases and
// submission links are copied from the reports verbatim.
// ---------------------------------------------------------------------------

const J = (v: unknown) => JSON.stringify(v);

/** Winner row. `handle` = X handle when known; `name` falls back to it. */
const W = (
  place: string,
  prizeUsd: number,
  handle: string | null,
  opts: { name?: string; url?: string } = {},
) => ({
  name: opts.name ?? (handle ? `@${handle}` : "Unknown"),
  xHandle: handle,
  place,
  prizeUsd,
  submissionUrl: opts.url ?? null,
});

/** Find a submission URL for a handle in a list (case-insensitive). */
const sub = (list: string[], handle: string) =>
  list.find((u) => u.toLowerCase().includes(`x.com/${handle.toLowerCase()}/`));

// --- March 2026: Thread-writing bounty ($100 -> $150, 21 submissions, 10 winners)
const THREAD_SUBMISSIONS = [
  "https://x.com/VinayakCho64390/status/2031593233000910851",
  "https://x.com/ucofweb3/status/2032910959899975714",
  "https://x.com/AjFoenix/status/2032739595473874979",
  "https://x.com/CryptoPope89448/status/2032344609154535735",
  "https://x.com/kayceeonyia/status/2031131351911375013",
  "https://x.com/phantom_zxx/status/2032504939688141296",
  "https://x.com/SayanAnkur98274/status/2032355972090642793",
  "https://x.com/theonlyjaycean/status/2032760857927573625",
  "https://x.com/ajayi_lizz/status/2030170845721539000",
];

// --- April 2026: Meme bounty ($100 -> $120, 22 submissions, 10 winners)
const MEME_SUBMISSIONS = [
  "https://x.com/Mokufti/status/2045397522714104227",
  "https://x.com/Abassssssss001/status/2045401948921250258",
  "https://x.com/Ritikdhanotiya0/status/2045400163943121359",
  "https://x.com/y0Madeyra/status/2045437843393376337",
  "https://x.com/Vivek_verse1/status/2045753343100821674",
  "https://x.com/zcashmonster/status/2046129470428610993",
  "https://x.com/chstnIm/status/2046147634927403442",
  "https://x.com/i/status/2046292127525871999",
  "https://x.com/i/status/2046720390320550081",
  "https://x.com/i/status/2045157374345060716",
  "https://x.com/i/status/2047016433218187769",
  "https://x.com/i/status/2047213953546137911",
  "https://x.com/i/status/2047420414503338239",
  "https://x.com/i/status/2047498718476435519",
  "https://x.com/i/status/2047616019737252133",
  "https://x.com/i/status/2047554749172449641",
  "https://x.com/i/status/2047395627089215595",
  "https://x.com/i/status/2047385298665881768",
  "https://x.com/i/status/2046267734019936278",
];

// --- May 2026: Video explainer bounty ($100, 24 submissions, 11 winners)
const VIDEO_SUBMISSIONS = [
  "https://x.com/RongkaySatu/status/2060794976712392826",
  "https://x.com/Ritikdhanotiya0/status/2060739264812613751",
  "https://x.com/jadav_sen79153/status/2060674227817353594",
  "https://x.com/VaibhavRaj9538/status/2060666473186775040",
  "https://x.com/tushar1962005/status/2060420021751611583",
  "https://x.com/0xSalsa/status/2060091343989572010",
  "https://x.com/tushar1962005/status/2059620927818908142",
  "https://x.com/zalmahrajan/status/2059399525316595915",
  "https://x.com/_zaideth/status/2058694268475088901",
  "https://x.com/global_loba/status/2058628531840577602",
  "https://x.com/JinLongMed/status/2058628432825647457",
  "https://x.com/NFA_WIN/status/2058561221939298511",
  "https://x.com/_Phoenix_x0/status/2058499906151887343",
  "https://x.com/duwoliipche/status/2058465648758661301",
  "https://x.com/arimahe44856801/status/2058255729266741530",
  "https://x.com/ucofweb3/status/2060783650757554283",
  "https://x.com/AjFoenix/status/2060749089881424176",
  "https://x.com/sadeeq_abbakarr/status/2059157023858495949",
  "https://x.com/Ra_yyann/status/2060684787321380945",
  "https://x.com/CryptoPope89448/status/2059652740498776532",
  "https://x.com/justamonstar/status/2058505128928252203",
  "https://x.com/pcoke_og/status/2058500153376637068",
  "https://x.com/Exceptional9122/status/2058500261044183378",
  "https://x.com/_Phoenix_x0/status/2058487481100890207",
];

// --- June 2026: Mini Meetup Bounty #1 ($150 -> $200, 14 hosts, 14 winners)
const MINI1_SUBMISSIONS = [
  "https://x.com/0xAlfiya/status/2068238999219786230",
  "https://x.com/DevendraPrgo/status/2068959322542108721",
  "https://x.com/AdarshKumar1217/status/2067201691297231102",
  "https://x.com/KrrishRath29455/status/2067243397061185698",
  "https://x.com/VaibhavRaj9538/status/2066557630882152646",
  "https://x.com/saurabhnage624/status/2068216602818904301",
  "https://x.com/VinayakCho64390/status/2068225682724020237",
  "https://x.com/KartikM16956282/status/2069094095977586732",
  "https://x.com/SisodiyaRa92495/status/2069094295605539278",
  "https://x.com/GaganMewad25/status/2069735982803677605",
  "https://x.com/Vanshanjana9009/status/2069790087559422278",
  "https://x.com/i/status/2069838752789541031",
  "https://x.com/tushar1962005/status/2066918824730136856",
];

// --- July 2026: Regional language content bounty ($150 -> $200, 27 submissions, 10 winners)
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
  "https://x.com/CRYPTO___BUNNY/status/2079132085001044392",
  "https://x.com/web3withBurian/status/2080605524878352825",
  "https://x.com/BhupalamS/status/2080708465883074816",
  "https://x.com/l_etim/status/2080718705596735559",
  "https://x.com/VaibhavRaj9538/status/2080714116042568084",
  "https://x.com/0xAlfiya/status/2080648166152810778",
];

// --- August 2026: Mini Meetup Bounty #2 ($150, 12 hosts, 12 winners)
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

const bounties = [
  {
    slug: "thread-bounty-march-2026",
    title: "Zcash Thread Writing Bounty",
    kind: "content",
    status: "completed",
    startDate: d("2026-03-05T00:00:00"),
    endDate: d("2026-03-28T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2029622501408657790",
    format: "Write an original thread about Zcash on X",
    description:
      "The first Zcash India bounty, launched two weeks after the community did. Write a thread about Zcash: privacy, zero-knowledge proofs, why it matters for India, or your own builder journey.\n\nWe launched with a $100 pool for the top 3 threads. 21 submissions came in, reviewed on content quality, graphics, reach, originality, effort and overall impact. We added $50 to the pool and paid $150 in ZEC to 10 winners, all within days of the announcement. One developer went further and built a working demo of Zcash's mechanism at zcash-delta.vercel.app.",
    rules:
      "- Original thread on X about Zcash. Any angle: privacy, ZK proofs, India, your builder story.\n- Tag @ZcashIND.\n- Judged on content quality, graphics, reach, originality, effort and impact.",
    topics: "Privacy, zero-knowledge proofs, why Zcash matters for India, builder journeys",
    acceptedFormats: "Thread on X",
    initialPrizePoolUsd: 100,
    prizePoolUsd: 150,
    submissionCount: 21,
    winnerCount: 10,
    prizes: J([
      { place: "1st", amountUsd: 60, note: "" },
      { place: "2nd", amountUsd: 25, note: "" },
      { place: "3rd", amountUsd: 15, note: "" },
      { place: "Outstanding x3", amountUsd: 10, note: "Added when the pool was raised" },
      { place: "Outstanding x4", amountUsd: 5, note: "Added when the pool was raised" },
    ]),
    winners: [
      W("1st", 60, null, { name: "Web3Oracle" }),
      W("2nd", 25, null, { name: "JOKER" }),
      W("3rd", 15, null, { name: "Arslan" }),
      W("Outstanding", 10, "VinayakCho64390", { url: sub(THREAD_SUBMISSIONS, "VinayakCho64390") }),
      W("Outstanding", 10, null, { name: "De_wave" }),
      W("Outstanding", 10, null, { name: "DhruvxBug" }),
      W("Outstanding", 5, null, { name: "Tushar" }),
      W("Outstanding", 5, "ucofweb3", { url: sub(THREAD_SUBMISSIONS, "ucofweb3") }),
      W("Outstanding", 5, "AjFoenix", { url: sub(THREAD_SUBMISSIONS, "AjFoenix") }),
      W("Outstanding", 5, null, { name: "Bigoche" }),
    ],
    submissions: THREAD_SUBMISSIONS,
  },
  {
    slug: "meme-bounty-april-2026",
    title: "Zcash India Meme Bounty",
    kind: "meme",
    status: "completed",
    startDate: d("2026-04-17T00:00:00"),
    endDate: d("2026-04-30T23:59:00"),
    format: "Create an original, positive meme about privacy or Zcash",
    description:
      "Create an original, positive meme about financial privacy or Zcash, post it on X tagging @ZcashIND with #ZcashIndiaMeme.\n\nAnnounced as $100 for 5 winners at $20 each. 22 original memes came in. Multiple posts crossed 1,000 views organically and some got 60+ reposts. Because the quality was so high we raised the pool to $120 and paid 10 winners instead of 5.",
    rules:
      "- Original meme. No reposts.\n- Positive: about privacy or Zcash, not against anything.\n- Post on X, tag @ZcashIND, use #ZcashIndiaMeme.",
    acceptedFormats: "Image meme, short video meme",
    initialPrizePoolUsd: 100,
    prizePoolUsd: 120,
    submissionCount: 22,
    winnerCount: 10,
    prizes: J([
      { place: "Main winners x4", amountUsd: 20, note: "" },
      { place: "Runner-up", amountUsd: 10, note: "" },
      { place: "Special mentions x6", amountUsd: 5, note: "Added when the pool was raised" },
    ]),
    winners: [
      W("Main winner", 20, "Ritikdhanotiya0", { url: sub(MEME_SUBMISSIONS, "Ritikdhanotiya0") }),
      W("Main winner", 20, "Vivek_verse1", { url: sub(MEME_SUBMISSIONS, "Vivek_verse1") }),
      W("Main winner", 20, "ucofweb3"),
      W("Main winner", 20, "Iyimmanuel"),
      W("Runner-up", 10, "W3Mayor"),
      W("Special mention", 5, "y0Madeyra", { url: sub(MEME_SUBMISSIONS, "y0Madeyra") }),
      W("Special mention", 5, "zcashmonster", { url: sub(MEME_SUBMISSIONS, "zcashmonster") }),
      W("Special mention", 5, "chstnIm", { url: sub(MEME_SUBMISSIONS, "chstnIm") }),
      W("Special mention", 5, "AjFoenix"),
      W("Special mention", 5, "zalmahrajan"),
      W("Special mention", 5, "Satuno_Nakara"),
    ],
    submissions: MEME_SUBMISSIONS,
  },
  {
    slug: "video-bounty-may-2026",
    title: "Zcash India Video Explainer Bounty",
    kind: "video",
    status: "completed",
    startDate: d("2026-05-22T00:00:00"),
    endDate: d("2026-05-31T23:59:00"),
    format: "Make a short, beginner-friendly explainer video about Zcash",
    description:
      "After the meme bounty proved the community makes real content when given a prompt, we raised the bar from memes to education. Create a short explainer about Zcash, financial privacy, ZK proofs or shielded transactions. Post it on X with #ZcashIndiaExplainer.\n\n24 original explainer videos came in: screen recordings, talking-head videos and visual breakdowns. $100 in ZEC was paid to 11 winners.",
    rules:
      "- Original, positive, beginner-friendly video.\n- Post on X, tag @ZcashIND, use #ZcashIndiaExplainer.\n- Drop the link in the Telegram group.",
    topics: "What is Zcash, financial privacy, ZK proofs, shielded transactions",
    acceptedFormats: "Short video, screen recording, talking-head explainer",
    prizePoolUsd: 100,
    submissionCount: 24,
    winnerCount: 11,
    prizes: J([
      { place: "Top winners x2", amountUsd: 20, note: "" },
      { place: "Runners-up x3", amountUsd: 10, note: "" },
      { place: "Special mentions x6", amountUsd: 5, note: "" },
    ]),
    winners: [
      W("Top winner", 20, "ucofweb3", { url: sub(VIDEO_SUBMISSIONS, "ucofweb3") }),
      W("Top winner", 20, "AjFoenix", { url: sub(VIDEO_SUBMISSIONS, "AjFoenix") }),
      W("Runner-up", 10, "Ra_yyann", { url: sub(VIDEO_SUBMISSIONS, "Ra_yyann") }),
      W("Runner-up", 10, "tushar1962005", { url: sub(VIDEO_SUBMISSIONS, "tushar1962005") }),
      W("Runner-up", 10, "VaibhavRaj9538", { url: sub(VIDEO_SUBMISSIONS, "VaibhavRaj9538") }),
      W("Special mention", 5, "Ritikdhanotiya0", { url: sub(VIDEO_SUBMISSIONS, "Ritikdhanotiya0") }),
      W("Special mention", 5, "JinLongMed", { url: sub(VIDEO_SUBMISSIONS, "JinLongMed") }),
      W("Special mention", 5, "arimahe44856801", { url: sub(VIDEO_SUBMISSIONS, "arimahe44856801") }),
      W("Special mention", 5, "sadeeq_abbakarr", { url: sub(VIDEO_SUBMISSIONS, "sadeeq_abbakarr") }),
      W("Special mention", 5, "CryptoPope89448", { url: sub(VIDEO_SUBMISSIONS, "CryptoPope89448") }),
      W("Special mention", 5, "Exceptional9122", { url: sub(VIDEO_SUBMISSIONS, "Exceptional9122") }),
    ],
    submissions: VIDEO_SUBMISSIONS,
  },
  {
    slug: "mini-meetup-bounty-1-june-2026",
    title: "Mini Meetup Bounty #1",
    kind: "mini_meetup",
    status: "completed",
    startDate: d("2026-06-12T00:00:00"),
    endDate: d("2026-06-25T23:59:00"),
    format: "Host your own Zcash mini meetup and post the recap",
    description:
      "Instead of us going to one city at a time, the community hosted their own. Get a few people together in a college, café or co-working space, talk about privacy and Zcash, and post the photos with #ZcashIndiaMeetup.\n\n14 community members hosted real, in-person meetups across India. The submissions were strong enough that we raised the pool from $150 to $200, the third bounty in a row where the community over-delivered. $200 in ZEC went to all 14 hosts.",
    rules:
      "- A real, in-person meetup. Photos required.\n- Cover what Zcash is and why financial privacy matters.\n- Post the recap on X with #ZcashIndiaMeetup, tag @ZcashIND.",
    acceptedFormats: "Meetup recap post on X with photos",
    initialPrizePoolUsd: 150,
    prizePoolUsd: 200,
    submissionCount: 14,
    winnerCount: 14,
    prizes: J([
      { place: "1st", amountUsd: 30, note: "" },
      { place: "2nd x3", amountUsd: 20, note: "" },
      { place: "Special mentions x2", amountUsd: 15, note: "" },
      { place: "Honourable mentions x8", amountUsd: 10, note: "Every other host who met the bar" },
    ]),
    winners: [
      W("1st", 30, "0xAlfiya", { url: sub(MINI1_SUBMISSIONS, "0xAlfiya") }),
      W("2nd", 20, "saurabhnage624", { url: sub(MINI1_SUBMISSIONS, "saurabhnage624") }),
      W("2nd", 20, "DevendraPrgo", { url: sub(MINI1_SUBMISSIONS, "DevendraPrgo") }),
      W("2nd", 20, "GaganMewad25", { url: sub(MINI1_SUBMISSIONS, "GaganMewad25") }),
      W("Special mention", 15, "AdarshKumar1217", { url: sub(MINI1_SUBMISSIONS, "AdarshKumar1217") }),
      W("Special mention", 15, "VaibhavRaj9538", { url: sub(MINI1_SUBMISSIONS, "VaibhavRaj9538") }),
      W("Honourable mention", 10, "KrrishRath29455", { url: sub(MINI1_SUBMISSIONS, "KrrishRath29455") }),
      W("Honourable mention", 10, "VinayakCho64390", { url: sub(MINI1_SUBMISSIONS, "VinayakCho64390") }),
      W("Honourable mention", 10, "KartikM16956282", { url: sub(MINI1_SUBMISSIONS, "KartikM16956282") }),
      W("Honourable mention", 10, "SisodiyaRa92495", { url: sub(MINI1_SUBMISSIONS, "SisodiyaRa92495") }),
      W("Honourable mention", 10, "Afs59551988"),
      W("Honourable mention", 10, "Vanshanjana9009", { url: sub(MINI1_SUBMISSIONS, "Vanshanjana9009") }),
      W("Honourable mention", 10, "krunverma"),
      W("Honourable mention", 10, "tushar1962005", { url: sub(MINI1_SUBMISSIONS, "tushar1962005") }),
    ],
    submissions: MINI1_SUBMISSIONS,
  },
  {
    slug: "regional-content-bounty-july-2026",
    title: "Regional Language Content Bounty",
    kind: "content",
    status: "completed",
    startDate: d("2026-07-06T00:00:00"),
    endDate: d("2026-07-24T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2076288625348943945",
    format: "Educational Zcash content in an Indian regional language",
    description:
      "A first-of-its-kind bounty: explain Zcash in the language people actually think in. Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Rajasthani, or any other Indian language. There was almost zero crypto privacy content in Indian regional languages anywhere. The community started changing that.\n\nAnnounced with a $150 pool (1st $50, 2nd $35, 3rd $25, eight $5 participation rewards). 27 submissions came in, including Bhojpuri, Gujarati, Telugu, Malayalam, Malvi and Hindi explainers. We raised the pool to $200, the fourth increase in a row, and paid 10 winners.",
    rules:
      "- Content in an Indian regional language (add English or Hindi subtitles to videos).\n- Post on X, tag @ZecHub, @ZcashIND and @Zcash, use #ZcashINDBounty.\n- Share your post link in the community.\n- Deadline: 24 July 2026.",
    topics: "What is Zcash, why financial privacy matters, shielded vs transparent addresses, Zcash wallets, real-world use cases, privacy myths",
    acceptedFormats: "Short video, AI-generated video, voice-over explainer, article or blog, carousel, infographic, AI-generated educational content",
    initialPrizePoolUsd: 150,
    prizePoolUsd: 200,
    submissionCount: 27,
    winnerCount: 10,
    prizes: J([
      { place: "1st", amountUsd: 50, note: "" },
      { place: "2nd", amountUsd: 35, note: "" },
      { place: "3rd x3", amountUsd: 25, note: "Three third places after the pool was raised" },
      { place: "Honorable mentions x3", amountUsd: 10, note: "" },
      { place: "Honorable mentions x2", amountUsd: 5, note: "" },
    ]),
    winners: [
      W("1st", 50, "validcrypt", { url: sub(REGIONAL_SUBMISSIONS, "validcrypt") }),
      W("2nd", 35, "0xAlfiya", { url: sub(REGIONAL_SUBMISSIONS, "0xAlfiya") }),
      W("3rd", 25, "noush7n", { url: sub(REGIONAL_SUBMISSIONS, "noush7n") }),
      W("3rd", 25, "BhupalamS", { url: sub(REGIONAL_SUBMISSIONS, "BhupalamS") }),
      W("3rd", 25, "ucofweb3", { url: sub(REGIONAL_SUBMISSIONS, "ucofweb3") }),
      W("Honorable mention", 10, "AdarshKumar1217", { url: sub(REGIONAL_SUBMISSIONS, "AdarshKumar1217") }),
      W("Honorable mention", 10, "KrrishRath29455", { url: sub(REGIONAL_SUBMISSIONS, "KrrishRath29455") }),
      W("Honorable mention", 10, "VaibhavRaj9538", { url: sub(REGIONAL_SUBMISSIONS, "VaibhavRaj9538") }),
      W("Honorable mention", 5, "CRYPTO___BUNNY", { url: sub(REGIONAL_SUBMISSIONS, "CRYPTO___BUNNY") }),
      W("Honorable mention", 5, "cryptokidxx", { url: sub(REGIONAL_SUBMISSIONS, "cryptokidxx") }),
    ],
    submissions: REGIONAL_SUBMISSIONS,
  },
  {
    slug: "mini-meetup-bounty-2-august-2026",
    title: "Mini Meetup Bounty #2",
    kind: "mini_meetup",
    status: "completed",
    startDate: d("2026-08-05T00:00:00"),
    endDate: d("2026-08-25T23:59:00"),
    announcementUrl: "https://x.com/ZcashIND/status/2084919775688552584",
    winnerAnnouncementUrl: "https://x.com/ZcashIND/status/2092613796712096066",
    format: "Host a Zcash mini meetup covering Ironwood (NU6.3) and Zakura",
    description:
      "Round two of the mini meetups, with a twist: July was one of the biggest months in Zcash history and most people in India had not heard about it. Every meetup had to cover Ironwood (NU6.3) and Zakura, so the community learned the roadmap by teaching it.\n\n12 community members hosted in canteens, cafés, hostels and co-working spaces. Each host needed at least 4 attendees with half of them new to Zcash. $150 in ZEC was paid across all 12.",
    rules:
      "- At least 4 attendees, 50% new to Zcash.\n- Cover Ironwood (NU6.3) and Zakura in the session.\n- Real photos of the meetup.\n- Post the recap on X and tag @ZcashIND.",
    topics: "Ironwood (NU6.3), Zakura, shielded transactions",
    acceptedFormats: "Meetup recap post on X with photos",
    prizePoolUsd: 150,
    submissionCount: 12,
    winnerCount: 12,
    prizes: J([
      { place: "1st", amountUsd: 30, note: "" },
      { place: "2nd (shared) x2", amountUsd: 20, note: "" },
      { place: "Successful hosts x9", amountUsd: 10, note: "Every host who met all requirements" },
    ]),
    winners: [
      W("1st", 30, "0xAlfiya", { url: sub(MINI2_SUBMISSIONS, "0xAlfiya") }),
      W("2nd", 20, "Lakhan_997", { url: sub(MINI2_SUBMISSIONS, "Lakhan_997") }),
      W("2nd", 20, "cryptokidxx", { url: sub(MINI2_SUBMISSIONS, "cryptokidxx") }),
      ...MINI2_SUBMISSIONS.filter((u) => {
        const h = xStatus(u)?.toLowerCase();
        return h && !["0xalfiya", "lakhan_997", "cryptokidxx"].includes(h);
      }).map((u) => W("Successful host", 10, xStatus(u)!, { url: u })),
    ],
    submissions: MINI2_SUBMISSIONS,
  },
  {
    // The standing IRL meetup programme behind /bounties/irl and the submit
    // form. Its September window is closed; the form stays open for the map.
    slug: "irl-bounty-september-2026",
    title: "IRL Meetup Bounty",
    kind: "irl_meetup",
    status: "completed",
    active: true,
    period: "2026-09",
    windowLabel: "September 2026 window: closed",
    startDate: d("2026-09-01T00:00:00"),
    endDate: d("2026-09-10T23:59:00"),
    format: "Host a real meetup, get it verified, put your city on the map",
    description:
      "Host a small, real meetup. Get it verified by the Zcash India team. Verified meetups get a node number and appear on the public map.\n\nSubmit through the form on this site: no account needed.",
    rules:
      "- One submission per meetup.\n- Real photos only. No AI-generated or manipulated proof.\n- Our team may verify details, contact you, or visit.\n- Fake or inflated attendance means disqualification.\n- The Zcash India team's decisions are final.",
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
    startDate: d("2026-09-09T00:00:00"),
    endDate: null,
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
  // Community submissions are never seeded, but a reseed starts clean.
  await prisma.meetup.deleteMany();

  for (const e of lumaEvents) await prisma.lumaEvent.create({ data: e });

  let i = 0;
  for (const a of aftermovies) await prisma.aftermovie.create({ data: { ...a, sortOrder: i++ } });

  i = 0;
  for (const p of featuredPosts) await prisma.featuredPost.create({ data: { ...p, sortOrder: i++ } });

  for (const u of updates) await prisma.update.create({ data: u });

  for (const b of bounties) {
    const { winners = [], submissions = [], ...data } = b as (typeof bounties)[number] & {
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
