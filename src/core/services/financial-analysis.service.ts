import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface FinancialAnalysisProfile {
  id: string;
  client_id: string;
  occupation: string;
  dob: string;
  spouse_name?: string;
  spouse_dob?: string;
  spouse_occupation?: string;
  children?: any[];
  annual_income: number;
  expenses: any;
  assets: { land: number; inv: number; cash: number; retirement: number; others?: { label: string; amount: number }[] };
  liabilities: { personal: number; cc: number; hb: number; others?: { label: string; amount: number }[] };
  insurance: any;
  retirement_age: number;
  assumptions: any;
  medical_bonus_years?: number;
  medical_bonus_percentage?: number;
  education_investment_pct?: number;
  marriage_investment_pct?: number;
  discussion_notes?: string;
  exclude_ai?: boolean | number;
  pan?: string;
  contact?: string;
  email?: string;
  disclaimer_text?: string;
  record_version_control_statement?: string;
  created_at: string;
}

export interface FinancialAnalysisResult {
  id: string;
  client_id: string;
  profile_id: string;
  calculations: any;
  hlv_data: any;
  medical_data: any;
  ai_analysis: any;
  cash_flow_analysis: any[];
  version_number?: number;
  parent_profile_id?: string;
  root_profile_id?: string;
  created_at: string;
}

export interface CalculationStep {
  section: string;
  steps: { step: number; description: string; formula: string; calculation?: string; result: string }[];
}

export interface CalculationDetails {
  result_id: string;
  client_id: string;
  sections: CalculationStep[];
  created_at: string;
}

export interface FinancialAnalysisCreate {
  client_id: string;
  pan?: string;
  contact?: string;
  email?: string;
  occupation: string;
  dob: string;
  spouse_name?: string;
  spouse_dob?: string;
  spouse_occupation?: string;
  children?: any[];
  annual_income: number;
  expenses: { hh: number; med: number; travel: number; elec: number; tele: number; maid: number; edu: number; ent: number; emi: number; savings: number; misc: number };
  assets: { land: number; inv: number; cash: number; retirement: number; others?: { label: string; amount: number }[] };
  liabilities: { personal: number; cc: number; hb: number; others?: { label: string; amount: number }[] };
  insurance: { life_cover: number; life_premium: number; med_cover: number; med_premium: number; veh_cover: number; veh_premium: number; other_cover: number; other_premium: number };
  medical_bonus_years: number;
  medical_bonus_percentage: number;
  education_investment_pct: number;
  marriage_investment_pct: number;
  assumptions: { retirement_age: number; le_client: number; le_spouse: number; inflation: number; medical_inflation: number; pre_ret_rate: number; post_ret_rate: number; sol_hlv: number; sol_ret: number; child_education_corpus: number; education_years: number; child_marriage_corpus: number; marriage_years: number };
  exclude_ai?: boolean;
  disclaimer_text?: string;
  discussion_notes?: string;
  record_version_control_statement?: string;
  previous_profile_id?: string;
}

// ── Financial Analysis Service (Bridge Architecture) ──────────────────────
// No  required — backend resolves tenant from JWT + X-Tenant-Slug

export class FinancialAnalysisService {
  static async list(): Promise<FinancialAnalysisResult[]> {
    const response = await httpClient.get<FinancialAnalysisResult[]>(
      API_ENDPOINTS.FINANCIAL_ANALYSIS.LIST
    );
    return response.data;
  }

  static async get(resultId: string): Promise<FinancialAnalysisResult> {
    const response = await httpClient.get<FinancialAnalysisResult>(
      API_ENDPOINTS.FINANCIAL_ANALYSIS.DETAIL(resultId)
    );
    return response.data;
  }

  static async getProfile(profileId: string): Promise<FinancialAnalysisProfile> {
    const response = await httpClient.get<FinancialAnalysisProfile>(
      `${API_ENDPOINTS.FINANCIAL_ANALYSIS.LIST}/profiles/id/${profileId}`
    );
    return response.data;
  }

  static async create(data: FinancialAnalysisCreate): Promise<FinancialAnalysisResult> {
    const response = await httpClient.post<FinancialAnalysisResult>(
      API_ENDPOINTS.FINANCIAL_ANALYSIS.CREATE,
      data
    );
    return response.data;
  }

  static async downloadPDF(resultId: string, clientName: string): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.FINANCIAL_ANALYSIS.PDF(resultId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Financial_Analysis_${clientName.replace(/\s+/g, "_")}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadWord(resultId: string, clientName: string): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.FINANCIAL_ANALYSIS.WORD(resultId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Financial_Analysis_${clientName.replace(/\s+/g, "_")}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async getCalculationDetails(resultId: string): Promise<CalculationDetails> {
    const response = await httpClient.get<CalculationDetails>(
      `${API_ENDPOINTS.FINANCIAL_ANALYSIS.DETAIL(resultId)}/details`
    );
    return response.data;
  }

  static async downloadBlankForm(): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.FINANCIAL_ANALYSIS.FORM, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Financial_Analysis_Data_Entry_Form.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
