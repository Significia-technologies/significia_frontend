import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface RiskAssessmentCalculateRequest {
  answers: Record<string, string | Record<string, string>>;
}

export interface RiskAssessmentCalculateResponse {
  success: boolean;
  total_score: number;
  question_scores: Record<string, number>;
  risk_tier: string;
  recommendation: string;
}

export interface RiskAssessmentCreate {
  client_code: string;
  answers: Record<string, string | Record<string, string>>;
  discussion_notes?: string;
  disclaimer_text?: string;
  form_name?: string;
}

export interface SaveAssessmentResponse {
  success: boolean;
  assessment_id: string;
  risk_id: string;
  total_score: number;
  risk_tier: string;
  client_code: string;
  ia_registration_number: string;
}

export interface RiskAssessment {
  id: string;
  client_id: string;
  client_name?: string;
  client_code?: string;
  calculated_score: number;
  assigned_risk_tier: string;
  tier_recommendation?: string;
  form_name: string;
  assessment_timestamp: string;
  created_at: string;
}

// ── Risk Profile Service (Bridge Architecture) ────────────────────────────
// No  required — backend resolves tenant from JWT + X-Tenant-Slug

export class RiskProfileService {
  static async calculate(
    data: RiskAssessmentCalculateRequest
  ): Promise<RiskAssessmentCalculateResponse> {
    const response = await httpClient.post<RiskAssessmentCalculateResponse>(
      API_ENDPOINTS.RISK_PROFILE.CALCULATE,
      data
    );
    return response.data;
  }

  static async save(data: RiskAssessmentCreate): Promise<SaveAssessmentResponse> {
    const response = await httpClient.post<SaveAssessmentResponse>(
      API_ENDPOINTS.RISK_PROFILE.SAVE,
      data
    );
    return response.data;
  }

  static async getLatest(clientCode: string): Promise<RiskAssessment> {
    const response = await httpClient.get<RiskAssessment>(
      API_ENDPOINTS.RISK_PROFILE.LATEST_FOR_CLIENT(clientCode)
    );
    return response.data;
  }

  static async getAll(): Promise<RiskAssessment[]> {
    const response = await httpClient.get<RiskAssessment[]>(API_ENDPOINTS.RISK_PROFILE.LIST);
    return response.data;
  }

  static async downloadPDF(
    assessmentId: string,
    filename = "Risk_Profile.pdf"
  ): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.RISK_PROFILE.PDF(assessmentId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadDOCX(
    assessmentId: string,
    filename = "Risk_Profile.docx"
  ): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.RISK_PROFILE.DOCX(assessmentId), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ── Custom Questionnaire Methods ───────────────────────────

  static async listQuestionnaires(status?: string): Promise<any[]> {
    const response = await httpClient.get<any[]>(API_ENDPOINTS.RISK_PROFILE.QUESTIONNAIRES, {
      params: { status },
    });
    return response.data;
  }

  static async getQuestionnaire(qId: string): Promise<any> {
    const response = await httpClient.get<any>(
      API_ENDPOINTS.RISK_PROFILE.QUESTIONNAIRE(qId)
    );
    return response.data;
  }

  static async createQuestionnaire(data: any): Promise<any> {
    const response = await httpClient.post<any>(
      API_ENDPOINTS.RISK_PROFILE.QUESTIONNAIRES,
      data
    );
    return response.data;
  }

  static async updateQuestionnaire(qId: string, data: any): Promise<any> {
    const response = await httpClient.put<any>(
      API_ENDPOINTS.RISK_PROFILE.QUESTIONNAIRE(qId),
      data
    );
    return response.data;
  }

  static async saveCustomAssessment(data: any): Promise<any> {
    const response = await httpClient.post<any>(API_ENDPOINTS.RISK_PROFILE.CUSTOM_SAVE, data);
    return response.data;
  }

  static async listCustomAssessments(clientId?: string): Promise<any[]> {
    const response = await httpClient.get<any[]>(API_ENDPOINTS.RISK_PROFILE.CUSTOM_LIST, {
      params: { client_id: clientId },
    });
    return response.data;
  }

  static async downloadCustomPDF(
    assessmentId: string,
    filename = "Custom_Risk_Profile.pdf"
  ): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.RISK_PROFILE.CUSTOM_PDF(assessmentId),
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadCustomDOCX(
    assessmentId: string,
    filename = "Custom_Risk_Profile.docx"
  ): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.RISK_PROFILE.CUSTOM_DOCX(assessmentId),
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadBlankPDF(
    questionnaireId: string,
    filename = "Blank_Risk_Form.pdf"
  ): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.RISK_PROFILE.BLANK_PDF(questionnaireId),
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
