import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Configured Axios instance, routed through the Next.js BFF proxy.
 *
 * No `baseURL` here — every URL passed in already comes fully-qualified
 * from API_ENDPOINTS (which prefixes with getApiBaseUrl() === "/api/proxy").
 * Setting baseURL here too would double that prefix, since axios treats a
 * path starting with "/" as relative-to-baseURL, not absolute.
 *
 * Auth is entirely cookie-based now: the browser never holds a raw access
 * or refresh token. `withCredentials: true` ensures the httpOnly cookies
 * set by src/app/api/auth/* are sent automatically on every request, and
 * the proxy (src/app/api/proxy/[...path]) transparently refreshes an
 * expired access token server-side before retrying.
 */

const httpClient = axios.create({
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ── Request Interceptor ─────────────────────────────
// Only remaining client-side concern: forward the dev-mode tenant
// simulation override, if set. Real tenant resolution now happens
// server-side in the proxy from the request's Host header.
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const simulatedSlug = localStorage.getItem("simulatedTenantSlug");
      if (simulatedSlug && config.headers) {
        config.headers["X-Simulated-Tenant-Slug"] = simulatedSlug;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────
// Token refresh-on-401 is now handled inside the proxy itself. A 401 that
// reaches here means the proxy's own refresh attempt also failed (session
// is genuinely invalid) — clear client-visible state and redirect to login.
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const redirectPath =
        error.response.status === 403
          ? "/login?error=account_disabled"
          : "/login?error=session_invalidated";

      localStorage.removeItem("userRole");
      localStorage.removeItem("tenantName");

      if (typeof window !== "undefined") {
        window.location.href = redirectPath;
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
