// ── Analytics Types ─────────────────────────────────

export interface KPIMetric {
  label: string;
  value: string | number;
  change: number; // percentage change from previous period
  trend: "up" | "down" | "neutral";
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CashflowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

export interface DashboardOverview {
  kpis: KPIMetric[];
  revenueChart: RevenueDataPoint[];
  cashflowChart: CashflowDataPoint[];
}
