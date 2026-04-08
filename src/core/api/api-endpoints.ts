/**
 * Centralized API Endpoints Dictionary
 * ─────────────────────────────────────────────────────────────
 * Bridge Architecture — all data endpoints no longer require
 * a connectorId in the path. The backend resolves the tenant
 * from the JWT token + X-Tenant-Slug header automatically.
 *
 * Backend base: http://localhost:8000/api/v1 (local dev)
 */

import { getApiBaseUrl } from "./api-utils";

const API_BASE = getApiBaseUrl();

export const API_ENDPOINTS = {
  // ── Public Discovery ───────────────────────────────────────
  PUBLIC: {
    BRANDING: `${API_BASE}/public/branding`,
  },

  // ── Significia Super Admin Auth ────────────────────────────
  // Only accessible from app.significia.com
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    REFRESH_TOKEN: `${API_BASE}/auth/refresh`,
    LOGOUT: `${API_BASE}/auth/logout`,
    CURRENT_USER: `${API_BASE}/auth/me`,
  },

  // ── IA Staff Auth ──────────────────────────────────────────
  // Separate login flow for IA staff on their custom domain.
  // e.g. bunty.com/ia-login → POST /ia-auth/login
  IA_AUTH: {
    LOGIN: `${API_BASE}/ia-auth/login`,
    TENANT_INFO: `${API_BASE}/ia-auth/tenant-info`,
    ME: `${API_BASE}/ia-auth/me`,
  },

  // ── Client Auth ────────────────────────────────────────────
  // For IA clients (investors) logging into their portal
  CLIENT_AUTH: {
    LOGIN: `${API_BASE}/client-auth/bridge/login`,
    ME: `${API_BASE}/client-auth/me`,
  },

  // ── Master Data — Clients ──────────────────────────────────
  // Bridge-powered: no connectorId needed
  MASTER: {
    CLIENTS: {
      LIST: `${API_BASE}/master/clients`,
      CREATE: `${API_BASE}/master/clients`,
      DETAIL: (id: string) => `${API_BASE}/master/clients/${id}`,
      BY_CODE: (code: string) => `${API_BASE}/master/clients/code/${code}`,
      BY_PAN: (pan: string) => `${API_BASE}/master/clients/pan/${pan}`,
      UPDATE: (id: string) => `${API_BASE}/master/clients/${id}`,
      DELETE: (id: string) => `${API_BASE}/master/clients/${id}`,
      DOWNLOAD_REPORT: (id: string) => `${API_BASE}/master/clients/${id}/pdf`,
      MASTER_REPORT: `${API_BASE}/master/report`,
      BLANK_FORM: `${API_BASE}/master/blank-form`,
      UPLOAD_DOCUMENT: (id: string) =>
        `${API_BASE}/master/clients/${id}/upload-document`,
    },
    IA_MASTER: {
      LATEST: `${API_BASE}/ia-master/latest`,
      CREATE: `${API_BASE}/ia-master/`,
      UPDATE: (iaId: string) => `${API_BASE}/ia-master/${iaId}`,
      UPDATE_PERMIT: (iaId: string) =>
        `${API_BASE}/ia-master/${iaId}/client-permit`,
      VALIDATE: (iaNumber: string) =>
        `${API_BASE}/ia-master/validate/${iaNumber}`,
      PDF: (iaId: string) => `${API_BASE}/ia-master/${iaId}/pdf`,
      EMPLOYEES: `${API_BASE}/ia-master/employees`,
    },
  },

  // ── Financial Analysis ─────────────────────────────────────
  FINANCIAL_ANALYSIS: {
    LIST: `${API_BASE}/financial-analysis/bridge/analysis`,
    CREATE: `${API_BASE}/financial-analysis/bridge/analysis`,
    DETAIL: (resultId: string) =>
      `${API_BASE}/financial-analysis/bridge/analysis/${resultId}`,
    PDF: (resultId: string) =>
      `${API_BASE}/financial-analysis/bridge/analysis/${resultId}/pdf`,
    WORD: (resultId: string) =>
      `${API_BASE}/financial-analysis/bridge/analysis/${resultId}/word`,
    FORM: `${API_BASE}/financial-analysis/bridge/form`,
    BY_CLIENT: (clientId: string) =>
      `${API_BASE}/financial-analysis/bridge/analysis/client/${clientId}`,
  },

  // ── Risk Profile ───────────────────────────────────────────
  RISK_PROFILE: {
    CALCULATE: `${API_BASE}/risk-profile/bridge/calculate`,
    SAVE: `${API_BASE}/risk-profile/bridge/save`,
    LIST: `${API_BASE}/risk-profile/bridge/assessments`,
    LATEST_FOR_CLIENT: (clientCode: string) =>
      `${API_BASE}/risk-profile/bridge/client/${clientCode}/latest`,
    PDF: (assessmentId: string) =>
      `${API_BASE}/risk-profile/bridge/assessment/${assessmentId}/pdf`,
    DOCX: (assessmentId: string) =>
      `${API_BASE}/risk-profile/bridge/assessment/${assessmentId}/docx`,
    // Custom Questionnaires
    QUESTIONNAIRES: `${API_BASE}/risk-profile/bridge/questionnaires`,
    QUESTIONNAIRE: (qId: string) =>
      `${API_BASE}/risk-profile/bridge/questionnaires/${qId}`,
    CUSTOM_SAVE: `${API_BASE}/risk-profile/bridge/custom-save`,
    CUSTOM_LIST: `${API_BASE}/risk-profile/bridge/custom-assessments`,
    CUSTOM_PDF: (assessmentId: string) =>
      `${API_BASE}/risk-profile/bridge/custom-assessment/${assessmentId}/pdf`,
    CUSTOM_DOCX: (assessmentId: string) =>
      `${API_BASE}/risk-profile/bridge/custom-assessment/${assessmentId}/docx`,
    BLANK_PDF: (questionnaireId: string) =>
      `${API_BASE}/risk-profile/bridge/questionnaires/${questionnaireId}/pdf`,
  },

  // ── Asset Allocation ───────────────────────────────────────
  ASSET_ALLOCATION: {
    VALIDATE_CLIENT: `${API_BASE}/asset-allocation/bridge/validate-client`,
    SAVE: `${API_BASE}/asset-allocation/bridge/save`,
    LIST: `${API_BASE}/asset-allocation/bridge/allocations`,
    DETAIL: (id: string) =>
      `${API_BASE}/asset-allocation/bridge/allocation/${id}`,
    PDF: (id: string) =>
      `${API_BASE}/asset-allocation/bridge/allocation/${id}/pdf`,
    DOCX: (id: string) =>
      `${API_BASE}/asset-allocation/bridge/allocation/${id}/docx`,
    BLANK_PDF: `${API_BASE}/asset-allocation/bridge/blank-form/pdf`,
  },

  // ── Bridge Management (Super Admin only) ───────────────────
  BRIDGE: {
    BASE: `${API_BASE}/bridge/tenants`,
    ALL_BRIDGES: `${API_BASE}/bridge/tenants/bridges`,
    PROVISION: `${API_BASE}/bridge/tenants/provision`,
    UPDATE_ME: `${API_BASE}/bridge/tenants/me`,
    REVOKE: (tenantId: string) =>
      `${API_BASE}/bridge/tenants/${tenantId}/revoke`,
    INITIALIZE: (tenantId: string) =>
      `${API_BASE}/bridge/tenants/${tenantId}/initialize`,
    PING: (tenantId: string) =>
      `${API_BASE}/bridge/tenants/${tenantId}/ping`,
  },

  // ── Billing (Super Admin only) ─────────────────────────────
  BILLING: {
    OVERVIEW: `${API_BASE}/billing/overview`,
    STATS: `${API_BASE}/billing/stats`,
    TENANT_USAGE: (tenantId: string) =>
      `${API_BASE}/billing/tenant/${tenantId}/usage`,
    UPDATE_PLAN: (tenantId: string) =>
      `${API_BASE}/billing/tenant/${tenantId}/plan`,
  },

  // ── API Keys ───────────────────────────────────────────────
  API_KEYS: {
    LIST: `${API_BASE}/api-keys/`,
    CREATE: `${API_BASE}/api-keys/`,
    REVOKE: (id: string) => `${API_BASE}/api-keys/${id}`,
  },

  // ── Transactions (Bridge-powered) ─────────────────────────
  TRANSACTIONS: {
    LIST: `${API_BASE}/transactions/bridge/transactions`,
    CREATE: `${API_BASE}/transactions/bridge/transactions`,
    DETAIL: (id: string) => `${API_BASE}/transactions/bridge/transactions/${id}`,
    EXPORT: `${API_BASE}/transactions/bridge/transactions/export`,
  },

  // ── Analytics (Bridge-powered) ────────────────────────────
  ANALYTICS: {
    OVERVIEW: `${API_BASE}/analytics/bridge/overview`,
    PORTFOLIO: `${API_BASE}/analytics/bridge/portfolio`,
    REVENUE: `${API_BASE}/analytics/bridge/revenue`,
    CASHFLOW: `${API_BASE}/analytics/bridge/cashflow`,
    CLIENT: (clientId: string) => `${API_BASE}/analytics/bridge/client/${clientId}`,
  },

  // ── SEBI Compliance (Bridge-powered) ──────────────────────
  SEBI: {
    AUDIT_TRAIL: `${API_BASE}/ia-master/sebi/audit-trail`,
    IA_VERSIONS: `${API_BASE}/ia-master/sebi/ia-master/versions`,
    IA_VERSION: (version: number) => `${API_BASE}/ia-master/sebi/ia-master/versions/${version}`,
    IA_LOCK: `${API_BASE}/ia-master/sebi/ia-master/lock`,
    IA_UNLOCK: `${API_BASE}/ia-master/sebi/ia-master/unlock`,
    REPORT_HISTORY: `${API_BASE}/ia-master/sebi/report-history`,
    REPORT_DELIVER: (id: string) => `${API_BASE}/ia-master/sebi/report-history/${id}/deliver`,
    CHANGE_SUMMARY: `${API_BASE}/ia-master/sebi/ia-master/change-summary`,
  },
};
