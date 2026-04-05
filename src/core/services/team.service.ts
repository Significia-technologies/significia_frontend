import httpClient from "@/core/api/http-client";

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "partner" | "ia_staff" | "analyst" | "owner";
  designation?: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface CreateTeamMember {
  full_name: string;
  email: string;
  phone_number: string;
  password?: string;
  role: string;
  designation?: string;
}

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
};
