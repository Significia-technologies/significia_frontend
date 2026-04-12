import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ────────────────────────────────────────────────────

export interface EmailSettings {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  use_tls: boolean;
  use_ssl: boolean;
  from_email: string;
  from_name: string;
  is_verified: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailSettingsPayload {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  use_tls: boolean;
  use_ssl: boolean;
  from_email: string;
  from_name: string;
}

export interface EmailTemplate {
  id: string;
  group_id: string;
  version: string;
  audit_id: string;
  is_latest: boolean;
  template_name: string;
  template_type: string;
  subject: string;
  body_html: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplatePayload {
  template_name: string;
  template_type: string;
  subject: string;
  body_html: string;
  is_default?: boolean;
}

export interface EmailLog {
  id: string;
  user_id: string;
  sender_name?: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_id: string | null;
  template_audit_id?: string | null;
  template_name?: string;
  status: "PENDING" | "SENT" | "FAILED";
  error_details: string | null;
  retry_count: number;
  context_type: string | null;
  context_id: string | null;
  report_version?: number;
  trigger_type: "SYSTEM" | "MANUAL";
  attachments_info: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Placeholder {
  key: string;
  label: string;
  description: string;
}

export interface SendEmailPayload {
  recipient_email: string;
  recipient_name?: string;
  template_id?: string;
  subject?: string;
  body_html?: string;
  template_variables?: Record<string, string>;
  context_type?: string;
  context_id?: string;
}

export interface SendReportEmailPayload {
  client_id: string;
  report_type: string;
  report_id: string;
  formats: string[];
  template_id?: string;
  custom_message?: string;
}

// ── Service ──────────────────────────────────────────────────

export class EmailService {
  // ── SMTP Settings ──────────────────────────────────────────

  static async getSettings(): Promise<EmailSettings | null> {
    try {
      const response = await httpClient.get<EmailSettings>(API_ENDPOINTS.EMAIL.SETTINGS);
      return response.data;
    } catch {
      return null;
    }
  }

  static async saveSettings(payload: EmailSettingsPayload): Promise<EmailSettings> {
    const response = await httpClient.put<EmailSettings>(API_ENDPOINTS.EMAIL.SETTINGS, payload);
    return response.data;
  }

  static async updateSettings(payload: Partial<EmailSettingsPayload>): Promise<EmailSettings> {
    const response = await httpClient.patch<EmailSettings>(API_ENDPOINTS.EMAIL.SETTINGS, payload);
    return response.data;
  }

  static async testSettings(
    recipientEmail: string,
    settings?: Partial<EmailSettingsPayload>
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const response = await httpClient.post(API_ENDPOINTS.EMAIL.SETTINGS_TEST, {
      recipient_email: recipientEmail,
      settings: settings,
    });
    return response.data;
  }

  // ── Templates ──────────────────────────────────────────────

  static async listTemplates(): Promise<EmailTemplate[]> {
    const response = await httpClient.get<EmailTemplate[]>(API_ENDPOINTS.EMAIL.TEMPLATES);
    return response.data;
  }

  static async createTemplate(payload: EmailTemplatePayload): Promise<EmailTemplate> {
    const response = await httpClient.post<EmailTemplate>(API_ENDPOINTS.EMAIL.TEMPLATES, payload);
    return response.data;
  }

  static async updateTemplate(id: string, payload: Partial<EmailTemplatePayload>): Promise<EmailTemplate> {
    const response = await httpClient.put<EmailTemplate>(API_ENDPOINTS.EMAIL.TEMPLATE(id), payload);
    return response.data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.EMAIL.TEMPLATE(id));
  }

  static async getDefaultTemplate(templateType: string = "REPORT_DELIVERY"): Promise<{ subject: string; body_html: string }> {
    const response = await httpClient.get(API_ENDPOINTS.EMAIL.DEFAULT_TEMPLATE, {
      params: { template_type: templateType },
    });
    return response.data;
  }

  static async getPlaceholders(): Promise<Placeholder[]> {
    const response = await httpClient.get<Placeholder[]>(API_ENDPOINTS.EMAIL.PLACEHOLDERS);
    return response.data;
  }

  // ── Send Email ─────────────────────────────────────────────

  static async sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string; log_id?: string }> {
    const response = await httpClient.post(API_ENDPOINTS.EMAIL.SEND, payload);
    return response.data;
  }

  static async sendReportEmail(payload: SendReportEmailPayload): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post(API_ENDPOINTS.EMAIL.SEND_REPORT, payload);
    return response.data;
  }

  // ── Logs ───────────────────────────────────────────────────

  static async getLogs(
    skip = 0, 
    limit = 50,
    filters?: {
      client_id?: string;
      recipient_email?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{ total: number; items: EmailLog[] }> {
    const response = await httpClient.get(API_ENDPOINTS.EMAIL.LOGS, {
      params: { 
        offset: skip, 
        limit,
        ...filters
      },
    });
    return response.data;
  }

  static async exportLogs(
    filters?: {
      client_id?: string;
      recipient_email?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.EMAIL.LOGS + "/export", {
      params: filters,
      responseType: "blob"
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const filename = `email_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
