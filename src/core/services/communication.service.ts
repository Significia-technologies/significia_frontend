import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ─────────────────────────────────────────────────────────────

export type ThreadStatus = "OPEN" | "CLOSED" | "PENDING_IA" | "PENDING_CLIENT";
export type ThreadType = "GENERAL" | "ADVISORY" | "COMPLIANCE" | "COMPLAINT";
export type SenderType = "IA" | "CLIENT";
export type MessageSource = "COMPOSED" | "MANUALLY_LOGGED" | "EMAIL_WEBHOOK";

export interface ConversationMessage {
  id: string;
  thread_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  sender_name: string | null;
  body: string;
  attachments_info: string | null;
  source: MessageSource;
  is_internal_note: boolean;
  is_read: boolean;
  read_at: string | null;
  audit_hash: string | null;
  audit_verified?: boolean;
  sent_at: string;
  created_at: string;
}

export interface ConversationThread {
  id: string;
  client_id: string;
  client_name: string | null;
  client_email: string | null;
  created_by: string | null;
  created_by_name: string | null;
  subject: string;
  status: ThreadStatus;
  thread_type: ThreadType;
  context_type: string | null;
  context_id: string | null;
  is_archived: boolean;
  last_message_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  last_message_preview?: string | null;
  unread_count?: number;
}

export interface ThreadDetail extends ConversationThread {
  messages: ConversationMessage[];
}

export interface CommunicationStats {
  open_count: number;
  pending_ia_count: number;
  pending_client_count: number;
  closed_count: number;
  total_count: number;
  total_unread_messages: number;
}

export interface ThreadListResponse {
  total: number;
  items: ConversationThread[];
}

export interface CreateThreadPayload {
  client_id: string;
  subject: string;
  body: string;
  thread_type?: ThreadType;
  context_type?: string;
  context_id?: string;
  is_internal_note?: boolean;
}

export interface AddMessagePayload {
  body: string;
  sender_type?: SenderType;
  source?: MessageSource;
  is_internal_note?: boolean;
  attachments_info?: string[];
}

// ── Service ────────────────────────────────────────────────────────────

export class CommunicationService {
  static async getStats(): Promise<CommunicationStats> {
    const res = await httpClient.get(API_ENDPOINTS.COMMUNICATION.STATS);
    return res.data;
  }

  static async listThreads(params?: Partial<{
    client_id: string;
    status: string;
    thread_type: string;
    search: string;
    limit: number;
    offset: number;
  }>): Promise<ThreadListResponse> {
    const res = await httpClient.get(API_ENDPOINTS.COMMUNICATION.THREADS, { params });
    return res.data;
  }

  static async getThread(threadId: string): Promise<ThreadDetail> {
    const res = await httpClient.get(API_ENDPOINTS.COMMUNICATION.THREAD(threadId));
    return res.data;
  }

  static async createThread(payload: CreateThreadPayload): Promise<{ thread_id: string; message_id: string }> {
    const res = await httpClient.post(API_ENDPOINTS.COMMUNICATION.THREADS, payload);
    return res.data;
  }

  static uploadAttachments(threadId: string, files: File[]): Promise<{ name: string; key: string; content_type: string; size: number }[]> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const url = `${baseUrl}/communication/threads/${threadId}/attachments`;

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const tenantSlug = typeof window !== "undefined" ? localStorage.getItem("simulatedTenantSlug") : null;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      if (tenantSlug) xhr.setRequestHeader("X-Tenant-Slug", tenantSlug);
      // Do NOT set Content-Type — browser sets multipart/form-data; boundary=... automatically
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data.attachments ?? []);
          else reject({ response: { data } });
        } catch { reject(new Error("Invalid response")); }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  }

  static async addMessage(
    threadId: string,
    payload: AddMessagePayload,
    files?: File[]
  ): Promise<{ message_id: string }> {
    let attachments_info: object[] | undefined;
    if (files && files.length > 0) {
      attachments_info = await CommunicationService.uploadAttachments(threadId, files);
    }

    const res = await httpClient.post(API_ENDPOINTS.COMMUNICATION.MESSAGES(threadId), {
      body: payload.body,
      sender_type: payload.sender_type ?? "IA",
      source: payload.source ?? "COMPOSED",
      is_internal_note: payload.is_internal_note ?? false,
      ...(attachments_info ? { attachments_info } : {}),
    });
    return res.data;
  }

  static async getAttachmentUrl(key: string): Promise<string> {
    const res = await httpClient.get(API_ENDPOINTS.STORAGE.URL, { params: { key } });
    return res.data.url;
  }

  static async updateStatus(threadId: string, status: ThreadStatus): Promise<void> {
    await httpClient.patch(API_ENDPOINTS.COMMUNICATION.STATUS(threadId), { status });
  }

  static async markRead(threadId: string): Promise<void> {
    await httpClient.patch(API_ENDPOINTS.COMMUNICATION.READ(threadId), {});
  }

  static async exportThread(threadId: string): Promise<ThreadDetail> {
    const res = await httpClient.get(API_ENDPOINTS.COMMUNICATION.EXPORT(threadId));
    return res.data;
  }
}
