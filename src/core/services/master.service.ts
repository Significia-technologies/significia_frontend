import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ─────────────────────────────────────────

export interface Client {
  id: string;
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
}

// ── Master Data Service (Bridge Architecture) ─────────────────────────────
// No  required — backend resolves tenant from JWT + X-Tenant-Slug

export class MasterDataService {
  static async listClients(): Promise<Client[]> {
    const response = await httpClient.get<{ clients: Client[]; total: number }>(
      API_ENDPOINTS.MASTER.CLIENTS.LIST
    );
    // Bridge Architecture returns { clients: [], total: 0 }
    return response.data.clients || [];
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
}
