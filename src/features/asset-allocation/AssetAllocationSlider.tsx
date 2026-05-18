"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Landmark,
  Gem,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────
export interface AllocationValues {
  equities: number;
  debt: number;
  commodities: number;
  // Equities sub
  stocks: number;
  mf_equity: number;
  ulip_equity: number;
  etf_equity: number;
  // Debt sub
  fd_bonds: number;
  mf_debt: number;
  ulip_debt: number;
  etf_debt: number;
  // Commodities sub
  gold_etf: number;
  silver_etf: number;
  etf_commodity: number;
}

interface AllocationInputProps {
  label: string;
  id: string;
  value: number;
  onChange: (val: number) => void;
  max?: number;
  colorClass?: string;
  isError?: boolean;
}

function AllocationInput({ label, id, value, onChange, max = 100, colorClass = "accent", isError }: AllocationInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (isNaN(v)) { onChange(0); return; }
    onChange(Math.min(max, Math.max(0, v)));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className={cn(
            "text-[10px] font-black uppercase tracking-widest transition-colors",
            isError ? "text-red-500 opacity-100" : "text-muted-foreground opacity-70"
          )}
        >
          {label}
        </label>
        <span className={cn("text-xs font-black tabular-nums", value > 0 ? `text-${colorClass}-foreground` : "text-muted-foreground opacity-40")}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, value)}%`, backgroundColor: `var(--${colorClass})` }}
          />
        </div>
        <input
          id={id}
          type="number"
          min={0}
          max={max}
          step={0.5}
          value={value === 0 ? "" : value}
          onChange={handleChange}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder="0"
          className="w-20 h-8 rounded-lg border border-primary/15 bg-card/50 px-2.5 text-right text-sm font-black tabular-nums focus:outline-none focus:border-primary/40 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}

// ── Sub-Asset Section ─────────────────────────────────
interface SubAssetSectionProps {
  title: string;
  icon: React.ReactNode;
  parentPct: number;
  color: string;
  colorDark: string;
  fields: { label: string; id: string; key: keyof AllocationValues }[];
  values: AllocationValues;
  onChange: (key: keyof AllocationValues, val: number) => void;
}

function SubAssetSection({ title, icon, parentPct, color, fields, values, onChange }: SubAssetSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const subTotal = fields.reduce((acc, f) => acc + (values[f.key] || 0), 0);
  const isValid = parentPct === 0 || Math.abs(subTotal - 100) < 0.01;
  const isLocked = parentPct === 0;

  useEffect(() => {
    if (parentPct > 0) setExpanded(true);
    else setExpanded(false);
  }, [parentPct]);

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-300",
      isLocked ? "opacity-40 border-muted/20" : isValid ? "border-emerald-500/20 bg-emerald-500/3" : "border-orange-500/20 bg-orange-500/3"
    )}>
      <button
        type="button"
        onClick={() => !isLocked && setExpanded(!expanded)}
        disabled={isLocked}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 rounded-xl transition-colors disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: `${color}20` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest">{title}</p>
            <p className="text-[10px] text-muted-foreground opacity-60">
              {isLocked ? "Enable by setting parent allocation > 0" : `Sub-total: ${subTotal.toFixed(1)}% of 100%`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLocked && (
            isValid
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              : <AlertCircle className="w-4 h-4 text-orange-500" />
          )}
          {!isLocked && (expanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />)}
        </div>
      </button>

      {expanded && !isLocked && (
        <div className="px-4 pb-4 space-y-4 border-t border-primary/5 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[10px] font-medium text-muted-foreground">
            Sub-assets must total <span className="font-black text-foreground">100%</span> within this category
            (representing <span className="font-black text-foreground">{parentPct.toFixed(1)}%</span> of the portfolio).
          </p>
          {fields.map((f) => (
            <AllocationInput
              key={f.key}
              label={f.label}
              id={f.id}
              value={values[f.key] || 0}
              onChange={(v) => onChange(f.key, v)}
            />
          ))}
          <div className={cn(
            "flex flex-col gap-2 rounded-lg p-3 text-xs font-black transition-all",
            Math.abs(subTotal - 100) < 0.01 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
          )}>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-widest">Sub-Total</span>
              <span>{subTotal.toFixed(1)}% / 100%</span>
            </div>
            {Math.abs(subTotal - 100) >= 0.01 && (
              <p className="text-[10px] font-bold mt-1 border-t border-red-500/20 pt-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />
                {title} allocation must total 100%, Current Total: {subTotal.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Allocation Slider Component ──────────────────
interface AssetAllocationSliderProps {
  values: AllocationValues;
  onChange: (values: AllocationValues) => void;
}

export function AssetAllocationSlider({ values, onChange }: AssetAllocationSliderProps) {
  const mainTotal = values.equities + values.debt + values.commodities;
  const isMainValid = Math.abs(mainTotal - 100) < 0.01;

  const handleMainChange = (key: "equities" | "debt" | "commodities", val: number) => {
    onChange({ ...values, [key]: val });
  };

  const handleSubChange = (key: keyof AllocationValues, val: number) => {
    onChange({ ...values, [key]: val });
  };

  // Sub-asset validation status for "double validation" labeling
  const isEquitySubValid = values.equities === 0 || Math.abs(values.stocks + values.mf_equity + values.ulip_equity + values.etf_equity - 100) < 0.01;
  const isDebtSubValid = values.debt === 0 || Math.abs(values.fd_bonds + values.mf_debt + values.ulip_debt + values.etf_debt - 100) < 0.01;
  const isCommoditySubValid = values.commodities === 0 || Math.abs(values.gold_etf + values.silver_etf + values.etf_commodity - 100) < 0.01;

  return (
    <div className="space-y-6">
      {/* Main Allocation */}
      <div className="rounded-xl border border-primary/10 bg-card/30 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Main Asset Classes</p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              isMainValid ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-orange-500/30 text-orange-500 bg-orange-500/5"
            )}
          >
            {mainTotal.toFixed(1)}% / 100%
          </Badge>
        </div>

        <AllocationInput
          label="Equities"
          id="equities-pct"
          value={values.equities}
          onChange={(v) => handleMainChange("equities", v)}
          colorClass="primary"
          isError={!isEquitySubValid}
        />
        <AllocationInput
          label="Debt Securities"
          id="debt-pct"
          value={values.debt}
          onChange={(v) => handleMainChange("debt", v)}
          colorClass="primary"
          isError={!isDebtSubValid}
        />
        <AllocationInput
          label="Commodities"
          id="commodities-pct"
          value={values.commodities}
          onChange={(v) => handleMainChange("commodities", v)}
          colorClass="primary"
          isError={!isCommoditySubValid}
        />

        {isMainValid && (
          <div className="flex items-center gap-2 text-xs text-emerald-500 animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">Main allocation balanced at 100%</span>
          </div>
        )}
      </div>

      {/* Sub-Asset Sections */}
      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          Sub-Asset Allocation (unlock by setting main class above)
        </p>

        <SubAssetSection
          title="Equities Sub-Assets"
          icon={<TrendingUp className="w-4 h-4" />}
          parentPct={values.equities}
          color="#ef4444"
          colorDark="#ef4444"
          fields={[
            { label: "Stocks", id: "stocks-pct", key: "stocks" },
            { label: "Mutual Funds (Equity)", id: "mf-equity-pct", key: "mf_equity" },
            { label: "ETF (Equity)", id: "etf-equity-pct", key: "etf_equity" },
            { label: "ULIP (Equity)", id: "ulip-equity-pct", key: "ulip_equity" },
          ]}
          values={values}
          onChange={handleSubChange}
        />

        <SubAssetSection
          title="Debt Sub-Assets"
          icon={<Landmark className="w-4 h-4" />}
          parentPct={values.debt}
          color="#3b82f6"
          colorDark="#3b82f6"
          fields={[
            { label: "Fixed Deposits & Bonds", id: "fd-bonds-pct", key: "fd_bonds" },
            { label: "Mutual Funds (Debt)", id: "mf-debt-pct", key: "mf_debt" },
            { label: "ETF (Debt)", id: "etf-debt-pct", key: "etf_debt" },
            { label: "ULIP (Debt)", id: "ulip-debt-pct", key: "ulip_debt" },
          ]}
          values={values}
          onChange={handleSubChange}
        />

        <SubAssetSection
          title="Commodities Sub-Assets"
          icon={<Gem className="w-4 h-4" />}
          parentPct={values.commodities}
          color="#f59e0b"
          colorDark="#f59e0b"
          fields={[
            { label: "Gold ETF", id: "gold-etf-pct", key: "gold_etf" },
            { label: "Silver ETF", id: "silver-etf-pct", key: "silver_etf" },
            { label: "ETF", id: "etf-commodity-pct", key: "etf_commodity" },
          ]}
          values={values}
          onChange={handleSubChange}
        />
      </div>
    </div>
  );
}
