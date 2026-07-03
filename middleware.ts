import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/core/api/server/auth-cookies";

// Top-level path prefixes that live under the (dashboard) and (admin) route
// groups. Route groups don't appear in the URL, so this list mirrors the
// actual folder names under src/app/(dashboard) and src/app/(admin).
// Kept as an explicit allow-list (rather than blacklisting public routes)
// since "/" is shared with the public marketing site via HomeGate and must
// not be swept in here by accident.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/clients",
  "/master",
  "/communication",
  "/financial-goals",
  "/investment-advice",
  "/investor-master",
  "/portfolio",
  "/product-basket",
  "/rectification",
  "/risk-profiles",
  "/settings",
  "/team",
  "/tools",
  "/operations",
  "/asset-allocation",
  "/existing-asset-allocation",
  "/drawers",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has(ACCESS_TOKEN_COOKIE) || request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_invalidated");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/clients/:path*",
    "/master/:path*",
    "/communication/:path*",
    "/financial-goals/:path*",
    "/investment-advice/:path*",
    "/investor-master/:path*",
    "/portfolio/:path*",
    "/product-basket/:path*",
    "/rectification/:path*",
    "/risk-profiles/:path*",
    "/settings/:path*",
    "/team/:path*",
    "/tools/:path*",
    "/operations/:path*",
    "/asset-allocation/:path*",
    "/existing-asset-allocation/:path*",
    "/drawers/:path*",
  ],
};
