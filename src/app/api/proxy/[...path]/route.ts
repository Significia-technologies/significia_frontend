import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/core/api/server/backend-url";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  clearAuthCookies,
} from "@/core/api/server/auth-cookies";
import { refreshBackendTokens } from "@/core/api/server/refresh-tokens";
import { deriveTenantSlug } from "@/core/api/server/tenant-slug";

// Headers that must not be forwarded as-is between the browser <-> proxy <-> backend hops.
const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "host",
  "cookie",
  "connection",
  "content-length",
  "authorization",
  "x-tenant-slug",
]);
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "transfer-encoding",
  "content-encoding",
  "set-cookie",
]);

function buildBackendUrl(path: string[], search: string): string {
  return `${getBackendBaseUrl()}/${path.join("/")}${search}`;
}

function buildForwardHeaders(request: NextRequest, accessToken: string | undefined): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const host = request.headers.get("host") || "";
  const simulatedSlug = request.headers.get("x-simulated-tenant-slug");
  const tenantSlug = deriveTenantSlug(host, simulatedSlug);
  if (tenantSlug) {
    headers.set("X-Tenant-Slug", tenantSlug);
  }

  return headers;
}

async function forward(
  request: NextRequest,
  path: string[],
  accessToken: string | undefined
): Promise<Response> {
  const url = buildBackendUrl(path, request.nextUrl.search);
  const hasBody = !["GET", "HEAD"].includes(request.method);

  return fetch(url, {
    method: request.method,
    headers: buildForwardHeaders(request, accessToken),
    body: hasBody ? request.body : undefined,
    // Required by undici/Node fetch when streaming a request body.
    duplex: hasBody ? "half" : undefined,
    redirect: "manual",
  } as RequestInit & { duplex?: "half" });
}

function passthroughResponse(upstream: Response, extraCookies?: NextResponse): NextResponse {
  const response = new NextResponse(upstream.body, { status: upstream.status });
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      response.headers.set(key, value);
    }
  });
  if (extraCookies) {
    extraCookies.cookies.getAll().forEach((c) => response.cookies.set(c));
  }
  return response;
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  let upstream = await forward(request, path, accessToken);

  if (upstream.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      const tokens = await refreshBackendTokens(refreshToken);
      if (tokens) {
        const cookieCarrier = new NextResponse();
        setAuthCookies(cookieCarrier, tokens);

        upstream = await forward(request, path, tokens.accessToken);
        return passthroughResponse(upstream, cookieCarrier);
      }
      const cookieCarrier = new NextResponse();
      clearAuthCookies(cookieCarrier);
      return passthroughResponse(upstream, cookieCarrier);
    }
  }

  return passthroughResponse(upstream);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
