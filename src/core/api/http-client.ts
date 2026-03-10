import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_ENDPOINTS } from "./api-endpoints";

/**
 * Configured Axios instance with interceptors for:
 * - Automatically attaching JWT Authorization header (access token)
 * - Handling 401 responses with automatic token refresh
 *
 * IMPORTANT: The backend stores the refresh token as an httpOnly cookie.
 * We NEVER store or send the refresh token manually from JS.
 * `withCredentials: true` ensures the browser sends the cookie automatically.
 */

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Required for httpOnly cookie (refreshToken)
});

// ── Request Interceptor ─────────────────────────────
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach access token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return httpClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
        
        if (!currentRefreshToken) {
           throw new Error("No refresh token available");
        }

        // POST to /auth/refresh with explicit refresh_token in body
        const { data } = await axios.post(
          API_ENDPOINTS.AUTH.REFRESH_TOKEN,
          { refresh_token: currentRefreshToken }, // matches backend RefreshTokenRequest
          { 
             headers: { "Content-Type": "application/json" }
          }
        );

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;
        
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
