import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE, setAuthCookies, clearAuthCookies } from "@/core/api/server/auth-cookies";
import { refreshBackendTokens } from "@/core/api/server/refresh-tokens";

/**
 * BFF refresh endpoint. Reads the httpOnly refresh-token cookie server-side
 * (never exposed to JS), exchanges it with the backend, and re-sets both
 * cookies. Used directly by the client on session bootstrap and internally
 * by the proxy route when it sees a 401 from the backend.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  const tokens = await refreshBackendTokens(refreshToken);

  if (!tokens) {
    const response = NextResponse.json({ detail: "Session expired" }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ status: "success" }, { status: 200 });
  setAuthCookies(response, tokens);
  return response;
}
