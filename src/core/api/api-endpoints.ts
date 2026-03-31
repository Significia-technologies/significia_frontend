/**
 * Centralized API Endpoints Dictionary
 * All backend route strings are defined here to prevent hardcoded URLs
 * throughout the application.
 *
 * Backend runs on: http://localhost:5000/api/v1
 */

import { getApiBaseUrl } from "./api-utils";

const API_BASE = getApiBaseUrl();

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
    LIST: `${API_BASE}/transactions/`,
    DETAIL: (id: string) => `${API_BASE}/transactions/${id}`,
    CREATE: `${API_BASE}/transactions/`,
    EXPORT: `${API_BASE}/transactions/export`,
  },

  // ── Users ─────────────────────────────────────────
  USERS: {
    LIST: `${API_BASE}/users/`,
    DETAIL: (id: string) => `${API_BASE}/users/${id}`,
    UPDATE_PROFILE: `${API_BASE}/users/profile`,
  },

  // ── Connectors ────────────────────────────────────
  CONNECTORS: {
    LIST: `${API_BASE}/connectors/`,
    CREATE: `${API_BASE}/connectors/`,
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
      CODE: (connectorId: string, code: string) => `${API_BASE}/master/${connectorId}/clients/code/${code}`,
      PAN: (connectorId: string, pan: string) => `${API_BASE}/master/${connectorId}/clients/pan/${pan}`,
      UPDATE: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}`,
      DELETE: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}`,
      DOWNLOAD_REPORT: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}/pdf`,
      MASTER_REPORT: (connectorId: string) => `${API_BASE}/master/${connectorId}/report`,
      BLANK_FORM: (connectorId: string) => `${API_BASE}/master/${connectorId}/blank-form`,
      UPLOAD_DOCUMENT: (connectorId: string, id: string) => `${API_BASE}/master/${connectorId}/clients/${id}/upload-document`,
    },
    IA_MASTER: {
      CREATE: (connectorId: string) => `${API_BASE}/ia-master/?connector_id=${connectorId}`,
      VALIDATE: (connectorId: string, iaNumber: string) => `${API_BASE}/ia-master/validate-remote/${iaNumber}?connector_id=${connectorId}`,
      LATEST: (connectorId: string) => `${API_BASE}/ia-master/latest?connector_id=${connectorId}`,
      PDF: (connectorId: string, iaId: string) => `${API_BASE}/ia-master/${iaId}/pdf?connector_id=${connectorId}`,
      UPDATE: (connectorId: string, iaId: string) => `${API_BASE}/ia-master/${iaId}?connector_id=${connectorId}`,
      UPDATE_PERMIT: (connectorId: string, iaId: string) => `${API_BASE}/ia-master/${iaId}/client-permit?connector_id=${connectorId}`,
    },
  },

  // ── Storage ───────────────────────────────────────
  STORAGE: {
    LIST: `${API_BASE}/storage/`,
    CREATE: `${API_BASE}/storage/`,
    VERIFY: (id: string) => `${API_BASE}/storage/${id}/verify`,
  },

  // ── API Keys ──────────────────────────────────────
  API_KEYS: {
    LIST: `${API_BASE}/api-keys/`,
    CREATE: `${API_BASE}/api-keys/`,
    REVOKE: (id: string) => `${API_BASE}/api-keys/${id}`,
  },

  // ── Financial Analysis ────────────────────────────
  FINANCIAL_ANALYSIS: {
    LIST: (connectorId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis`,
    CREATE: (connectorId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis`,
    DETAIL: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}`,
    DETAILS: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}/details`,
    PDF: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}/pdf`,
    WORD: (connectorId: string, resultId: string) => `${API_BASE}/financial-analysis/${connectorId}/analysis/${resultId}/word`,
    FORM: (connectorId: string) => `${API_BASE}/financial-analysis/${connectorId}/form`,
  },

  // ── Risk Profile ──────────────────────────────────
  RISK_PROFILE: {
    CALCULATE: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/calculate`,
    SAVE: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/save`,
    LIST: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/assessments`,
    LATEST: (connectorId: string, clientCode: string) => `${API_BASE}/risk-profile/${connectorId}/client/${clientCode}/latest`,
    PDF: (connectorId: string, assessmentId: string) => `${API_BASE}/risk-profile/${connectorId}/assessment/${assessmentId}/pdf`,
    DOCX: (connectorId: string, assessmentId: string) => `${API_BASE}/risk-profile/${connectorId}/assessment/${assessmentId}/docx`,

    // Custom Questionnaire Endpoints
    QUESTIONNAIRES: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/questionnaires`,
    QUESTIONNAIRE: (connectorId: string, qId: string) => `${API_BASE}/risk-profile/${connectorId}/questionnaires/${qId}`,
    CUSTOM_SAVE: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/custom-save`,
    CUSTOM_LIST: (connectorId: string) => `${API_BASE}/risk-profile/${connectorId}/custom-assessments`,
    CUSTOM_PDF: (connectorId: string, assessmentId: string) => `${API_BASE}/risk-profile/${connectorId}/custom-assessment/${assessmentId}/pdf`,
    CUSTOM_DOCX: (connectorId: string, assessmentId: string) => `${API_BASE}/risk-profile/${connectorId}/custom-assessment/${assessmentId}/docx`,
    BLANK_PDF: (connectorId: string, questionnaireId: string) => `${API_BASE}/risk-profile/${connectorId}/questionnaires/${questionnaireId}/pdf`,
  },

  // ── Asset Allocation ──────────────────────────────
  ASSET_ALLOCATION: {
    VALIDATE_CLIENT: (connectorId: string) => `${API_BASE}/asset-allocation/${connectorId}/validate-client`,
    SAVE: (connectorId: string) => `${API_BASE}/asset-allocation/${connectorId}/save`,
    LIST: (connectorId: string) => `${API_BASE}/asset-allocation/${connectorId}/allocations`,
    DETAIL: (connectorId: string, id: string) => `${API_BASE}/asset-allocation/${connectorId}/allocation/${id}`,
    PDF: (connectorId: string, id: string) => `${API_BASE}/asset-allocation/${connectorId}/allocation/${id}/pdf`,
    DOCX: (connectorId: string, id: string) => `${API_BASE}/asset-allocation/${connectorId}/allocation/${id}/docx`,
  },
};
