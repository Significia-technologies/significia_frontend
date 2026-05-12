import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

export type PriceUploadType = "share-prices" | "nav-uploads" | "etf-prices";

export interface SharePriceRecord {
  id: string;
  isin_code: string;
  symbol: string;
  price_date: string;
  share_price: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface NavUploadRecord {
  id: string;
  scheme_code: string;
  scheme_name: string;
  price_date: string;
  nav: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ETFPriceRecord {
  id: string;
  isin_code: string;
  symbol: string;
  price_date: string;
  etf_price: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export type AnyPriceRecord = SharePriceRecord | NavUploadRecord | ETFPriceRecord;

export interface PriceExcelPreviewRow {
  data: Record<string, string>;
  status: "new" | "existing";
  date_error?: boolean;
}

export type ProductType = "shares" | "mutual-funds" | "etfs" | "life-insurance" | "health-insurance";

export interface ProductShare {
  id: string;
  isin_code: string;
  symbol: string;
  share_name: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductMutualFund {
  id: string;
  scheme_code: string;
  fund_house_name: string;
  scheme_name: string;
  asset_category: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductETF {
  id: string;
  isin_code: string;
  symbol: string;
  etf_name: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductLifeInsurance {
  id: string;
  company_name: string;
  policy_name: string;
  policy_type: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductHealthInsurance {
  id: string;
  company_name: string;
  policy_name: string;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type AnyProduct = ProductShare | ProductMutualFund | ProductETF | ProductLifeInsurance | ProductHealthInsurance;

export interface ResearchReport {
  id: string;
  product_id: string;
  product_type: string;
  file_path: string;
  original_filename: string;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
  download_url: string;
}

export interface ExcelPreviewRow {
  data: Record<string, string>;
  status: "new" | "existing";
}

export const ASSET_CATEGORIES = ["Equity", "Debt", "Hybrid"] as const;

export const LIFE_INSURANCE_POLICY_TYPES = [
  "Term Insurance",
  "Savings Insurance",
  "Annuity",
  "ULIP-Equity",
  "ULIP-Debt",
  "ULIP-Hybrid",
] as const;

export const ProductMasterService = {
  async list(type: ProductType, search?: string): Promise<{ items: AnyProduct[]; total: number }> {
    const params: Record<string, string | number> = { limit: 200, skip: 0 };
    if (search) params.search = search;
    const res = await httpClient.get(API_ENDPOINTS.PRODUCT_MASTER.LIST(type), { params });
    return res.data;
  },

  async create(type: ProductType, data: Record<string, string>): Promise<AnyProduct> {
    const res = await httpClient.post(API_ENDPOINTS.PRODUCT_MASTER.CREATE(type), data);
    return res.data;
  },

  async update(type: ProductType, id: string, data: Record<string, string>): Promise<AnyProduct> {
    const res = await httpClient.patch(API_ENDPOINTS.PRODUCT_MASTER.UPDATE(type, id), data);
    return res.data;
  },

  async toggle(type: ProductType, id: string): Promise<AnyProduct> {
    const res = await httpClient.patch(API_ENDPOINTS.PRODUCT_MASTER.TOGGLE(type, id));
    return res.data;
  },

  async listReports(type: ProductType, productId: string): Promise<{ reports: ResearchReport[] }> {
    const res = await httpClient.get(API_ENDPOINTS.PRODUCT_MASTER.REPORTS_LIST(type, productId));
    return res.data;
  },

  async uploadReports(type: ProductType, productId: string, files: File[], uploaderName?: string): Promise<{ uploaded: number }> {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    if (uploaderName) fd.append("uploader_name", uploaderName);
    const res = await httpClient.post(API_ENDPOINTS.PRODUCT_MASTER.REPORTS_UPLOAD(type, productId), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getReportDownloadUrl(reportId: string): Promise<{ download_url: string; filename: string }> {
    const res = await httpClient.get(API_ENDPOINTS.PRODUCT_MASTER.REPORT_DOWNLOAD(reportId));
    return res.data;
  },

  async excelPreview(type: ProductType, file: File): Promise<{ rows: ExcelPreviewRow[]; total: number }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await httpClient.post(API_ENDPOINTS.PRODUCT_MASTER.EXCEL_PREVIEW(type), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async excelImport(type: ProductType, rows: ExcelPreviewRow[]): Promise<{ created: number; skipped: number }> {
    const res = await httpClient.post(API_ENDPOINTS.PRODUCT_MASTER.EXCEL_IMPORT(type), { rows });
    return res.data;
  },

  async downloadExcelTemplate(type: ProductType): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.PRODUCT_MASTER.EXCEL_TEMPLATE(type), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export const PriceUploadService = {
  async list(type: PriceUploadType, search?: string): Promise<{ items: AnyPriceRecord[]; total: number }> {
    const params: Record<string, string | number> = { limit: 200, skip: 0 };
    if (search) params.search = search;
    const res = await httpClient.get(API_ENDPOINTS.PRICE_UPLOAD.LIST(type), { params });
    return res.data;
  },

  async create(type: PriceUploadType, data: Record<string, string>): Promise<AnyPriceRecord> {
    const res = await httpClient.post(API_ENDPOINTS.PRICE_UPLOAD.CREATE(type), data);
    return res.data;
  },

  async toggle(type: PriceUploadType, id: string): Promise<AnyPriceRecord> {
    const res = await httpClient.patch(API_ENDPOINTS.PRICE_UPLOAD.TOGGLE(type, id));
    return res.data;
  },

  async excelPreview(type: PriceUploadType, file: File): Promise<{ rows: PriceExcelPreviewRow[]; total: number }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await httpClient.post(API_ENDPOINTS.PRICE_UPLOAD.EXCEL_PREVIEW(type), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async excelImport(type: PriceUploadType, rows: PriceExcelPreviewRow[]): Promise<{ created: number; skipped: number }> {
    const res = await httpClient.post(API_ENDPOINTS.PRICE_UPLOAD.EXCEL_IMPORT(type), { rows });
    return res.data;
  },

  async downloadExcelTemplate(type: PriceUploadType): Promise<void> {
    const response = await httpClient.get(API_ENDPOINTS.PRICE_UPLOAD.EXCEL_TEMPLATE(type), {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
