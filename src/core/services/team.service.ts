import httpClient from "@/core/api/http-client";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "partner" | "ia_staff" | "research_analyst" | "investment_advisor" | "management" | "owner";
  designation?: string;
  status: "active" | "inactive";
  created_at: string;
  staff_code?: string;
  date_of_joining?: string;
  date_of_leaving?: string;
  employee_type?: 'advisory' | 'non-advisory';
  department_id?: string;
  department_name?: string;
  ia_registration_number?: string;
  date_of_registration?: string;
  date_of_registration_expiry?: string;
  certificate_issue_date?: string;
  version_number?: number;
}

export interface CreateTeamMember {
  full_name: string;
  email: string;
  phone_number: string;
  password?: string;
  role: string;
  designation?: string;
  ia_registration_number?: string;
  date_of_registration?: string;
  date_of_registration_expiry?: string;
}

export interface ModulePermission {
  module: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export const APP_MODULES = [
  "Clients",
  "Portfolio",
  "Financial Goals",
  "Risk Profiles",
  "Asset Allocation",
  "Security Basket",
  "Operations",
  "Drawers",
  "Tools"
];

export const TeamService = {
  /**
   * List all organizational team members (Partners, Staff, etc.)
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await httpClient.get("/team");
    return response.data;
  },

  /**
   * Onboard a new member to the organization silo.
   * Note: This counts against the tenant's license permit.
   */
  async onboardTeamMember(data: CreateTeamMember | FormData): Promise<TeamMember> {
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    const response = await httpClient.post("/team", data, config);
    return response.data;
  },

  /**
   * Update an existing team member's profile or status.
   */
  async updateTeamMember(id: string, data: Partial<CreateTeamMember>): Promise<TeamMember> {
    const response = await httpClient.put(`/team/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate a team member (soft-delete).
   */
  async removeTeamMember(id: string): Promise<void> {
    await httpClient.delete(`/team/${id}`);
  },

  /**
   * Get dynamic permissions for a team member.
   */
  async getMemberPermissions(id: string): Promise<ModulePermission[]> {
    const response = await httpClient.get(`/team/${id}/permissions`);
    return response.data;
  },

  /**
   * Save dynamic permissions for a team member.
   */
  async updateMemberPermissions(id: string, permissions: ModulePermission[]): Promise<void> {
    await httpClient.put(`/team/${id}/permissions`, permissions);
  },
};
