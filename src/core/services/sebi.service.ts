import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ─────────────────────────────────────────────────────────

export interface AuditTrailEntry {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string;
  user_id?: string;
  user_name?: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  change_reason_type?: string;
  change_reason_text?: string;
  entity_version?: number;
  user_ip?: string;
  created_at: string;
}

export interface AuditTrailResponse {
  entries: AuditTrailEntry[];
  total: number;
}

export interface IAMasterVersion {
  id: string;
  original_user_id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  change_reason_type?: string;
  change_reason_text?: string;
  changed_by?: string;
  changed_fields?: string[];
  created_at: string;
}

export interface ReportHistoryEntry {
  id: string;
  client_id?: string;
  client_name?: string;
  client_code?: string;
  report_type: string;
  version_number: number;
  source_record_id?: string;
  source_version?: number;
  file_path?: string;
  file_format: string;
  change_summary?: string;
  is_delivered: boolean;
  delivered_at?: string;
  created_by?: string;
  created_at: string;
}

export interface ChangeSummaryEntry {
  version: number;
  summary: string;
  reason_type?: string;
  reason_text?: string;
  changed_fields?: string[];
  timestamp: string;
}

export interface ChangeSummaryResponse {
  change_history: ChangeSummaryEntry[];
  total_versions: number;
}

export type ChangeReasonType =
  | "data_correction"
  | "client_update"
  | "assumption_change"
  | "review_adjustment"
  | "initial_entry";

export const CHANGE_REASON_LABELS: Record<ChangeReasonType, string> = {
  data_correction: "Data Correction",
  client_update: "Client Update",
  assumption_change: "Assumption Change",
  review_adjustment: "Review Adjustment",
  initial_entry: "Initial Entry",
};

// ── SEBI Compliance Service ───────────────────────────────────────

export class SEBIService {
  // ── Audit Trail ─────────────────────────────────────────

  static async getAuditTrail(params?: {
    table_name?: string;
    record_id?: string;
    action_type?: string;
    user_name?: string;
    change_reason_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditTrailResponse> {
    const response = await httpClient.get<AuditTrailResponse>(
      API_ENDPOINTS.SEBI.AUDIT_TRAIL,
      { params }
    );
    return response.data;
  }

  // ── IA Master Version History ───────────────────────────

  static async getIAVersions(): Promise<IAMasterVersion[]> {
    const response = await httpClient.get<IAMasterVersion[]>(
      API_ENDPOINTS.SEBI.IA_VERSIONS
    );
    return response.data;
  }

  static async getIAVersion(version: number): Promise<IAMasterVersion> {
    const response = await httpClient.get<IAMasterVersion>(
      API_ENDPOINTS.SEBI.IA_VERSION(version)
    );
    return response.data;
  }

  // ── Lock Management ─────────────────────────────────────

  static async lockIAMaster(reason: string): Promise<{ status: string; reason: string }> {
    const response = await httpClient.post(API_ENDPOINTS.SEBI.IA_LOCK, { reason });
    return response.data;
  }

  static async unlockIAMaster(reason: string): Promise<{ status: string; reason: string }> {
    const response = await httpClient.post(API_ENDPOINTS.SEBI.IA_UNLOCK, { reason });
    return response.data;
  }

  // ── Report History ──────────────────────────────────────

  static async getReportHistory(params?: {
    client_id?: string;
    report_type?: string;
  }): Promise<ReportHistoryEntry[]> {
    const response = await httpClient.get<ReportHistoryEntry[]>(
      API_ENDPOINTS.SEBI.REPORT_HISTORY,
      { params }
    );
    return response.data;
  }

  static async markReportDelivered(reportId: string): Promise<{ status: string }> {
    const response = await httpClient.post(
      API_ENDPOINTS.SEBI.REPORT_DELIVER(reportId)
    );
    return response.data;
  }

  // ── Change Summary ──────────────────────────────────────

  static async getChangeSummary(): Promise<ChangeSummaryResponse> {
    const response = await httpClient.get<ChangeSummaryResponse>(
      API_ENDPOINTS.SEBI.CHANGE_SUMMARY
    );
    return response.data;
  }
  // ── Audit Trail Export ───────────────────────────────────

  static async exportAuditTrail(params: {
    format: "csv" | "json";
    table_name?: string;
    record_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.SEBI.AUDIT_TRAIL_EXPORT,
      {
        params,
        responseType: "blob",
      }
    );

    // Extract filename from Content-Disposition header or generate one
    const contentDisposition = response.headers["content-disposition"];
    let filename = `SEBI_Audit_Trail.${params.format}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=(.+)/);
      if (match) {
        filename = match[1].replace(/['"]/g, "");
      }
    }

    // Trigger browser download
    const blob = new Blob([response.data], {
      type: params.format === "json" ? "application/json" : "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
