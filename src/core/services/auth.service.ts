import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

// ── Types ─────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  companyName: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "super_admin" | "owner" | "partner" | "admin" | "analyst" | "user" | "client" | "ia_staff";
  tenant_id: string;
  company_name: string;
  phone_number?: string | null;
  is_profile_completed: boolean;
  max_client_permit: number;
  plan_expiry_date?: string | null;
  custom_domain?: string | null;
  subdomain?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  subdomain?: string | null;
}

export interface IAStaffLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_name: string;
  user_role: string;
  tenant_name: string;
}

// ── Auth Service ─────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * POST /api/v1/auth/login
   * For Significia Super Admins only (app.significia.com)
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const subdomain = data.subdomain;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    const user = await this.getCurrentUser();
    return { user, accessToken, refreshToken, subdomain };
  },

  /**
   * POST /api/v1/ia-auth/login
   * For IA Staff only — separate login page at /ia-login
   * The backend resolves the tenant from the Host header (e.g. bunty.com)
   */
  async iaStaffLogin(payload: LoginPayload): Promise<IAStaffLoginResponse> {
    const { data } = await httpClient.post<IAStaffLoginResponse>(
      API_ENDPOINTS.IA_AUTH.LOGIN,
      payload
    );

    localStorage.setItem("accessToken", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
    localStorage.setItem("userRole", data.user_role);
    localStorage.setItem("tenantName", data.tenant_name);

    return data;
  },

  /**
   * POST /api/v1/auth/register
   * Body: { email, password, company_name }
   */
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: payload.email,
      password: payload.password,
      company_name: payload.companyName,
    });
    return data as User;
  },

  /**
   * POST /api/v1/client-auth/bridge/login
   * For IA clients (investors) logging into the client portal
   */
  async clientLogin(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post(API_ENDPOINTS.CLIENT_AUTH.LOGIN, payload);
    const accessToken = data.access_token;
    localStorage.setItem("accessToken", accessToken);
    const user = await this.getCurrentClient();
    return { user, accessToken, refreshToken: "", subdomain: null };
  },

  /**
   * GET /api/v1/auth/me — Super Admin user
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await httpClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return data as User;
  },

  /**
   * GET /api/v1/client-auth/me — IA Client
   */
  async getCurrentClient(): Promise<User> {
    const { data } = await httpClient.get(API_ENDPOINTS.CLIENT_AUTH.ME);
    return data as User;
  },

  /**
   * GET /api/v1/public/branding
   * Fetch branding (name, logo) for the current tenant context.
   * Does NOT require auth.
   */
  async getPublicBranding(slug?: string): Promise<{
    name: string;
    is_master: boolean;
    logo_type: "significia" | "shield" | "custom";
    logo_url?: string | null;
    brand_color?: string | null;
    brand_background_color_light?: string | null;
    brand_background_color_dark?: string | null;
    portal_title?: string | null;
    portal_description?: string | null;
    favicon_url?: string | null;
  }> {
    const headers: Record<string, string> = {};
    if (slug) {
      headers["X-Tenant-Slug"] = slug;
    }
    
    // We use raw httpClient here because this route is unauthenticated
    const { data } = await httpClient.get(API_ENDPOINTS.PUBLIC.BRANDING, {
      headers,
    });
    return data;
  },

  /**
   * Refresh current user profile/session in global store
   */
  async refreshUser(setUser: (user: User) => void): Promise<User> {
    const user = await this.getCurrentUser();
    setUser(user);
    return user;
  },

  /**
   * Logout — clears all stored tokens
   */
  async logout(): Promise<void> {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantName");
  },
};
