import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/core/api/server/auth-cookies";

/**
 * Exchanges tokens minted elsewhere (e.g. an email-link login) for httpOnly
 * cookies. The tokens themselves are still backend-issued JWTs arriving via
 * URL query params on the client — this endpoint's job is just to get them
 * out of `localStorage`/JS-visible state as fast as possible by converting
 * them into httpOnly cookies immediately after the client reads the URL.
 */
export async function POST(request: NextRequest) {
  const { accessToken, refreshToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ detail: "accessToken is required" }, { status: 400 });
  }

  const response = NextResponse.json({ status: "success" });
  setAuthCookies(response, { accessToken, refreshToken });
  return response;
}
