import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Employee {
  id?: string;
  name_of_employee: string;
  designation: string;
  ia_registration_number: string;
  date_of_registration?: string;
  date_of_registration_expiry?: string;
  certificate_path?: string;
  created_at?: string;
}

export interface IAMaster {
  id: string;
  name_of_ia: string;
  nature_of_entity: string;
  name_of_entity?: string;
  ia_registration_number: string;
  date_of_registration?: string;
  date_of_registration_expiry?: string;
  registered_address: string;
  registered_contact_number: string;
  office_contact_number?: string;
  registered_email_id: string;
  cin_number?: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch: string;
  ifsc_code: string;
  ia_certificate_path?: string;
  ia_signature_path?: string;
  ia_logo_path?: string;
  max_client_permit: number;
  current_client_count: number;
  created_at: string;
  updated_at: string;
  employees: Employee[];
}

export class IAMasterService {
  static async validateIANumber(connectorId: string, iaNumber: string): Promise<boolean> {
    const response = await httpClient.get<{ exists: boolean }>(
      API_ENDPOINTS.MASTER.IA_MASTER.VALIDATE(connectorId, iaNumber)
    );
    return response.data.exists;
  }

  static async create(connectorId: string, formData: FormData): Promise<IAMaster> {
    const response = await httpClient.post<IAMaster>(
      API_ENDPOINTS.MASTER.IA_MASTER.CREATE(connectorId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  static async getLatest(connectorId: string): Promise<IAMaster | null> {
    const response = await httpClient.get<IAMaster | null>(
      API_ENDPOINTS.MASTER.IA_MASTER.LATEST(connectorId)
    );
    return response.data;
  }

  static async downloadPdf(connectorId: string, iaId: string): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.MASTER.IA_MASTER.PDF(connectorId, iaId),
      { responseType: "blob" }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `IA_Report_${iaId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async updateClientPermit(connectorId: string, iaId: string, maxPermit: number): Promise<IAMaster> {
    const response = await httpClient.patch<IAMaster>(
      API_ENDPOINTS.MASTER.IA_MASTER.UPDATE_PERMIT(connectorId, iaId),
      { max_client_permit: maxPermit }
    );
    return response.data;
  }

  static async listConnectors(): Promise<any[]> {
    const response = await httpClient.get<any[]>(API_ENDPOINTS.CONNECTORS.LIST);
    return response.data;
  }
}
