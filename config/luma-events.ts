/**
 * Real Zcash India events, pulled from the official Luma:
 *   https://luma.com/user/zcashindia
 *
 * `slug` is the lu.ma short code. The public event page is https://lu.ma/<slug>
 * and the embeddable preview is https://luma.com/embed/event/<slug>/simple
 * (verified frameable — no X-Frame-Options).
 *
 * To add a new event: copy its lu.ma link, drop the slug + details here.
 */

export type LumaEvent = {
  slug: string;
  title: string;
  /** ISO datetime in IST (+05:30). */
  startsAt: string;
  city: string; // "Online" for the Live series
  venue?: string;
  isOnline: boolean;
  series: "live" | "dev" | "irl"; // grouping
  coHosts?: string;
};

// Newest first.
export const lumaEvents: LumaEvent[] = [
  {
    slug: "8scuih0r",
    title: "Zcash IND Developer Workshop #03",
    startsAt: "2026-08-22T17:00:00+05:30",
    city: "Online",
    isOnline: true,
    series: "dev",
  },
  {
    slug: "dukui59n",
    title: "Zcash Community Connect: Surat Edition",
    startsAt: "2026-08-13T11:00:00+05:30",
    city: "Surat",
    venue: "P P Savani University – Vesu, Surat NIC Campus",
    isOnline: false,
    series: "irl",
    coHosts: "PU DAO & Web3surat",
  },
  {
    slug: "z0hxivdc",
    title: "NEAR Legion India × Zcash India Builder Workshop | Ahmedabad",
    startsAt: "2026-08-10T12:30:00+05:30",
    city: "Ahmedabad",
    venue: "L.D. College of Engineering",
    isOnline: false,
    series: "irl",
    coHosts: "PU DAO & Swayam",
  },
  {
    slug: "aq163nqq",
    title: "ZcashIND Live #05: Ironwood & Ecosystem Update",
    startsAt: "2026-08-09T16:30:00+05:30",
    city: "Online",
    isOnline: true,
    series: "live",
  },
  {
    slug: "t1kopefw",
    title: "Zcash IND Developer Workshop #02",
    startsAt: "2026-07-22T16:30:00+05:30",
    city: "Online",
    venue: "ZecHub Hackathon",
    isOnline: true,
    series: "dev",
  },
  {
    slug: "e0yvb64e",
    title: "ZcashIND Live #04: From Wallets To Builders",
    startsAt: "2026-07-16T17:00:00+05:30",
    city: "Online",
    isOnline: true,
    series: "live",
  },
  {
    slug: "y4o0fdyr",
    title: "Introduction to Zcash: Bhopal Edition",
    startsAt: "2026-07-13T10:30:00+05:30",
    city: "Bhopal",
    venue: "Oriental Institute of Science and Technology",
    isOnline: false,
    series: "irl",
    coHosts: "Arnav Tiwari & Ayush Malviya",
  },
  {
    slug: "qcyft7m0",
    title: "ZCash IND Developer Workshop #01",
    startsAt: "2026-06-28T17:30:00+05:30",
    city: "Online",
    venue: "ZecHub Hackathon",
    isOnline: true,
    series: "dev",
  },
  {
    slug: "aye9lq9s",
    title: "Zcash Community Connect: Vadodara Edition",
    startsAt: "2026-06-18T12:30:00+05:30",
    city: "Vadodara",
    venue: "Parul University",
    isOnline: false,
    series: "irl",
    coHosts: "Saurabh Nage, PU DAO & Khushi Pradhan",
  },
  {
    slug: "hqvdlxv7",
    title: "Zcash IND Ecosystem Live #03: Privacy & What's New",
    startsAt: "2026-06-13T17:00:00+05:30",
    city: "Online",
    isOnline: true,
    series: "live",
  },
  {
    slug: "ehp8fmq5",
    title: "Exploring Zcash Ecosystem: Udaipur Edition",
    startsAt: "2026-05-27T10:30:00+05:30",
    city: "Udaipur",
    venue: "Geetanjali Institute of Technical Studies (GITS)",
    isOnline: false,
    series: "irl",
  },
  {
    slug: "k6mrjz81",
    title: "Zcash IND LIVE #02: Privacy, Crypto & The Future",
    startsAt: "2026-05-22T17:00:00+05:30",
    city: "Online",
    isOnline: true,
    series: "live",
  },
  {
    slug: "2snzqd45",
    title: "Exploring Zcash Ecosystem: Indore Edition",
    startsAt: "2026-04-16T11:00:00+05:30",
    city: "Indore",
    venue: "Acropolis Institute of Technology and Research (AITR)",
    isOnline: false,
    series: "irl",
  },
  {
    slug: "3n364m7y",
    title: "Zcash India Live #01: Privacy, ZK Proofs & What's Next",
    startsAt: "2026-04-14T17:00:00+05:30",
    city: "Online",
    isOnline: true,
    series: "live",
  },
];

export function lumaUrl(slug: string): string {
  return `https://lu.ma/${slug}`;
}

export function lumaEmbedUrl(slug: string): string {
  return `https://luma.com/embed/event/${slug}/simple`;
}
