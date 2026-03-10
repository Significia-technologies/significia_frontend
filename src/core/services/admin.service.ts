import httpClient from "../api/http-client";
import { User } from "./auth.service";

export interface ClientProvisionPayload {
  company_name: string;
  email: string;
  password: string;
}

export const AdminService = {
  /**
   * Provisions a new client Tenant and root Owner.
   * Requires Super Admin privileges.
   */
  provisionClient: async (payload: ClientProvisionPayload): Promise<User> => {
    const response = await httpClient.post<User>("/admin/clients", payload);
    return response.data;
  },

  // Add more admin operations here later (e.g., list clients)
};
