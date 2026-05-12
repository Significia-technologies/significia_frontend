import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export type AssetClass = "shares" | "mf" | "etf" | "life_insurance" | "health_insurance";

export interface TargetPortfolioEntry {
  id: string;
  client_id: string;
  member_id: string;
  asset_class: AssetClass;
  product_id: string;
  product_name: string;
  percentage: number;
  objective: string | null;
  reason_for_investment: string | null;
  remarks: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AvailableProduct {
  id: string;
  product_name: string;
  // Shares / ETF
  symbol?: string;
  isin_code?: string;
  // MF
  fund_house_name?: string;
  scheme_code?: string;
  // Insurance
  company_name?: string;
  uin?: string;
}

export interface TargetPortfolioCreate {
  asset_class: AssetClass;
  product_id: string;
  percentage: number;
  objective?: string;
  reason_for_investment?: string;
  remarks?: string;
}

export class TargetPortfolioService {
  static async listEntries(
    clientId: string,
    memberId: string,
    assetClass: AssetClass
  ): Promise<{ entries: TargetPortfolioEntry[]; total: number; total_percentage: number }> {
    const res = await httpClient.get(
      API_ENDPOINTS.TARGET_PORTFOLIO.LIST(clientId, memberId),
      { params: { asset_class: assetClass } }
    );
    return res.data;
  }

  static async listProducts(
    clientId: string,
    memberId: string,
    assetClass: AssetClass
  ): Promise<{ products: AvailableProduct[] }> {
    const res = await httpClient.get(
      API_ENDPOINTS.TARGET_PORTFOLIO.PRODUCTS(clientId, memberId),
      { params: { asset_class: assetClass } }
    );
    return res.data;
  }

  static async createEntry(
    clientId: string,
    memberId: string,
    data: TargetPortfolioCreate
  ): Promise<TargetPortfolioEntry> {
    const res = await httpClient.post(
      API_ENDPOINTS.TARGET_PORTFOLIO.CREATE(clientId, memberId),
      data
    );
    return res.data;
  }

  static async toggleEntry(
    clientId: string,
    memberId: string,
    entryId: string
  ): Promise<TargetPortfolioEntry> {
    const res = await httpClient.patch(
      API_ENDPOINTS.TARGET_PORTFOLIO.TOGGLE(clientId, memberId, entryId)
    );
    return res.data;
  }
}
