"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, DollarSign, CreditCard, Activity, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KPIMetric } from "../types";

// ── Icon Map ────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  "Total Revenue": DollarSign,
  "Total Expenses": CreditCard,
  "Net Profit": Activity,
  "Total Savings": PiggyBank,
};

interface MetricCardProps {
  metric: KPIMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = ICON_MAP[metric.label] || Activity;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric.value}</div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {metric.trend === "up" && (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          )}
          {metric.trend === "down" && (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          {metric.trend === "neutral" && (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              "font-medium",
              metric.trend === "up" && "text-emerald-500",
              metric.trend === "down" && "text-red-500",
              metric.trend === "neutral" && "text-muted-foreground"
            )}
          >
            {metric.change > 0 ? "+" : ""}
            {metric.change}%
          </span>
          <span className="text-muted-foreground">from last period</span>
        </div>
      </CardContent>

      {/* Decorative gradient accent */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-1 w-full",
          metric.trend === "up" && "bg-gradient-to-r from-emerald-500/50 to-emerald-500",
          metric.trend === "down" && "bg-gradient-to-r from-red-500/50 to-red-500",
          metric.trend === "neutral" && "bg-gradient-to-r from-muted to-muted-foreground/30"
        )}
      />
    </Card>
  );
}
