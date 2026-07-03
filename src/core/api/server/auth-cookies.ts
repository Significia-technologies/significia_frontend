import { NextResponse } from "next/server";

/**
 * httpOnly auth cookies set by the Next.js BFF layer (see src/app/api/auth/*
 * and src/app/api/proxy/[...path]). Deliberately set with NO `domain`
 * attribute so they scope to whatever host served the request — this is
 * what makes them work for both *.significia.com and arbitrary tenant
 * custom domains, where a cross-site Set-Cookie from the backend would be
 * dropped by the browser.
 */
export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string }
) {
  if (tokens.accessToken) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...baseCookieOptions,
      maxAge: 60 * 30, // 30 minutes, mirrors backend ACCESS_TOKEN_EXPIRE_MINUTES
    });
  }
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 days, mirrors backend REFRESH_TOKEN_EXPIRE_DAYS
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
