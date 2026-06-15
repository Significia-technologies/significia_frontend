import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";
import { ClientValidateResponse } from "./asset-allocation.service";

export interface ExistingAssetAllocationCreate {
  client_code: string;
  ia_registration_number: string;
  assigned_risk_tier: string;
  tier_recommendation?: string;
  
  stocks_amount: number;
  mutual_fund_equity_amount: number;
  ulip_equity_amount: number;
  etf_equity_amount: number;
  
  fixed_deposits_bonds_amount: number;
  mutual_fund_debt_amount: number;
  ulip_debt_amount: number;
  etf_debt_amount: number;
  
  gold_etf_amount: number;
  silver_etf_amount: number;
  etf_commodity_amount: number;
  
  generate_system_conclusion: boolean;
  system_conclusion?: string;
  discussion_notes?: string;
  disclaimer_text?: string;
  is_draft?: boolean;
}

export interface ExistingAssetAllocation {
  id: string;
  client_id: string;
  client_name?: string;
  client_code?: string;
  ia_registration_number: string;
  assigned_risk_tier: string;
  tier_recommendation?: string;
  
  stocks_amount: number;
  mutual_fund_equity_amount: number;
  ulip_equity_amount: number;
  etf_equity_amount: number;
  fixed_deposits_bonds_amount: number;
  mutual_fund_debt_amount: number;
  ulip_debt_amount: number;
  etf_debt_amount: number;
  gold_etf_amount: number;
  silver_etf_amount: number;
  etf_commodity_amount: number;
  
  equities_amount: number;
  debt_securities_amount: number;
  commodities_amount: number;
  total_amount: number;

  equities_percentage: number;
  debt_securities_percentage: number;
  commodities_percentage: number;

  stocks_percentage: number;
  mutual_fund_equity_percentage: number;
  ulip_equity_percentage: number;
  etf_equity_percentage: number;
  fixed_deposits_bonds_percentage: number;
  mutual_fund_debt_percentage: number;
  ulip_debt_percentage: number;
  etf_debt_percentage: number;
  gold_etf_percentage: number;
  silver_etf_percentage: number;
  etf_commodity_percentage: number;

  system_conclusion?: string;
  generate_system_conclusion: boolean;
  discussion_notes?: string;
  disclaimer_text?: string;
  created_at: string;
  updated_at: string;
  is_draft?: boolean;
}

export class ExistingAssetAllocationService {
  static async validateClient(clientCode: string): Promise<ClientValidateResponse> {
    const response = await httpClient.post<ClientValidateResponse>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.VALIDATE_CLIENT,
      { client_code: clientCode }
    );
    return response.data;
  }

  static async save(data: ExistingAssetAllocationCreate): Promise<any> {
    const response = await httpClient.post<any>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.SAVE,
      data
    );
    return response.data;
  }

  static async update(id: string, data: Partial<ExistingAssetAllocationCreate>): Promise<any> {
    const response = await httpClient.patch<any>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.DETAIL(id),
      data
    );
    return response.data;
  }

  static async getAll(clientId?: string): Promise<ExistingAssetAllocation[]> {
    const response = await httpClient.get<ExistingAssetAllocation[]>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.LIST, 
      { params: clientId ? { client_id: clientId } : undefined }
    );
    return response.data;
  }

  static async getById(id: string): Promise<ExistingAssetAllocation> {
    const response = await httpClient.get<ExistingAssetAllocation>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.DETAIL(id)
    );
    return response.data;
  }

  static async downloadBlankPDF(filename = "Existing_Asset_Allocation_Blank_Form.pdf"): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.BLANK_PDF, {
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

  static async downloadPDF(id: string, filename = "Existing_Asset_Allocation_Report.pdf"): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.PDF(id), {
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

  static async downloadComparisonPDF(existingId: string, targetId: string, filename = "Allocation_Comparison_Report.pdf"): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.COMPARE_PDF(existingId, targetId),
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

  static async getComparisons(clientId?: string): Promise<any[]> {
    const response = await httpClient.get<any[]>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.COMPARISONS,
      { params: clientId ? { client_id: clientId } : undefined }
    );
    return response.data;
  }

  static async saveComparison(payload: {
    client_id: string;
    existing_allocation_id: string;
    target_allocation_id: string;
  }): Promise<any> {
    const response = await httpClient.post<any>(
      API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.COMPARE_SAVE,
      payload
    );
    return response.data;
  }
}
