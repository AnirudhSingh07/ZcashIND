import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "zind_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return process.env.ADMIN_COOKIE_SECRET || "dev-insecure-secret";
}

/** Create a signed token: base64(payload).hmac */
function sign(payload: string): string {
  const h = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${h}`;
}

function verify(token: string | undefined): boolean {
  if (!token) return false;
  const [b64, mac] = token.split(".");
  if (!b64 || !mac) return false;
  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("hex");
  // constant-time compare
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  // check expiry embedded in payload: "admin:<expiresAtMs>"
  const parts = payload.split(":");
  const exp = Number(parts[1]);
  if (!exp || Date.now() > exp) return false;
  return parts[0] === "admin";
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createAdminSession() {
  const payload = `admin:${Date.now() + MAX_AGE * 1000}`;
  const token = sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verify(store.get(COOKIE_NAME)?.value);
}

/** Redirect to the login page if not authenticated. Call at the top of admin pages. */
export async function requireAdmin(): Promise<void> {
  const { redirect } = await import("next/navigation");
  if (!(await isAdmin())) redirect("/admin/login");
}
