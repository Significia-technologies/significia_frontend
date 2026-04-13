import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface ProposedChange {
  field: string;
  current: any;
  proposed: any;
  reason: string;
}

export interface JustificationDetails {
  q1: string;
  q2: string;
  q3: string;
}

export interface ImpactDeclaration {
  financial: boolean;
  risk: boolean;
  asset_allocation: boolean;
  portfolio: boolean;
  remarks?: string;
}

export interface RectificationCreate {
  client_id: string;
  module: "RISK" | "FINANCIAL" | "CLIENT" | "ASSET";
  record_id: string;
  current_version: number;
  proposed_changes: ProposedChange[];
  justification_details: JustificationDetails;
  impact_declaration: ImpactDeclaration;
  purpose_of_edit?: string;
  confirmation_mode: string;
  confirmation_reference?: string;
  is_investor_requested: boolean;
  initiation_reason: string;
}

export interface RectificationResponse {
  id: string;
  serial_no: string;
  client_id: string;
  module: string;
  record_id: string;
  current_version: number;
  proposed_changes: ProposedChange[];
  justification_details: JustificationDetails;
  impact_declaration: ImpactDeclaration;
  purpose_of_edit?: string;
  confirmation_mode: string;
  confirmation_reference?: string;
  is_investor_requested: boolean;
  initiation_reason: string;
  investor_request_path?: string;
  signed_form_path?: string;
  document_path?: string;
  status: "DRAFT" | "UPDATED" | "APPROVED";
  requested_by_id: string;
  requested_by_name?: string;
  requested_by_role?: string;
  approved_by_id?: string;
  approved_by_name?: string;
  approved_by_role?: string;
  created_at: string;
  updated_at: string;
}



export class RectificationService {
  /**
   * Fetch current values for a specific record to compare.
   */
  static async getCurrentValues(module: string, recordId: string): Promise<Record<string, any>> {
    const response = await httpClient.get(
      API_ENDPOINTS.RECTIFICATION.CURRENT_VALUES(module, recordId)
    );
    return response.data;
  }

  /**
   * Start a new rectification process.
   */
  static async initiate(data: RectificationCreate): Promise<RectificationResponse> {
    const response = await httpClient.post<RectificationResponse>(
      API_ENDPOINTS.RECTIFICATION.INITIATE,
      data
    );
    return response.data;
  }

  /**
   * List all rectifications (optionally filtered by client).
   */
  static async list(clientId?: string): Promise<RectificationResponse[]> {
    const response = await httpClient.get<RectificationResponse[]>(
      API_ENDPOINTS.RECTIFICATION.LIST,
      { params: { client_id: clientId } }
    );
    return response.data;
  }

  /**
   * Get specific rectification details.
   */
  static async getById(id: string): Promise<RectificationResponse> {
    const response = await httpClient.get<RectificationResponse>(
      API_ENDPOINTS.RECTIFICATION.DETAIL(id)
    );
    return response.data;
  }

  /**
   * Upload compliance documents with progress tracking.
   * @param docType - 'investor_request' or 'signed_form'
   */
  static async uploadSignedForm(
    id: string, 
    file: File, 
    docType: "investor_request" | "signed_form" = "signed_form",
    onProgress?: (percent: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    
    const response = await httpClient.post(
      API_ENDPOINTS.RECTIFICATION.UPLOAD(id),
      formData,
      { 
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      }
    );
    return response.data;
  }

  /**
   * Delete an uploaded document.
   */
  static async deleteDocument(id: string, docType: "investor_request" | "signed_form"): Promise<any> {
    const response = await httpClient.delete(
        `${API_ENDPOINTS.RECTIFICATION.DOCUMENT(id)}?doc_type=${docType}`
    );
    return response.data;
  }

  /**
   * IA Approval.
   */
  static async approve(id: string): Promise<RectificationResponse> {
    const response = await httpClient.post<RectificationResponse>(
      API_ENDPOINTS.RECTIFICATION.APPROVE(id)
    );
    return response.data;
  }

  /**
   * Download the formal authorization PDF (System Generated).
   */
  static async downloadPdf(id: string, serialNo: string): Promise<void> {
    const response = await httpClient.get(
      `${API_ENDPOINTS.RECTIFICATION.DETAIL(id)}/pdf`,
      { responseType: "blob" }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rectification_${serialNo}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download an uploaded document (Proxied through Backend).
   */
  static async downloadDocument(id: string, docType: "investor_request" | "signed_form", filename: string): Promise<void> {
    const response = await httpClient.get(
        `${API_ENDPOINTS.RECTIFICATION.DOCUMENT(id)}?doc_type=${docType}`,
        { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
  
  /**
   * Update an existing rectification record.
   */
  static async update(id: string, data: Partial<RectificationCreate>): Promise<RectificationResponse> {
    const response = await httpClient.patch<RectificationResponse>(
      API_ENDPOINTS.RECTIFICATION.DETAIL(id),
      data
    );
    return response.data;
  }
}


