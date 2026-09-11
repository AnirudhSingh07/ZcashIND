/**
 * Current ZEC price.
 *
 * Spot price comes from Coinbase (real-time, no key, reachable from every
 * region), with Kraken and then CoinGecko as fallbacks. The 24h change comes
 * from CoinGecko, which lags a few minutes but is fine for a percentage.
 * Cached by Next's fetch cache; the hero polls /api/zec-price every 20s.
 */
export type ZecPrice = {
  price: number;
  change24h: number | null;
  source: "coinbase" | "kraken" | "coingecko";
  fetchedAt: string;
};

const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

async function getJson<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate }, headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function coinbase(revalidate: number): Promise<number | null> {
  const d = await getJson<{ data?: { amount?: string } }>("https://api.coinbase.com/v2/prices/ZEC-USD/spot", revalidate);
  const n = Number(d?.data?.amount);
  return ok(n) ? n : null;
}

async function kraken(revalidate: number): Promise<number | null> {
  const d = await getJson<{ result?: Record<string, { c?: string[] }> }>("https://api.kraken.com/0/public/Ticker?pair=ZECUSD", revalidate);
  const first = d?.result ? Object.values(d.result)[0] : undefined;
  const n = Number(first?.c?.[0]);
  return ok(n) ? n : null;
}

async function coingecko(revalidate: number): Promise<{ price: number | null; change: number | null }> {
  const d = await getJson<{ zcash?: { usd?: number; usd_24h_change?: number } }>(
    "https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd&include_24hr_change=true&precision=2",
    revalidate,
  );
  return {
    price: ok(d?.zcash?.usd) ? d!.zcash!.usd! : null,
    change: typeof d?.zcash?.usd_24h_change === "number" ? d.zcash.usd_24h_change : null,
  };
}

export async function getZecPrice(revalidate = 20): Promise<ZecPrice | null> {
  const [cb, gecko] = await Promise.all([coinbase(revalidate), coingecko(Math.max(revalidate, 120))]);
  let price = cb;
  let source: ZecPrice["source"] = "coinbase";
  if (price == null) {
    price = await kraken(revalidate);
    source = "kraken";
  }
  if (price == null && gecko.price != null) {
    price = gecko.price;
    source = "coingecko";
  }
  if (price == null) return null;
  return { price, change24h: gecko.change, source, fetchedAt: new Date().toISOString() };
}
