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
  total_score: number;
  risk_tier: string;
  answers: any;
  recommendation?: string;
  created_at: string;
}

export class RiskProfileService {
  static async calculate(connectorId: string, data: RiskAssessmentCalculateRequest): Promise<RiskAssessmentCalculateResponse> {
    const response = await httpClient.post<RiskAssessmentCalculateResponse>(
      API_ENDPOINTS.RISK_PROFILE.CALCULATE(connectorId),
      data
    );
    return response.data;
  }

  static async save(connectorId: string, data: RiskAssessmentCreate): Promise<SaveAssessmentResponse> {
    const response = await httpClient.post<SaveAssessmentResponse>(
      API_ENDPOINTS.RISK_PROFILE.SAVE(connectorId),
      data
    );
    return response.data;
  }

  static async getLatest(connectorId: string, clientCode: string): Promise<RiskAssessment> {
    const response = await httpClient.get<RiskAssessment>(
      API_ENDPOINTS.RISK_PROFILE.LATEST(connectorId, clientCode)
    );
    return response.data;
  }

  static async downloadPDF(connectorId: string, assessmentId: string, filename: string = "Risk_Profile.pdf"): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.RISK_PROFILE.PDF(connectorId, assessmentId),
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
