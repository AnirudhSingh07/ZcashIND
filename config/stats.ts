/**
 * Headline community numbers that can't be derived from the database.
 * Update these in one place; they show up in the homepage hero and stat cards.
 *
 * Last updated: September 2026 (from the Zcash India 2026 forum report).
 */
export const siteStats = {
  since: 2026,
  xFollowers: 1536,
  telegramMembers: 1332,
  instagramFollowers: 13,
  /** Total headcount across IRL campus editions (Udaipur 192, Vadodara 229, Bhopal 216, Surat 160, Ahmedabad 50, Indore 50). */
  totalIrlAttendees: 897,
  /** Zodl / Zashi wallets created on the spot at events. */
  walletsCreated: 850,
  zecDistributed: true,
} as const;

/** "1,500+" style rounding for display. */
export function roundedPlus(n: number): string {
  if (n < 100) return String(n);
  const step = n >= 1000 ? 100 : 10;
  const floored = Math.floor(n / step) * step;
  return `${floored.toLocaleString("en-IN")}+`;
}
