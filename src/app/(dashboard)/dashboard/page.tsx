"use client";

import React from "react";
import { MetricCard } from "@/features/analytics/components/MetricCard";
import { OverviewChart } from "@/features/analytics/components/OverviewChart";
import { CashflowChart } from "@/features/analytics/components/CashflowChart";
import type { KPIMetric, RevenueDataPoint, CashflowDataPoint } from "@/features/analytics/types";

const MOCK_KPIS: KPIMetric[] = [
  { label: "Total Revenue", value: "$124,500", change: 12.5, trend: "up" },
  { label: "Total Expenses", value: "$87,200", change: -3.2, trend: "down" },
  { label: "Net Profit", value: "$37,300", change: 8.1, trend: "up" },
  { label: "Total Savings", value: "$15,800", change: 0, trend: "neutral" },
];

const MOCK_REVENUE: RevenueDataPoint[] = [
  { date: "Jan", revenue: 18500, expenses: 14200, profit: 4300 },
  { date: "Feb", revenue: 22300, expenses: 15800, profit: 6500 },
  { date: "Mar", revenue: 19800, expenses: 13500, profit: 6300 },
  { date: "Apr", revenue: 25100, expenses: 16700, profit: 8400 },
  { date: "May", revenue: 21400, expenses: 14900, profit: 6500 },
  { date: "Jun", revenue: 28700, expenses: 18200, profit: 10500 },
  { date: "Jul", revenue: 24600, expenses: 15600, profit: 9000 },
  { date: "Aug", revenue: 30200, expenses: 19100, profit: 11100 },
  { date: "Sep", revenue: 27800, expenses: 17400, profit: 10400 },
  { date: "Oct", revenue: 32500, expenses: 20300, profit: 12200 },
  { date: "Nov", revenue: 29100, expenses: 18700, profit: 10400 },
  { date: "Dec", revenue: 35400, expenses: 22100, profit: 13300 },
];

const MOCK_CASHFLOW: CashflowDataPoint[] = [
  { date: "Jan", inflow: 20000, outflow: 15000, balance: 5000 },
  { date: "Feb", inflow: 24000, outflow: 17000, balance: 12000 },
  { date: "Mar", inflow: 21000, outflow: 14500, balance: 18500 },
  { date: "Apr", inflow: 27000, outflow: 18000, balance: 27500 },
  { date: "May", inflow: 23000, outflow: 16000, balance: 34500 },
  { date: "Jun", inflow: 30000, outflow: 19500, balance: 45000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your financial summary.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_KPIS.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OverviewChart data={MOCK_REVENUE} />
        <CashflowChart data={MOCK_CASHFLOW} />
      </div>
    </div>
  );
}
