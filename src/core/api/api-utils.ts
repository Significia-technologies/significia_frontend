/**
 * Sanitizes and upgrades the API base URL to HTTPS if the frontend is served via HTTPS.
 * This prevents Mixed Content errors in production.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  
  if (
    typeof window !== "undefined" && 
    window.location.protocol === "https:" && 
    envUrl.startsWith("http://") && 
    !envUrl.includes("127.0.0.1") && 
    !envUrl.includes("localhost")
  ) {
    return envUrl.replace("http://", "https://");
  }
  
  return envUrl;
};

/**
 * Constructs a full URL for an asset (logo, certificate, etc.).
 * Automatically handles protocol upgrades and local development fallbacks.
 */
export const getAssetUrl = (path: string | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Construct the base URL for assets (removing /api/v1 if it's there)
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  let assetBase = envUrl.split('/api/')[0];

  // Handle protocol upgrade if necessary
  if (
    typeof window !== "undefined" && 
    window.location.protocol === "https:" && 
    assetBase.startsWith("http://") && 
    !assetBase.includes("127.0.0.1") && 
    !assetBase.includes("localhost")
  ) {
    assetBase = assetBase.replace("http://", "https://");
  }

  return `${assetBase}/${path.startsWith('/') ? path.slice(1) : path}`;
};
