import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ZcashIND seed.
 *
 * Official events are sourced from the live Luma (config/luma-events.ts) and
 * rendered directly — they are NOT stored here. The database holds only
 * community-submitted IRL meetups, which start empty and fill up as real hosts
 * submit them and admins verify them.
 *
 * So a fresh seed intentionally leaves the meetup/contributor tables empty:
 * the map shows the real Luma event cities out of the box, with no placeholder
 * data. Add real contributors below once you have them.
 */
async function main() {
  console.log("Seeding ZcashIND (clean slate — no placeholder data)…");

  await prisma.meetup.deleteMany();
  await prisma.contributor.deleteMany();

  // --- Add real contributors here when ready, e.g. ---
  // await prisma.contributor.create({
  //   data: { slug: "your-slug", name: "Full Name", city: "City",
  //           telegram: "@handle", official: true, bio: "…" },
  // });

  const meetups = await prisma.meetup.count();
  const contributors = await prisma.contributor.count();
  console.log(
    `Done. Meetups: ${meetups}, Contributors: ${contributors}. ` +
      `Official events come from config/luma-events.ts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
