import httpClient from "../api/http-client";

export interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  bridge_url: string | null;
  is_active: boolean;
}

export interface TenantPortalUpdate {
  subdomain?: string;
  custom_domain?: string;
}

export class TenantService {
  /**
   * Get the current tenant's profile and portal settings.
   */
  static async getMyTenant(): Promise<Tenant> {
    const response = await httpClient.get<Tenant>("/tenants/me");
    return response.data;
  }

  /**
   * Update the subdomain or custom domain for the current tenant.
   * Only IA Owners can do this.
   */
  static async updatePortalSettings(data: TenantPortalUpdate): Promise<Tenant> {
    const response = await httpClient.patch<Tenant>("/tenants/me/portal", data);
    return response.data;
  }
}
