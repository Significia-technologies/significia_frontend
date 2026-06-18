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
  suggested_investment_amount: number | null;
  product_subtype: string | null;
  nature: string | null;
  objective: string | null;
  reason_for_investment: string | null;
  remarks: string | null;
  transaction_type?: string | null;
  frequency?: string | null;
  no_of_installments?: number | null;
  current_accumulation?: number | null;
  action?: "Buy" | "Sell" | null;
  stp_to_product_id?: string | null;
  stp_to_product_name?: string | null;
  stp_from_type?: string | null;
  stp_to_fund_type?: string | null;
  stp_total_amount?: number | null;
  stp_already_transferred?: number | null;
  stp_top_up?: number | null;
  sum_assured?: number | null;
  current_sum_assured?: number | null;
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
  suggested_investment_amount?: number;
  product_subtype?: string;
  nature?: string;
  objective?: string;
  reason_for_investment?: string;
  remarks?: string;
  transaction_type?: string;
  frequency?: string;
  no_of_installments?: number;
  current_accumulation?: number;
  action?: "Buy" | "Sell";
  stp_to_product_id?: string;
  stp_from_type?: string;
  stp_to_fund_type?: string;
  stp_total_amount?: number;
  stp_already_transferred?: number;
  stp_top_up?: number;
  sum_assured?: number;
  current_sum_assured?: number;
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

  static async downloadReport(
    clientId: string,
    memberId: string,
    clientName: string,
    clientCode: string,
    options: {
      exportBasis: "objective" | "product" | "investor";
      objective?: string;
      assetClasses?: string[];
    }
  ): Promise<void> {
    const params: any = {
      client_name: clientName,
      client_code: clientCode,
      export_basis: options.exportBasis,
    };
    if (options.exportBasis === "objective") {
      params.objective = options.objective;
    } else if (options.exportBasis === "product") {
      params.asset_classes = options.assetClasses?.join(",");
    }

    const endpoint = options.exportBasis === "investor"
      ? API_ENDPOINTS.TARGET_PORTFOLIO.REPORT_PDF_CLIENT(clientId)
      : API_ENDPOINTS.TARGET_PORTFOLIO.REPORT_PDF(clientId, memberId);

    const res = await httpClient.get(
      endpoint,
      {
        params,
        responseType: "blob",
      }
    );
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    
    let suffix = "Report";
    if (options.exportBasis === "objective") {
      suffix = options.objective || "Objective";
    } else if (options.exportBasis === "product") {
      suffix = "Products";
    } else if (options.exportBasis === "investor") {
      suffix = "InvestorWise";
    }

    link.setAttribute("download", `TargetPortfolio_${clientCode}_${suffix}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
  }

  static async downloadAllocationTargetPDF(
    clientId: string,
    memberId: string,
    totalPortfolioSize: number,
    clientName: string,
    clientCode: string,
    memberName: string,
    memberCode: string,
  ): Promise<void> {
    const res = await httpClient.get(
      `${API_ENDPOINTS.TARGET_PORTFOLIO.LIST(clientId, memberId)}/allocation-target/pdf`,
      {
        params: {
          total_portfolio_size: totalPortfolioSize,
          client_name: clientName,
          client_code: clientCode,
          member_name: memberName,
          member_code: memberCode,
        },
        responseType: "blob",
      }
    );
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TargetPortfolio_Allocation_Breakdown_${clientCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
  }
}

