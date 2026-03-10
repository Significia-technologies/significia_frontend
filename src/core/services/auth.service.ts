import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

// ── Types (matching backend user schema) ─────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  companyName: string;
}

/**
 * Backend returns a "safe user" — all columns EXCEPT:
 * passwordHash, refreshTokenHash, twoFactorSecret, twoFactorRecoveryCodes
 */
export interface User {
  id: string;
  email: string;
  role: "super_admin" | "owner" | "admin" | "analyst" | "user";
  tenant_id: string;
  company_name: string;
  // Note: Add additional properties if backend adds them
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Auth Service ────────────────────────────────────

export const AuthService = {
  /**
   * POST /api/v1/auth/login
   * Body: { email, password }
   * Response: { access_token, refresh_token, token_type }
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    
    // Backend returns access_token and refresh_token (snake_case)
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;

    // Persist explicitly for Axios interceptor usage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // After login, we must fetch the user details separately
    // because the FastAPI login route only returns the tokens.
    const user = await this.getCurrentUser();

    return { user, accessToken, refreshToken };
  },

  /**
   * POST /api/v1/auth/register
   * Body: { email, password, company_name }
   * Response: { id, email, role, tenant_id }
   */
  async register(payload: RegisterPayload): Promise<User> {
    const backendPayload = {
      email: payload.email,
      password: payload.password,
      company_name: payload.companyName,
    };
    
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, backendPayload);
    // Registration only returns a User object (201 Created), no tokens anymore
    return data as User;
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      // Optional: inform backend
      // await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  /**
   * GET /api/v1/auth/me
   * Requires Authorization header
   * Response: JSON body is directly the User object
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await httpClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return data as User;
  },
};
