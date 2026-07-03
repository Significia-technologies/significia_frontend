/**
 * Base URL for JSON API calls made from the browser. These are routed
 * through the Next.js BFF proxy (see src/app/api/proxy/[...path]/route.ts)
 * rather than hitting the backend directly — the proxy attaches the auth
 * token from an httpOnly cookie server-side, so the browser never sees or
 * stores a raw token. Same-origin by construction, so no protocol/CORS
 * juggling is needed here anymore.
 */
export const getApiBaseUrl = (): string => "/api/proxy";

/**
 * Constructs a full URL for an asset.
 */
export const getAssetUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  let assetBase = envUrl.split('/api/')[0];

  const currentProtocol = typeof window !== "undefined" 
    ? window.location.protocol 
    : (typeof self !== "undefined" ? self.location.protocol : "http:");

  if (
    currentProtocol === "https:" && 
    assetBase.startsWith("http://") && 
    !assetBase.includes("127.0.0.1") && 
    !assetBase.includes("localhost")
  ) {
    assetBase = assetBase.replace("http://", "https://");
  }

  return `${assetBase}/${path.startsWith('/') ? path.slice(1) : path}`;
};
