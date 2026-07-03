import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/core/api/server/backend-url";
import { setAuthCookies } from "@/core/api/server/auth-cookies";
import { deriveTenantSlug } from "@/core/api/server/tenant-slug";

/** BFF login endpoint for IA clients (investors) logging into the client portal. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const tenantSlug = deriveTenantSlug(request.headers.get("host") || "");

  const backendResponse = await fetch(`${getBackendBaseUrl()}/client-auth/bridge/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok || data.status === "active_session_exists") {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  const response = NextResponse.json(data, { status: backendResponse.status });
  setAuthCookies(response, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });
  return response;
}
