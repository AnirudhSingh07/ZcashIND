import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

// Helper: build an IST datetime. Offset +05:30.
function ist(dateTime: string): Date {
  // dateTime like "2026-09-06T18:30"
  return new Date(`${dateTime}:00+05:30`);
}

async function main() {
  console.log("Seeding ZcashIND…");

  // Clean slate
  await prisma.meetup.deleteMany();
  await prisma.contributor.deleteMany();

  // --- Contributors ---
  const aditya = await prisma.contributor.create({
    data: {
      slug: "aditya-verma",
      name: "Aditya Verma",
      bio: "Started the Indore Zcash IRL nodes. Runs privacy talks at colleges across MP. Believes impact beats numbers.",
      city: "Indore",
      telegram: "@aditya_zind",
      x: "https://x.com/ZcashIND",
      official: true,
    },
  });

  const priya = await prisma.contributor.create({
    data: {
      slug: "priya-nair",
      name: "Priya Nair",
      bio: "Runs the Mumbai light client and hosts chai & privacy sessions for freelancers and students.",
      city: "Mumbai",
      telegram: "@priya_zind",
      x: "https://x.com/ZcashIND",
      official: true,
    },
  });

  // --- Official events (kind: official_event) ---
  const officials = [
    {
      title: "Zcash India Meetup — Indore",
      city: "Indore",
      state: "Madhya Pradesh",
      lat: 22.7196,
      lng: 75.8577,
      startsAt: ist("2026-09-06T17:30"),
      endsAt: ist("2026-09-06T20:00"),
      venueType: "coworking",
      venueName: "Bhawar Kuan Coworking",
      format: "privacy_talk",
      description:
        "Our flagship Indore meetup: a plain-language intro to shielded money, a Zashi wallet walkthrough, and open Q&A. Bring a phone.",
      summary: "Flagship Indore meetup — shielded money intro + wallet setup.",
      attendeesTotal: 40,
      attendeesNewToZcash: 22,
      registrationUrl: "https://luma.com/user/zcashindia",
    },
    {
      title: "Zcash India Meetup — Udaipur",
      city: "Udaipur",
      state: "Rajasthan",
      lat: 24.5854,
      lng: 73.7125,
      startsAt: ist("2026-09-13T17:00"),
      endsAt: ist("2026-09-13T19:30"),
      venueType: "cafe",
      venueName: "Lake City Café",
      format: "zcash_intro",
      description:
        "Zcash intro by the lake. What is a shielded transaction, why it matters for freelancers, and how to receive your first ZEC.",
      summary: "Zcash intro for Udaipur freelancers and students.",
      attendeesTotal: 28,
      attendeesNewToZcash: 18,
      registrationUrl: "https://luma.com/user/zcashindia",
    },
    {
      title: "Zcash India Meetup — Vadodara",
      city: "Vadodara",
      state: "Gujarat",
      lat: 22.3072,
      lng: 73.1812,
      startsAt: ist("2026-09-20T16:30"),
      endsAt: ist("2026-09-20T19:00"),
      venueType: "college",
      venueName: "MSU Campus",
      format: "college_discussion",
      description:
        "Campus workshop at MSU Vadodara. Shielded vs transparent, unified addresses, and a testnet-style first transaction walkthrough.",
      summary: "Campus workshop — shielded vs transparent + first tx.",
      attendeesTotal: 55,
      attendeesNewToZcash: 40,
      registrationUrl: "https://luma.com/user/zcashindia",
    },
    {
      title: "Zcash India Live — Online",
      city: "Online",
      state: null,
      lat: 20.5937,
      lng: 78.9629,
      isOnline: true,
      venueType: "online",
      startsAt: ist("2026-09-10T20:00"),
      endsAt: ist("2026-09-10T21:00"),
      format: "live_stream",
      description:
        "Our monthly online series. This month: privacy for remittances and freelancers in India, plus a live wallet Q&A. Join from anywhere.",
      summary: "Monthly online series — privacy for remittances & freelancers.",
      attendeesTotal: 120,
      attendeesNewToZcash: 70,
      registrationUrl: "https://luma.com/user/zcashindia",
    },
  ];

  for (const o of officials) {
    await prisma.meetup.create({
      data: {
        slug: slugify(`${o.city}-official-${o.startsAt.getFullYear()}-${o.title}`),
        kind: "official_event",
        status: "verified",
        country: "India",
        timezone: "Asia/Kolkata",
        language: "English / हिंदी",
        brandingVisible: true,
        durationMinutes: 120,
        verifiedAt: new Date(),
        photos: JSON.stringify([]),
        hostNamePublic: "Zcash India",
        ...o,
      },
    });
  }

  // --- Sample IRL bounty meetups (kind: irl_bounty) ---
  const irl = [
    {
      title: "Chai & Privacy — Ahmedabad",
      city: "Ahmedabad",
      state: "Gujarat",
      lat: 23.0225,
      lng: 72.5714,
      startsAt: ist("2026-08-24T18:00"),
      endsAt: ist("2026-08-24T18:45"),
      venueType: "cafe",
      venueName: "CG Road Chai House",
      format: "chai_privacy",
      description:
        "Six of us over chai talking about why financial privacy matters. Two friends set up Zashi for the first time.",
      summary:
        "Chai & privacy over CG Road. Two first-time Zashi setups, real questions about remittances.",
      attendeesTotal: 6,
      attendeesNewToZcash: 3,
      nodeNumber: 1,
      newCityActivation: false,
      bountyPeriod: null,
      hostNamePublic: "Ravi Shah",
      hostContactPrivate: "@ravi_ahd (Telegram)",
      hostContributorId: null,
      photos: JSON.stringify([
        "/seed/sample-ahmedabad-1.svg",
        "/seed/sample-ahmedabad-2.svg",
        "/seed/sample-ahmedabad-3.svg",
      ]),
    },
    {
      title: "Freelancers & Shielded Money — Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      lat: 19.076,
      lng: 72.8777,
      startsAt: ist("2026-09-07T17:00"),
      endsAt: ist("2026-09-07T18:00"),
      venueType: "coworking",
      venueName: "Andheri Coworking Hub",
      format: "zcash_intro",
      description:
        "Ten freelancers, one hour. We covered shielded vs transparent and how to receive ZEC for cross-border gigs.",
      summary:
        "Mumbai freelancers session — shielded vs transparent for cross-border work.",
      attendeesTotal: 10,
      attendeesNewToZcash: 6,
      nodeNumber: 1,
      newCityActivation: false,
      bountyPeriod: "2026-09",
      hostNamePublic: "Priya Nair",
      hostContactPrivate: "@priya_zind (Telegram)",
      hostContributorId: priya.id,
      photos: JSON.stringify([
        "/seed/sample-mumbai-1.svg",
        "/seed/sample-mumbai-2.svg",
        "/seed/sample-mumbai-3.svg",
      ]),
    },
    {
      title: "First Zcash Meetup — Bhopal",
      city: "Bhopal",
      state: "Madhya Pradesh",
      lat: 23.2599,
      lng: 77.4126,
      startsAt: ist("2026-09-08T18:30"),
      endsAt: ist("2026-09-08T19:15"),
      venueType: "college",
      venueName: "MANIT Bhopal",
      format: "college_discussion",
      description:
        "Bhopal's first-ever Zcash meetup. Five students new to Zcash, one lit a brand new city on the map.",
      summary:
        "Bhopal lights up — the city's first Zcash meetup, five students new to Zcash.",
      attendeesTotal: 8,
      attendeesNewToZcash: 5,
      nodeNumber: 1,
      newCityActivation: true,
      bountyPeriod: "2026-09",
      hostNamePublic: "Sneha Patel",
      hostContactPrivate: "sneha.bhopal@example.com",
      hostContributorId: aditya.id,
      photos: JSON.stringify([
        "/seed/sample-bhopal-1.svg",
        "/seed/sample-bhopal-2.svg",
        "/seed/sample-bhopal-3.svg",
      ]),
    },
  ];

  for (const m of irl) {
    await prisma.meetup.create({
      data: {
        slug: slugify(`${m.city}-irl-${m.startsAt.getTime()}`),
        kind: "irl_bounty",
        status: "verified",
        country: "India",
        timezone: "Asia/Kolkata",
        language: "English / हिंदी",
        brandingVisible: true,
        isOnline: false,
        durationMinutes: 45,
        verifiedAt: new Date(),
        ...m,
      },
    });
  }

  const counts = await prisma.meetup.count();
  const cons = await prisma.contributor.count();
  console.log(`Seeded ${counts} meetups and ${cons} contributors.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
