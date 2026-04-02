import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface AssetAllocationCreate {
  client_code: string;
  ia_registration_number: string;
  assigned_risk_tier: string;
  tier_recommendation: string;
  equities_percentage: number;
  debt_securities_percentage: number;
  commodities_percentage: number;
  stocks_percentage: number;
  mutual_fund_equity_percentage: number;
  ulip_equity_percentage: number;
  fixed_deposits_bonds_percentage: number;
  mutual_fund_debt_percentage: number;
  ulip_debt_percentage: number;
  gold_etf_percentage: number;
  silver_etf_percentage: number;
  generate_system_conclusion: boolean;
  system_conclusion?: string;
  discussion_notes?: string;
  disclaimer_text?: string;
}

export interface AssetAllocation {
  id: string;
  client_id: string;
  client_name?: string;
  client_code?: string;
  ia_registration_number: string;
  assigned_risk_tier: string;
  tier_recommendation: string;
  equities_percentage: number;
  debt_securities_percentage: number;
  commodities_percentage: number;
  stocks_percentage: number;
  mutual_fund_equity_percentage: number;
  ulip_equity_percentage: number;
  fixed_deposits_bonds_percentage: number;
  mutual_fund_debt_percentage: number;
  ulip_debt_percentage: number;
  gold_etf_percentage: number;
  silver_etf_percentage: number;
  system_conclusion?: string;
  generate_system_conclusion: boolean;
  discussion_notes?: string;
  disclaimer_text?: string;
  total_allocation: number;
  created_at: string;
  updated_at: string;
}

export interface ClientValidateResponse {
  success: boolean;
  client_name?: string;
  registration_number?: string;
  category_name?: string;
  error?: string;
}

export interface AssetAllocationSaveResponse {
  success: boolean;
  allocation_id: string;
  message: string;
}

// ── Asset Allocation Service (Bridge Architecture) ────────────────────────
// No  required — backend resolves tenant from JWT + X-Tenant-Slug

export class AssetAllocationService {
  static async validateClient(clientCode: string): Promise<ClientValidateResponse> {
    const response = await httpClient.post<ClientValidateResponse>(
      API_ENDPOINTS.ASSET_ALLOCATION.VALIDATE_CLIENT,
      { client_code: clientCode }
    );
    return response.data;
  }

  static async save(data: AssetAllocationCreate): Promise<AssetAllocationSaveResponse> {
    const response = await httpClient.post<AssetAllocationSaveResponse>(
      API_ENDPOINTS.ASSET_ALLOCATION.SAVE,
      data
    );
    return response.data;
  }

  static async getAll(): Promise<AssetAllocation[]> {
    const response = await httpClient.get<AssetAllocation[]>(API_ENDPOINTS.ASSET_ALLOCATION.LIST);
    return response.data;
  }

  static async getById(id: string): Promise<AssetAllocation> {
    const response = await httpClient.get<AssetAllocation>(
      API_ENDPOINTS.ASSET_ALLOCATION.DETAIL(id)
    );
    return response.data;
  }

  static async downloadPDF(allocationId: string, filename = "Asset_Allocation.pdf"): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.ASSET_ALLOCATION.PDF(allocationId), {
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

  static async downloadDOCX(allocationId: string, filename = "Asset_Allocation.docx"): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.ASSET_ALLOCATION.DOCX(allocationId), {
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

  static async downloadBlankPDF(filename = "Asset_Allocation_Blank_Form.pdf"): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.ASSET_ALLOCATION.BLANK_PDF, {
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
}
