/**
 * Centralized API Endpoints Dictionary
 * All backend route strings are defined here to prevent hardcoded URLs
 * throughout the application.
 *
 * Backend runs on: http://localhost:5000/api/v1
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh`,
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

  // ── Connectors ────────────────────────────────────
  CONNECTORS: {
    LIST: `${API_BASE}/connectors`,
    CREATE: `${API_BASE}/connectors`,
    DETAIL: (id: string) => `${API_BASE}/connectors/${id}`,
    UPDATE: (id: string) => `${API_BASE}/connectors/${id}`,
    DELETE: (id: string) => `${API_BASE}/connectors/${id}`,
    TEST: (id: string) => `${API_BASE}/connectors/${id}/test`,
    INITIALIZE: (id: string) => `${API_BASE}/connectors/${id}/initialize`,
  },

  // ── Master Data ──────────────────────────────────
  MASTER: {
    CLIENTS: {
      LIST: (connectorId: string) => `${API_BASE}/master/${connectorId}/clients`,
      CREATE: (connectorId: string) => `${API_BASE}/master/${connectorId}/clients`,
      DETAIL: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}`,
      UPDATE: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}`,
      DELETE: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}`,
      DOWNLOAD_REPORT: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}/pdf`,
      MASTER_REPORT: (connectorId: string) => `${API_BASE}/master/${connectorId}/report`,
    },
    IA_MASTER: {
      CREATE: (connectorId: string) => `${API_BASE}/ia-master/?connector_id=${connectorId}`,
      VALIDATE: (connectorId: string, iaNumber: string) => `${API_BASE}/ia-master/validate-remote/${iaNumber}?connector_id=${connectorId}`,
      LATEST: (connectorId: string) => `${API_BASE}/ia-master/latest?connector_id=${connectorId}`,
      PDF: (connectorId: string, iaId: string) => `${API_BASE}/ia-master/${iaId}/pdf?connector_id=${connectorId}`,
      UPDATE_PERMIT: (connectorId: string, iaId: string) => `${API_BASE}/ia-master/${iaId}/client-permit?connector_id=${connectorId}`,
    },
  },

  // ── Storage ───────────────────────────────────────
  STORAGE: {
    LIST: `${API_BASE}/storage`,
    CREATE: `${API_BASE}/storage`,
    VERIFY: (id: string) => `${API_BASE}/storage/${id}/verify`,
  },

  // ── API Keys ──────────────────────────────────────
  API_KEYS: {
    LIST: `${API_BASE}/api-keys`,
    CREATE: `${API_BASE}/api-keys`,
    REVOKE: (id: string) => `${API_BASE}/api-keys/${id}`,
  },

  // ── Financial Analysis ────────────────────────────
  FINANCIAL_ANALYSIS: {
    LIST: (connectorId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis`,
    CREATE: (connectorId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis`,
    DETAIL: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}`,
    PDF: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}/pdf`,
    WORD: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}/word`,
  },
};

