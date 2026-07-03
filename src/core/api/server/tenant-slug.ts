const ROOT_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "significia.com",
  "www.significia.com",
  "app.significia.com",
];

/**
 * Server-side equivalent of the hostname-parsing logic that used to live in
 * http-client.ts (browser). Derives the X-Tenant-Slug header from the Host
 * header of the incoming request to the BFF, which reflects the real domain
 * the visitor is on (tenant subdomain or custom domain).
 */
export function deriveTenantSlug(host: string, simulatedSlug?: string | null): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  const isRootDomain = ROOT_DOMAINS.includes(hostname) || hostname.endsWith(".vercel.app");

  if (isRootDomain) {
    return simulatedSlug || null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3 || (parts.length >= 2 && hostname.includes("localhost"))) {
    const slug = parts[0];
    if (slug !== "www" && slug !== "app" && slug !== "dashboard") {
      return slug;
    }
  }
  return null;
}
