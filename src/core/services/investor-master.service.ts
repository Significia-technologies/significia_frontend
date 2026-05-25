import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export type InvestorRelation = "Self" | "Spouse" | "Son" | "Daughter" | "HUF";

export interface InvestorMember {
  id: string;
  client_id: string;
  client_code: string;
  investor_code: string;
  sequence_number: number;
  full_name: string;
  relation: InvestorRelation;
  gender: string | null;
  date_of_birth: string;
  pan_number: string;
  ckyc_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvestorMemberCreate {
  full_name: string;
  relation: InvestorRelation;
  gender?: string;
  date_of_birth: string;
  pan_number: string;
  ckyc_number: string;
}

export class InvestorMasterService {
  static async listMembers(
    clientId: string,
    reportType: "full" | "active" = "full"
  ): Promise<{ members: InvestorMember[]; total: number }> {
    const res = await httpClient.get(
      API_ENDPOINTS.INVESTOR_MASTER.LIST(clientId),
      { params: { report_type: reportType } }
    );
    return res.data;
  }

  static async createMember(
    clientId: string,
    data: InvestorMemberCreate
  ): Promise<InvestorMember> {
    const res = await httpClient.post(
      API_ENDPOINTS.INVESTOR_MASTER.CREATE(clientId),
      data
    );
    return res.data;
  }

  static async toggleMember(
    clientId: string,
    memberId: string
  ): Promise<InvestorMember> {
    const res = await httpClient.patch(
      API_ENDPOINTS.INVESTOR_MASTER.TOGGLE(clientId, memberId)
    );
    return res.data;
  }
}
