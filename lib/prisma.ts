import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * One Prisma client per process. Prisma Postgres (on Vercel) hands out a
 * `prisma+postgres://` URL that goes through Accelerate, so the client is
 * always extended with it; on a plain `postgres://` URL the extension is
 * a pass-through.
 */
function make() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(withAccelerate());
}

type Client = ReturnType<typeof make>;
const globalForPrisma = globalThis as unknown as { prisma: Client | undefined };

export const prisma: Client = globalForPrisma.prisma ?? make();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
