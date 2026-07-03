import axios from "axios";
import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

// Plain axios (no auth interceptors) for the BFF's own auth routes —
// login/logout/exchange calls that should never trigger the 401-redirect
// interceptor in httpClient (e.g. a bad-password 401 on the login page
// itself must not bounce the user back to /login).
const authClient = axios.create({ withCredentials: true });

// ── Types ─────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
  force?: boolean;
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
  permissions?: {
    module: string;
    can_read: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
  }[];
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  subdomain?: string | null;
  status?: string;
  device_info?: {
    ip: string;
    last_active: string;
  };
}

export interface IAStaffLoginResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user_name?: string;
  user_role?: string;
  tenant_name?: string;
  status?: string;
  device_info?: {
    ip: string;
    last_active: string;
  };
}

// ── Auth Service ─────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * POST /api/v1/auth/login
   * For Significia Super Admins only (app.significia.com)
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await authClient.post("/api/auth/login", payload);

    if (data.status === "active_session_exists") {
      return data;
    }

    const subdomain = data.subdomain;
    const user = await this.getCurrentUser();
    return { user, subdomain };
  },

  /**
   * POST /api/v1/ia-auth/login
   * For IA Staff only — separate login page at /ia-login
   * The backend resolves the tenant from the Host header (e.g. bunty.com)
   */
  async iaStaffLogin(payload: LoginPayload): Promise<IAStaffLoginResponse> {
    const { data } = await authClient.post<IAStaffLoginResponse>(
      "/api/auth/ia-staff-login",
      payload
    );

    if (data.status === "active_session_exists") {
      return data;
    }

    localStorage.setItem("userRole", data.user_role!);
    localStorage.setItem("tenantName", data.tenant_name!);

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
    const { data } = await authClient.post("/api/auth/client-login", payload);

    if (data.status === "active_session_exists") {
      return data;
    }

    const user = await this.getCurrentClient();
    return { user, subdomain: null };
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
      // Dev-mode simulation override; real tenant resolution happens
      // server-side in the proxy from the request's Host header.
      headers["X-Simulated-Tenant-Slug"] = slug;
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
   * Logout — clears all stored tokens and notifies the backend to clear DB state
   */
  async logout(): Promise<void> {
    const role = localStorage.getItem("userRole");
    try {
      // Clears the httpOnly cookies and best-effort notifies the backend
      // (client/bridge session vs. master session) to invalidate server-side state.
      await authClient.post("/api/auth/logout", { role });
    } catch (e) {
      console.warn("Backend logout failed or not supported:", e);
    }
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantName");
  },
};
