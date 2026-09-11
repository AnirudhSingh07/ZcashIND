import { NextResponse, type NextRequest } from "next/server";

/**
 * One deployment, two hostnames.
 *
 *   zcashind.com        the public site; /admin is not served here
 *   admin.zcashind.com  only the admin; everything else redirects to /admin
 *
 * ADMIN_HOST is the admin hostname. Preview deployments and localhost serve
 * both so nothing is blocked while developing.
 */
const ADMIN_HOST = (process.env.ADMIN_HOST || "admin.zcashind.com").toLowerCase();
const PUBLIC_HOST = (process.env.NEXT_PUBLIC_SITE_URL || "https://zcashind.com").replace(/^https?:\/\//, "").toLowerCase();

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isProdHost = host === ADMIN_HOST || host === PUBLIC_HOST || host === `www.${PUBLIC_HOST}`;
  if (!isProdHost) return NextResponse.next(); // localhost, previews

  if (host === ADMIN_HOST) {
    if (isAdminPath || pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Public hostnames: send admin traffic to the admin host, fold www into apex.
  if (isAdminPath) {
    return NextResponse.redirect(`https://${ADMIN_HOST}${pathname}${req.nextUrl.search}`);
  }
  if (host === `www.${PUBLIC_HOST}`) {
    return NextResponse.redirect(`https://${PUBLIC_HOST}${pathname}${req.nextUrl.search}`, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|og.svg|brand/|india-official.geojson).*)"],
};
