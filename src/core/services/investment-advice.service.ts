import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface InvestmentAdviceRecommendation {
  id?: string;
  advice_note_id?: string;
  product_type: string;
  product_id?: string;
  product_name: string;
  isin_code_scheme_code_uin: string;
  action: "BUY" | "HOLD" | "SELL" | "REVIEW";
  amount_units: string;
  transaction_type?: 'SIP' | 'STP' | 'SWP' | 'LUMP_SUM' | 'HOLDING' | 'TEXT_ONLY' | 'SWITCH_IN' | 'SWITCH_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY' | null;
  amount?: number | null;
  custom_instruction?: string | null;
  indicative_price_nav?: number | null;
  rationale: string;
}

export interface InvestmentAdviceNote {
  id: string;
  client_id: string;
  advice_note_no: string;
  date_of_issue: string;
  advice_validity_days: number;
  advice_validity_custom_text?: string | null;
  principal_officer_id?: string | null;
  principal_officer_name: string;
  principal_officer_reg_no: string;
  advice_category: string;
  annual_income_band?: string | null;
  assets_under_advice: number;
  primary_financial_goal?: string | null;
  fee_mode: string;
  fee_amount: number;
  recommended_asset_allocation?: any;
  date_of_allocation?: string | null;
  current_asset_allocation: string;
  rebalancing_rationale: string;
  asset_allocation_id?: string | null;
  financial_analysis_profile_id?: string | null;
  suitability_assessment?: string | null;
  suitability_basis?: string | null;
  investor_advice?: string | null;
  conflict_of_interest_text?: string | null;
  no_execution_text?: string | null;
  ai_usage_text?: string | null;
  version_number: number;
  is_locked: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  recommendations?: InvestmentAdviceRecommendation[];
  client_snapshot?: any;
  client_name?: string;
  client_code?: string;
}

export class InvestmentAdviceService {
  static async listAll(): Promise<InvestmentAdviceNote[]> {
    const res = await httpClient.get<{ notes: InvestmentAdviceNote[]; total: number }>(
      API_ENDPOINTS.ADVISORY.LIST_ALL
    );
    return res.data.notes || [];
  }

  static async list(clientId: string): Promise<InvestmentAdviceNote[]> {
    const res = await httpClient.get<{ notes: InvestmentAdviceNote[]; total: number }>(
      API_ENDPOINTS.ADVISORY.LIST(clientId)
    );
    return res.data.notes || [];
  }

  static async get(noteId: string): Promise<InvestmentAdviceNote> {
    const res = await httpClient.get<InvestmentAdviceNote>(
      API_ENDPOINTS.ADVISORY.DETAIL(noteId)
    );
    return res.data;
  }

  static async create(clientId: string, data: Partial<InvestmentAdviceNote>): Promise<InvestmentAdviceNote> {
    const res = await httpClient.post<InvestmentAdviceNote>(
      API_ENDPOINTS.ADVISORY.CREATE(clientId),
      data
    );
    return res.data;
  }

  static async update(noteId: string, data: Partial<InvestmentAdviceNote>): Promise<InvestmentAdviceNote> {
    const res = await httpClient.patch<InvestmentAdviceNote>(
      API_ENDPOINTS.ADVISORY.UPDATE(noteId),
      data
    );
    return res.data;
  }

  static async lock(noteId: string): Promise<{ message: string; is_locked: boolean }> {
    const res = await httpClient.post<{ message: string; is_locked: boolean }>(
      API_ENDPOINTS.ADVISORY.LOCK(noteId)
    );
    return res.data;
  }

  static async addRecommendation(
    noteId: string,
    data: InvestmentAdviceRecommendation
  ): Promise<InvestmentAdviceRecommendation> {
    const res = await httpClient.post<InvestmentAdviceRecommendation>(
      API_ENDPOINTS.ADVISORY.ADD_REC(noteId),
      data
    );
    return res.data;
  }

  static async deleteRecommendation(noteId: string, recId: string): Promise<{ message: string }> {
    const res = await httpClient.delete<{ message: string }>(
      API_ENDPOINTS.ADVISORY.DELETE_REC(noteId, recId)
    );
    return res.data;
  }

  static async downloadPDF(noteId: string, adviceNoteNo: string): Promise<void> {
    const res = await httpClient.get(API_ENDPOINTS.ADVISORY.PDF(noteId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    const safeName = adviceNoteNo.replace(/[^a-zA-Z0-9-_]/g, "_");
    link.setAttribute("download", `InvestmentAdviceNote_${safeName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
  }
}
