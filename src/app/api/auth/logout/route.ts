import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/core/api/server/backend-url";
import { ACCESS_TOKEN_COOKIE, clearAuthCookies } from "@/core/api/server/auth-cookies";

/**
 * BFF logout endpoint. Best-effort notifies the backend to invalidate the
 * server-side session, then always clears the httpOnly cookies regardless
 * of whether the backend call succeeded.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const { role } = await request.json().catch(() => ({ role: undefined }));

  if (accessToken) {
    const path = role && role !== "super_admin" ? "/client-auth/bridge/logout" : "/auth/logout";
    try {
      await fetch(`${getBackendBaseUrl()}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // best-effort; still clear cookies below
    }
  }

  const response = NextResponse.json({ status: "success" });
  clearAuthCookies(response);
  return response;
}
