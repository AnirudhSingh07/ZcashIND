/**
 * Current ZEC price from CoinGecko's free API (no key needed).
 * Cached by Next's fetch cache and revalidated every 5 minutes on the server;
 * the client can poll /api/zec-price for a fresher read.
 */
export type ZecPrice = {
  price: number;
  change24h: number;
  fetchedAt: string;
};

const URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true";

export async function getZecPrice(revalidate = 300): Promise<ZecPrice | null> {
  try {
    const res = await fetch(URL, {
      next: { revalidate },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      zcash?: { usd?: number; usd_24h_change?: number };
    };
    const price = data.zcash?.usd;
    if (typeof price !== "number" || !Number.isFinite(price)) return null;
    return {
      price,
      change24h: typeof data.zcash?.usd_24h_change === "number" ? data.zcash.usd_24h_change : 0,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
