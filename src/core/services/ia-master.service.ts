import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Department {
  id: string;
  name: string;
  created_at: string;
  employee_count?: number;
}

export interface Employee {
  id?: string;
  name_of_employee?: string;
  full_name?: string;
  name?: string;
  date_of_birth?: string;
  designation?: string;
  phone_number?: string;
  staff_code?: string;
  date_of_joining?: string;
  date_of_leaving?: string;
  employee_type?: 'advisory' | 'non-advisory';
  department_id?: string;
  department_name?: string;
  ia_registration_number?: string;
  date_of_registration?: string;
  date_of_registration_expiry?: string;
  certificate_issue_date?: string;
  certificate_path?: string;
  version_number?: number;
  created_at?: string;
}

export interface IAMaster {
  id: string;
  name_of_ia: string;
  date_of_birth: string;
  nature_of_entity: string;
  name_of_entity?: string;
  basl_membership_id: string;
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
  brand_color?: string;
  portal_title?: string;
  portal_description?: string;
  favicon_path?: string;
  max_client_permit: number;
  current_client_count: number;
  created_at: string;
  updated_at: string;
  employees?: Employee[];
}

// ── IA Master Service (Bridge Architecture) ───────────────────────────────
// No required — backend resolves tenant from JWT + X-Tenant-Slug

export class IAMasterService {
  static async validateIANumber(iaNumber: string): Promise<boolean> {
    const response = await httpClient.get<{ exists: boolean }>(
      API_ENDPOINTS.MASTER.IA_MASTER.VALIDATE(iaNumber)
    );
    return response.data.exists;
  }

  static async create(formData: FormData): Promise<IAMaster> {
    const response = await httpClient.post<IAMaster>(
      API_ENDPOINTS.MASTER.IA_MASTER.CREATE,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  static async update(iaId: string, formData: FormData): Promise<IAMaster> {
    const response = await httpClient.patch<IAMaster>(
      API_ENDPOINTS.MASTER.IA_MASTER.UPDATE(iaId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  }

  static async getLatest(): Promise<IAMaster | null> {
    const response = await httpClient.get<IAMaster | null>(
      API_ENDPOINTS.MASTER.IA_MASTER.LATEST
    );
    return response.data;
  }

  static async downloadPdf(iaId: string): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.MASTER.IA_MASTER.PDF(iaId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `IA_Report_${iaId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async updateClientPermit(iaId: string, maxPermit: number): Promise<IAMaster> {
    const response = await httpClient.patch<IAMaster>(
      API_ENDPOINTS.MASTER.IA_MASTER.UPDATE_PERMIT(iaId),
      { max_client_permit: maxPermit }
    );
    return response.data;
  }

  static async listEmployees(): Promise<Employee[]> {
    const response = await httpClient.get<Employee[]>(
      API_ENDPOINTS.MASTER.IA_MASTER.EMPLOYEES
    );
    return response.data;
  }

  // ── Department Management ──

  static async listDepartments(): Promise<Department[]> {
    const response = await httpClient.get<Department[]>(
      API_ENDPOINTS.MASTER.DEPARTMENTS.LIST
    );
    return response.data;
  }

  static async createDepartment(name: string): Promise<Department> {
    const response = await httpClient.post<Department>(
      API_ENDPOINTS.MASTER.DEPARTMENTS.CREATE,
      { name }
    );
    return response.data;
  }

  static async updateDepartment(id: string, name: string): Promise<Department> {
    const response = await httpClient.put<Department>(
      API_ENDPOINTS.MASTER.DEPARTMENTS.UPDATE(id),
      { name }
    );
    return response.data;
  }

  static async deleteDepartment(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.MASTER.DEPARTMENTS.DELETE(id));
  }
}
