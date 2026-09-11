import { NextResponse } from "next/server";
import { getZecPrice } from "@/lib/zec-price";

/** Small JSON endpoint the hero polls to keep the hiker moving. */
export async function GET() {
  const data = await getZecPrice(15);
  if (!data) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json(
    { ok: true, ...data },
    { headers: { "cache-control": "public, max-age=10, stale-while-revalidate=20" } },
  );
}
