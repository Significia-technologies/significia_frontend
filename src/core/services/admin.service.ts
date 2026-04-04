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

export const AdminService = {
  /**
   * Provisions a new client Tenant and root Owner.
   * Requires Super Admin privileges.
   */
  provisionClient: async (payload: ClientProvisionPayload): Promise<ClientProvisionResponse> => {
    const response = await httpClient.post<ClientProvisionResponse>("/admin/clients", payload);
    return response.data;
  },
};
