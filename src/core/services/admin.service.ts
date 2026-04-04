import httpClient from "../api/http-client";

export interface ContactPersonPayload {
  name: string;
  designation?: string;
  phone_number: string;
  email: string;
  address?: string;
}

export interface ClientProvisionPayload {
  company_name: string;
  email: string;
  subdomain?: string;
  
  // Registration
  nature_of_entity: string;
  registration_no: string;
  license_expiry_date: string;
  
  // Renewal
  is_renewal: boolean;
  renewal_certificate_no?: string;
  renewal_expiry_date?: string;
  
  // Contacts
  contact_persons: ContactPersonPayload[];
  
  // Billing
  pricing_model: string;
  billing_mode: string;
  plan_expiry_date?: string;
  max_client_permit: number;
}

export interface ClientProvisionResponse {
  id: string;
  email: string;
  tenant_id: string;
  tenant_name: string;
  subdomain: string | null;
  bridge_registration_token: string;
  message: string;
}

export interface StaffUserOut {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  designation?: string;
  address?: string;
  role: string;
  status: string;
  last_login_at?: string;
  created_at: string;
}

export interface ActivityLogOut {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export const AdminService = {
  /**
   * Provisions a new client Tenant and root Owner.
   */
  provisionClient: async (payload: ClientProvisionPayload): Promise<ClientProvisionResponse> => {
    const response = await httpClient.post<ClientProvisionResponse>("/admin/clients", payload);
    return response.data;
  },

  /**
   * List all staff users (Master Tenant).
   */
  listStaff: async (): Promise<StaffUserOut[]> => {
    const response = await httpClient.get<StaffUserOut[]>("/admin/staff");
    return response.data;
  },

  /**
   * Create a new staff user.
   */
  createStaff: async (payload: any): Promise<StaffUserOut> => {
    const response = await httpClient.post<StaffUserOut>("/admin/staff", payload);
    return response.data;
  },

  /**
   * Update staff user (Role/Status/Soft-delete).
   */
  updateStaff: async (userId: string, payload: any): Promise<StaffUserOut> => {
    const response = await httpClient.put<StaffUserOut>(`/admin/staff/${userId}`, payload);
    return response.data;
  },

  /**
   * Fetch system-wide administrative activity logs.
   */
  getLogs: async (limit: number = 100): Promise<ActivityLogOut[]> => {
    const response = await httpClient.get<ActivityLogOut[]>(`/admin/logs?limit=${limit}`);
    return response.data;
  },
};
