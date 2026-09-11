import { NextResponse } from "next/server";
import { getZecPrice } from "@/lib/zec-price";

/** Small JSON endpoint the hero polls to keep the hiker moving. */
export async function GET() {
  const data = await getZecPrice(20);
  if (!data) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json(
    { ok: true, ...data },
    { headers: { "cache-control": "public, max-age=15, stale-while-revalidate=30" } },
  );
}
