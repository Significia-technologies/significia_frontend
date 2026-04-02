import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

// ── Types ─────────────────────────────────────────

export interface TenantInfo {
  tenant_id: string;
  tenant_name: string;
  subdomain: string;
  custom_domain: string | null;
  bridge_status: "PENDING" | "REGISTERED" | "ACTIVE" | "OFFLINE" | "REVOKED";
}

export interface BridgeOverview {
  tenant_id: string;
  tenant_name: string;
  billing_plan: string;
  max_client_permit: number;
  current_client_count: number;
  plan_price_annual: number;
  bridge_status: string;
  bridge_registration_token: string | null;
  custom_domain: string | null;
  subdomain: string | null;
  latest_invoice_status: string;
  created_at: string;
}

export interface TenantUpdatePayload {
  custom_domain: string;
}

export interface BillingStats {
  total_tenants: number;
  active_tenants: number;
  active_bridges: number;
  total_clients_across_all_ias: number;
  plan_distribution: Record<string, { count: number; revenue: number }>;
}

export interface ProvisionRequest {
  tenant_name: string;
  subdomain: string;
  billing_plan?: string;
  admin_email: string;
  admin_password: string;
}

// ── Bridge Service ─────────────────────────────────────────────────────────

export class BridgeService {
  /**
   * GET /ia-auth/tenant-info
   * Called on page load to get the current domain's tenant info + Bridge status.
   * Used to gate the Master hub and show branding.
   */
  static async getTenantInfo(): Promise<TenantInfo> {
    const response = await httpClient.get<TenantInfo>(API_ENDPOINTS.IA_AUTH.TENANT_INFO);
    return response.data;
  }

  /**
   * GET /bridge/tenants/bridges
   * Super Admin only — get all tenants and their Bridge statuses.
   */
  static async getAllBridges(): Promise<BridgeOverview[]> {
    const response = await httpClient.get<BridgeOverview[]>(API_ENDPOINTS.BRIDGE.ALL_BRIDGES);
    return response.data;
  }

  /**
   * PATCH /bridge/tenants/me
   * IA Self-Service: Update organization settings (e.g. custom domain)
   */
  static async updateTenantDomain(payload: TenantUpdatePayload): Promise<any> {
    const response = await httpClient.patch(API_ENDPOINTS.BRIDGE.UPDATE_ME, payload);
    return response.data;
  }

  /**
   * POST /bridge/tenants/provision
   * Super Admin only — provision a new IA tenant and generate their Bridge token.
   */
  static async provision(data: ProvisionRequest): Promise<{ tenant_id: string; registration_token: string }> {
    const response = await httpClient.post(API_ENDPOINTS.BRIDGE.PROVISION, data);
    return response.data;
  }

  /**
   * POST /bridge/tenants/{tenantId}/revoke
   * Super Admin only — revoke a tenant's Bridge access (kill switch).
   */
  static async revoke(tenantId: string): Promise<void> {
    await httpClient.post(API_ENDPOINTS.BRIDGE.REVOKE(tenantId), {});
  }

  /**
   * GET /billing/overview
   * Super Admin only — billing overview for all tenants.
   */
  static async getBillingOverview(): Promise<BridgeOverview[]> {
    const response = await httpClient.get<BridgeOverview[]>(API_ENDPOINTS.BILLING.OVERVIEW);
    return response.data;
  }

  /**
   * GET /billing/stats
   * Super Admin only — platform-wide statistics.
   */
  static async getBillingStats(): Promise<BillingStats> {
    const response = await httpClient.get<BillingStats>(API_ENDPOINTS.BILLING.STATS);
    return response.data;
  }

  /**
   * POST /bridge/tenants/{tenantId}/initialize
   * Super Admin only — initialize a tenant's Bridge database (create tables).
   */
  static async initializeBridge(tenantId: string): Promise<any> {
    const response = await httpClient.post(API_ENDPOINTS.BRIDGE.INITIALIZE(tenantId), {});
    return response.data;
  }

  /**
   * POST /billing/tenant/{tenantId}/plan
   * Super Admin only — update a tenant's billing plan.
   */
  static async updatePlan(tenantId: string, plan: string): Promise<void> {
    await httpClient.post(API_ENDPOINTS.BILLING.UPDATE_PLAN(tenantId), { plan });
  }
}
