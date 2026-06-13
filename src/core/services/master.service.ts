import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ─────────────────────────────────────────

export interface Client {
  id: string;
  user_id?: string;
  client_name: string;
  client_code: string;
  email: string;
  phone_number: string;
  address: string;
  pan_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
  kyc_verified: boolean;
  ckyc_number?: string;
  ipv_done_by_id?: string;
  ipv_date?: string;
  agreement_date?: string;
  documents?: ClientDocumentResponse[];
}

export interface ClientDocumentResponse {
  id: string;
  document_type: string;
  file_path: string;
  category?: string; // e.g., KYC, Rectification, Reports
  uploaded_at: string;
}

export interface ClientCreate {
  is_active?: boolean;
  id?: string;
  // Authentication
  email: string;
  password: string;
  client_code: string;
  // Personal
  client_name: string;
  date_of_birth: string;
  pan_number: string;
  phone_number: string;
  address: string;
  occupation: string;
  gender: string;
  marital_status: string;
  nationality: string;
  residential_status: string;
  tax_residency: string;
  pep_status: string;
  father_name: string;
  mother_name: string;
  spouse_name?: string;
  spouse_dob?: string;
  aadhar_number?: string;
  passport_number?: string;
  // Financial
  annual_income: number;
  net_worth: number;
  income_source: string;
  fatca_compliance: string;
  existing_portfolio_value?: number;
  existing_portfolio_composition?: string;
  // Banking
  bank_account_number: string;
  bank_name: string;
  bank_branch: string;
  ifsc_code: string;
  demat_account_number?: string;
  trading_account_number?: string;
  // Investment
  risk_profile: string;
  investment_experience: string;
  investment_objectives: string;
  investment_horizon: string;
  liquidity_needs: string;
  // Metadata
  advisor_name: string;
  advisor_registration_number: string;
  client_date: string;
  nominee_name?: string;
  nominee_relationship?: string;
  nominees?: {
    name: string;
    relationship: string;
    dob: string;
    percentage: number;
  }[];
  previous_advisor_name?: string;
  referral_source?: string;
  declaration_signed: boolean;
  agreement_date?: string;
  client_signature_path?: string;
  advisor_signature_path?: string;
  assigned_employee_id?: string;
  kyc_verified: boolean;
  ckyc_number?: string;
  ipv_done_by_id?: string;
  ipv_date?: string;
  documents?: ClientDocumentResponse[];
  rectification_serial_no?: string;
}

// ── Master Data Service (Bridge Architecture) ─────────────────────────────
// No  required — backend resolves tenant from JWT + X-Tenant-Slug

export class MasterDataService {
  static async listClients(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ clients: Client[]; total: number }> {
    const { page = 1, limit = 10, search } = params;
    
    const response = await httpClient.get<{ clients: Client[]; total: number }>(
      API_ENDPOINTS.MASTER.CLIENTS.LIST,
      {
        params: {
          skip: (page - 1) * limit,
          limit,
          search: search || undefined
        }
      }
    );
    return {
      clients: response.data.clients || [],
      total: response.data.total || 0
    };
  }

  static async getClient(clientId: string): Promise<ClientCreate> {
    const response = await httpClient.get<ClientCreate>(
      API_ENDPOINTS.MASTER.CLIENTS.DETAIL(clientId)
    );
    return response.data;
  }

  static async getClientByPan(pan: string): Promise<ClientCreate> {
    const response = await httpClient.get<ClientCreate>(
      API_ENDPOINTS.MASTER.CLIENTS.BY_PAN(pan)
    );
    return response.data;
  }

  static async getClientByCode(code: string): Promise<ClientCreate> {
    const response = await httpClient.get<ClientCreate>(
      API_ENDPOINTS.MASTER.CLIENTS.BY_CODE(code)
    );
    return response.data;
  }

  static async createClient(data: ClientCreate): Promise<Client> {
    const response = await httpClient.post<Client>(
      API_ENDPOINTS.MASTER.CLIENTS.CREATE,
      data
    );
    return response.data;
  }

  static async updateClient(clientId: string, data: Partial<ClientCreate>): Promise<Client> {
    const response = await httpClient.put<Client>(
      API_ENDPOINTS.MASTER.CLIENTS.UPDATE(clientId),
      data
    );
    return response.data;
  }

  static async deleteClient(clientId: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.MASTER.CLIENTS.DELETE(clientId));
  }

  static async downloadClientReport(clientId: string, clientName: string): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.MASTER.CLIENTS.DOWNLOAD_REPORT(clientId),
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Report_${clientName.replace(/\s+/g, "_")}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadMasterReport(): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.MASTER.CLIENTS.MASTER_REPORT, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Client_Master_Report_${date}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadBlankForm(): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.MASTER.CLIENTS.BLANK_FORM, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Client_Registration_Form.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadLetterhead(): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.MASTER.IA_MASTER.LETTERHEAD, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Advisor_Letterhead.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  static async uploadDocument(
    clientId: string,
    file: File,
    documentType: string
  ): Promise<ClientDocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);

    const response = await httpClient.post<ClientDocumentResponse>(
      API_ENDPOINTS.MASTER.CLIENTS.UPLOAD_DOCUMENT(clientId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  static async assignClient(clientId: string, staffId: string): Promise<void> {
    await httpClient.patch(`/master/clients/${clientId}/assign`, null, {
      params: { staff_id: staffId }
    });
  }

  static async sendOnboardingEmail(clientId: string): Promise<void> {
    await httpClient.post(API_ENDPOINTS.EMAIL.SEND_ONBOARDING, { client_id: clientId });
  }

  // ── Client Versioning (SEBI Temporal Audit) ──────────────────────

  static async listClientVersions(clientId: string): Promise<ClientVersionListResponse> {
    const response = await httpClient.get<ClientVersionListResponse>(
      API_ENDPOINTS.MASTER.CLIENTS.VERSIONS(clientId)
    );
    return response.data;
  }

  static async getClientVersion(clientId: string, versionId: string): Promise<ClientVersionDetail> {
    const response = await httpClient.get<ClientVersionDetail>(
      API_ENDPOINTS.MASTER.CLIENTS.VERSION_DETAIL(clientId, versionId)
    );
    return response.data;
  }

  static async getClientVersionAtDate(clientId: string, targetDate: string): Promise<ClientVersionDetail> {
    const response = await httpClient.get<ClientVersionDetail>(
      API_ENDPOINTS.MASTER.CLIENTS.VERSION_AT_DATE(clientId),
      { params: { target_date: targetDate } }
    );
    return response.data;
  }

  static async downloadClientVersionPDF(
    clientId: string,
    versionId: string,
    clientName: string,
    versionNumber: number
  ): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.MASTER.CLIENTS.VERSION_PDF(clientId, versionId),
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Report_${clientName.replace(/\s+/g, "_")}_V${versionNumber}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

// ── Client Versioning Types ──────────────────────────────────

export interface ClientVersionSummary {
  id: string;
  version_number: number;
  valid_from: string | null;
  valid_to: string | null;
  is_current: boolean;
  change_reason: string | null;
  changed_by: string | null;
  created_at: string | null;
}

export interface ClientVersionListResponse {
  client_id: string;
  versions: ClientVersionSummary[];
  total: number;
}

export interface ClientVersionDetail {
  id: string;
  version_number: number;
  snapshot: Record<string, any>;
  valid_from: string | null;
  valid_to: string | null;
  is_current: boolean;
  change_reason: string | null;
  created_at: string | null;
  queried_date?: string;
}
