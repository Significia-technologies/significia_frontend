import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

// ── Types (matching backend user schema) ─────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Backend returns a "safe user" — all columns EXCEPT:
 * passwordHash, refreshTokenHash, twoFactorSecret, twoFactorRecoveryCodes
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  role: "super_admin" | "admin" | "analyst" | "viewer";
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  subscriptionPlan: "free" | "pro" | "enterprise";
  subscriptionStatus: "trialing" | "active" | "past_due" | "cancelled" | "expired";
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standard backend response shape from ApiResponse class:
 * { statusCode, success, message, data }
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  // refreshToken is set as httpOnly cookie — NOT in response body
}

// ── Auth Service ────────────────────────────────────

export const AuthService = {
  /**
   * POST /api/v1/auth/login
   * Body: { email, password }
   * Response: { data: { user, accessToken }, message }
   * Side effect: backend sets refreshToken as httpOnly cookie
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
    const result = data?.data as AuthResponse;

    // Only store the access token — refresh token is in httpOnly cookie
    localStorage.setItem("accessToken", result.accessToken);

    return result;
  },

  /**
   * POST /api/v1/auth/register
   * Body: { firstName, lastName, email, password }
   * Response: { data: { user, accessToken }, message }
   * Side effect: backend sets refreshToken as httpOnly cookie
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await httpClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
    const result = data?.data as AuthResponse;

    // Only store the access token — refresh token is in httpOnly cookie
    localStorage.setItem("accessToken", result.accessToken);

    return result;
  },

  /**
   * POST /api/v1/auth/logout
   * Requires Authorization header (protected route).
   * Backend clears the refreshToken cookie and nullifies the hash in DB.
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      localStorage.removeItem("accessToken");
    }
  },

  /**
   * GET /api/v1/auth/me
   * Requires Authorization header (protected route).
   * Response: { data: { user } }
   */
  async getCurrentUser(): Promise<User> {
    const { data } = await httpClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return data?.data?.user as User;
  },
};
