import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/core/api/server/backend-url";
import { setAuthCookies } from "@/core/api/server/auth-cookies";
import { deriveTenantSlug } from "@/core/api/server/tenant-slug";

/**
 * BFF login endpoint for Significia Super Admins (app.significia.com).
 * Calls the backend server-side (no browser CORS involved) and, on success,
 * stores the returned tokens as httpOnly cookies scoped to whatever host
 * served this request instead of returning them to the browser.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantSlug = deriveTenantSlug(request.headers.get("host") || "");

  const backendResponse = await fetch(`${getBackendBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  if (data.status === "active_session_exists") {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json(data, { status: backendResponse.status });
  setAuthCookies(response, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return response;
}
