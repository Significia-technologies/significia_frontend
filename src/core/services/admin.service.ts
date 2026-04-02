import httpClient from "../api/http-client";

export interface ClientProvisionPayload {
  company_name: string;
  email: string;
  subdomain?: string;
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
