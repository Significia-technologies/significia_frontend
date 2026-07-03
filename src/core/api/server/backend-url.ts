/**
 * Server-only helper: resolves the real backend base URL (e.g.
 * http://127.0.0.1:8001/api/v1). Only ever called from Route Handlers
 * (src/app/api/**), never shipped to the browser bundle.
 */
export function getBackendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
}
