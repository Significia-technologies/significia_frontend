/**
 * Centralized API Endpoints Dictionary
 * All backend route strings are defined here to prevent hardcoded URLs
 * throughout the application.
 *
 * Backend runs on: http://localhost:5000/api/v1
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh-token`,
    LOGOUT: `${API_BASE}/auth/logout`,
    CURRENT_USER: `${API_BASE}/auth/me`,
  },

  // ── Analytics / Dashboard ─────────────────────────
  ANALYTICS: {
    OVERVIEW: `${API_BASE}/analytics/overview`,
    REVENUE: `${API_BASE}/analytics/revenue`,
    EXPENSES: `${API_BASE}/analytics/expenses`,
    CASHFLOW: `${API_BASE}/analytics/cashflow`,
  },

  // ── Transactions ──────────────────────────────────
  TRANSACTIONS: {
    LIST: `${API_BASE}/transactions`,
    DETAIL: (id: string) => `${API_BASE}/transactions/${id}`,
    CREATE: `${API_BASE}/transactions`,
    EXPORT: `${API_BASE}/transactions/export`,
  },

  // ── Users ─────────────────────────────────────────
  USERS: {
    LIST: `${API_BASE}/users`,
    DETAIL: (id: string) => `${API_BASE}/users/${id}`,
    UPDATE_PROFILE: `${API_BASE}/users/profile`,
  },
} as const;
