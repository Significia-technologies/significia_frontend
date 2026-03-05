import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import type { DashboardOverview, RevenueDataPoint, CashflowDataPoint } from "../types";

/**
 * Analytics Service
 * Handles all data-fetching logic for the dashboard analytics feature.
 * Components should NEVER call httpClient directly — they call this service.
 */
export const AnalyticsService = {
  /**
   * Fetch the full dashboard overview (KPIs + chart data).
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const { data } = await httpClient.get(API_ENDPOINTS.ANALYTICS.OVERVIEW);
    return data?.data as DashboardOverview;
  },

  /**
   * Fetch revenue chart data for a specific date range.
   */
  async getRevenueData(params?: {
    startDate?: string;
    endDate?: string;
    interval?: "daily" | "weekly" | "monthly";
  }): Promise<RevenueDataPoint[]> {
    const { data } = await httpClient.get(API_ENDPOINTS.ANALYTICS.REVENUE, {
      params,
    });
    return data?.data as RevenueDataPoint[];
  },

  /**
   * Fetch cashflow data for a specific date range.
   */
  async getCashflowData(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CashflowDataPoint[]> {
    const { data } = await httpClient.get(API_ENDPOINTS.ANALYTICS.CASHFLOW, {
      params,
    });
    return data?.data as CashflowDataPoint[];
  },
};
