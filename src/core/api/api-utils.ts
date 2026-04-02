/**
 * Sanitizes and upgrades the API base URL to HTTPS if the frontend is served via HTTPS or if running in a secure Worker.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";
  
  // Detect protocol in both window and worker contexts
  const currentProtocol = typeof window !== "undefined" 
    ? window.location.protocol 
    : (typeof self !== "undefined" ? self.location.protocol : "http:");

  if (
    currentProtocol === "https:" && 
    envUrl.startsWith("http://") && 
    !envUrl.includes("127.0.0.1") && 
    !envUrl.includes("localhost")
  ) {
    return envUrl.replace("http://", "https://");
  }
  
  return envUrl;
};

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
