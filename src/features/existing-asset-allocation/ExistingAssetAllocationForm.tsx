"use client";

import React, { useState } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Landmark,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ASSET_ALLOCATION_DISCLAIMER } from "../financial-analysis/constants";
import { ExistingAssetAllocationService } from "@/core/services/existing-asset-allocation.service";
import { ClientValidateResponse } from "@/core/services/asset-allocation.service";

interface ExistingAssetAllocationFormProps {
  clientInfo: ClientValidateResponse & { client_code: string };
  onSaved: () => void;
  onCancel: () => void;
}

interface AmountValues {
  stocks: number;
  mf_equity: number;
  ulip_equity: number;
  etf_equity: number;
  fd_bonds: number;
  mf_debt: number;
  ulip_debt: number;
  etf_debt: number;
  gold_etf: number;
  silver_etf: number;
  etf_commodity: number;
}

const DEFAULT_AMOUNTS: AmountValues = {
  stocks: 0,
  mf_equity: 0,
  ulip_equity: 0,
  etf_equity: 0,
  fd_bonds: 0,
  mf_debt: 0,
  ulip_debt: 0,
  etf_debt: 0,
  gold_etf: 0,
  silver_etf: 0,
  etf_commodity: 0,
};

export function ExistingAssetAllocationForm({
  clientInfo,
  onSaved,
  onCancel,
}: ExistingAssetAllocationFormProps) {
  const [amounts, setAmounts] = useState<AmountValues>(DEFAULT_AMOUNTS);
  const [showOptionals, setShowOptionals] = useState(false);
  const [saving, setSaving] = useState(false);

  // Math calculations
  const equitiesTotal = amounts.stocks + amounts.mf_equity + amounts.ulip_equity + amounts.etf_equity;
  const debtTotal = amounts.fd_bonds + amounts.mf_debt + amounts.ulip_debt + amounts.etf_debt;
  const commoditiesTotal = amounts.gold_etf + amounts.silver_etf + amounts.etf_commodity;
  const grandTotal = equitiesTotal + debtTotal + commoditiesTotal;

  const getPercentage = (amount: number) => {
    if (grandTotal === 0) return 0;
    return (amount / grandTotal) * 100;
  };

  const getSubAssetPercentageOfCategory = (amount: number, categoryTotal: number) => {
    if (categoryTotal === 0) return 0;
    return (amount / categoryTotal) * 100;
  };

  const isFormValid = grandTotal > 0;

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error("Please enter valuation amounts for at least one sub-asset.");
      return;
    }

    setSaving(true);
    try {
      await ExistingAssetAllocationService.save({
        client_code: clientInfo.client_code,
        ia_registration_number: clientInfo.registration_number || "",
        assigned_risk_tier: clientInfo.category_name || "",
        stocks_amount: amounts.stocks,
        mutual_fund_equity_amount: amounts.mf_equity,
        ulip_equity_amount: amounts.ulip_equity,
        etf_equity_amount: amounts.etf_equity,
        fixed_deposits_bonds_amount: amounts.fd_bonds,
        mutual_fund_debt_amount: amounts.mf_debt,
        ulip_debt_amount: amounts.ulip_debt,
        etf_debt_amount: amounts.etf_debt,
        gold_etf_amount: amounts.gold_etf,
        silver_etf_amount: amounts.silver_etf,
        etf_commodity_amount: amounts.etf_commodity,
        generate_system_conclusion: false,
      });

      toast.success("Existing holdings and allocation recorded successfully!");
      onSaved();
    } catch {
      toast.error("Failed to save allocation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAmountChange = (key: keyof AmountValues, valStr: string) => {
    const parsed = parseFloat(valStr);
    const val = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setAmounts(prev => ({ ...prev, [key]: val }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-400">
      {/* Client Banner */}
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Client</p>
          <p className="font-black text-sm">{clientInfo.client_name}</p>
          <p className="font-mono text-[10px] opacity-50 uppercase">{clientInfo.client_code}</p>
        </div>
        <div className="h-10 w-px bg-primary/10" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Risk Tier</p>
          <div className="flex items-baseline gap-2">
            <p className="font-black text-sm">{clientInfo.category_name || "Not Assessed"}</p>
            {clientInfo.form_name && (
              <span className="text-[9px] text-muted-foreground opacity-50 font-medium whitespace-nowrap">
                via {clientInfo.form_name}
              </span>
            )}
          </div>
        </div>
        <div className="h-10 w-px bg-primary/10" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">IA Reg No.</p>
          <p className="font-mono text-xs">{clientInfo.registration_number}</p>
        </div>
      </div>



      {/* Asset valuation input form details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equities column */}
        <div className="p-5 border border-red-500/10 bg-card/20 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-500 border-b border-red-500/10 pb-2">
              <TrendingUp className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Equities Valuation</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Share", key: "stocks" as keyof AmountValues },
                { label: "Mutual Fund", key: "mf_equity" as keyof AmountValues },
                { label: "ULIP", key: "ulip_equity" as keyof AmountValues },
                { label: "ETF", key: "etf_equity" as keyof AmountValues },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <label htmlFor={`input-${f.key}`}>{f.label}</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        id={`input-${f.key}`}
                        type="number"
                        placeholder="₹ 0"
                        className="bg-card/40 border-red-500/10 focus:border-red-500/30 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={amounts[f.key] === 0 ? "" : amounts[f.key]}
                        onChange={e => handleAmountChange(f.key, e.target.value)}
                      />
                    </div>
                    <div className="text-right min-w-[85px] shrink-0">
                      <span className="text-base font-black text-red-500 block leading-none">
                        {getPercentage(amounts[f.key]).toFixed(1)}%
                      </span>
                      <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                        {getSubAssetPercentageOfCategory(amounts[f.key], equitiesTotal).toFixed(1)}% of Eq
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-red-500/15 pt-4 mt-6 space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Equities
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  disabled
                  readOnly
                  className="bg-red-500/5 border-red-500/20 text-sm font-black text-red-500 disabled:opacity-100 cursor-not-allowed"
                  value={formatCurrency(equitiesTotal)}
                />
              </div>
              <div className="text-right min-w-[85px] shrink-0">
                <span className="text-base font-black text-red-500 block leading-none">
                  {getPercentage(equitiesTotal).toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                  of portfolio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Debt column */}
        <div className="p-5 border border-blue-500/10 bg-card/20 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-500 border-b border-blue-500/10 pb-2">
              <Landmark className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Debt Valuation</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Fixed Deposits & Bonds", key: "fd_bonds" as keyof AmountValues },
                { label: "Mutual Funds (Debt)", key: "mf_debt" as keyof AmountValues },
                { label: "ETF (Debt)", key: "etf_debt" as keyof AmountValues },
                { label: "ULIP (Debt)", key: "ulip_debt" as keyof AmountValues },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <label htmlFor={`input-${f.key}`}>{f.label}</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        id={`input-${f.key}`}
                        type="number"
                        placeholder="₹ 0"
                        className="bg-card/40 border-blue-500/10 focus:border-blue-500/30 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={amounts[f.key] === 0 ? "" : amounts[f.key]}
                        onChange={e => handleAmountChange(f.key, e.target.value)}
                      />
                    </div>
                    <div className="text-right min-w-[85px] shrink-0">
                      <span className="text-base font-black text-blue-500 block leading-none">
                        {getPercentage(amounts[f.key]).toFixed(1)}%
                      </span>
                      <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                        {getSubAssetPercentageOfCategory(amounts[f.key], debtTotal).toFixed(1)}% of Dt
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-blue-500/15 pt-4 mt-6 space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Debt
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  disabled
                  readOnly
                  className="bg-blue-500/5 border-blue-500/20 text-sm font-black text-blue-500 disabled:opacity-100 cursor-not-allowed"
                  value={formatCurrency(debtTotal)}
                />
              </div>
              <div className="text-right min-w-[85px] shrink-0">
                <span className="text-base font-black text-blue-500 block leading-none">
                  {getPercentage(debtTotal).toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                  of portfolio
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Commodities column */}
        <div className="p-5 border border-amber-500/10 bg-card/20 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-500 border-b border-amber-500/10 pb-2">
              <Gem className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Commodities Valuation</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Gold ETF", key: "gold_etf" as keyof AmountValues },
                { label: "Silver ETF", key: "silver_etf" as keyof AmountValues },
                { label: "ETF (Commodity)", key: "etf_commodity" as keyof AmountValues },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <label htmlFor={`input-${f.key}`}>{f.label}</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        id={`input-${f.key}`}
                        type="number"
                        placeholder="₹ 0"
                        className="bg-card/40 border-amber-500/10 focus:border-amber-500/30 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={amounts[f.key] === 0 ? "" : amounts[f.key]}
                        onChange={e => handleAmountChange(f.key, e.target.value)}
                      />
                    </div>
                    <div className="text-right min-w-[85px] shrink-0">
                      <span className="text-base font-black text-amber-500 block leading-none">
                        {getPercentage(amounts[f.key]).toFixed(1)}%
                      </span>
                      <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                        {getSubAssetPercentageOfCategory(amounts[f.key], commoditiesTotal).toFixed(1)}% of Cm
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-amber-500/15 pt-4 mt-6 space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total Commodities
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  disabled
                  readOnly
                  className="bg-amber-500/5 border-amber-500/20 text-sm font-black text-amber-500 disabled:opacity-100 cursor-not-allowed"
                  value={formatCurrency(commoditiesTotal)}
                />
              </div>
              <div className="text-right min-w-[85px] shrink-0">
                <span className="text-base font-black text-amber-500 block leading-none">
                  {getPercentage(commoditiesTotal).toFixed(1)}%
                </span>
                <span className="text-[8px] text-muted-foreground/60 uppercase block font-bold mt-1">
                  of portfolio
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grand Total Summary Banner */}
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-5 flex justify-between items-center animate-in fade-in duration-300">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Grand Total Portfolio Valuation</p>
          <p className="text-2xl font-black text-primary mt-1">{formatCurrency(grandTotal)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status</p>
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">✓ Valuation Balance Synchronized</p>
        </div>
      </div>

      {/* Disclaimer toggler */}
      <button
        type="button"
        id="toggle-optionals-btn"
        onClick={() => setShowOptionals(!showOptionals)}
        className="w-full flex items-center justify-between rounded-xl border border-primary/10 p-4 hover:bg-primary/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-primary/60" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Disclaimer</p>
          </div>
        </div>
        {showOptionals ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
      </button>

      {showOptionals && (
        <div className="space-y-4 rounded-xl border border-primary/10 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] leading-relaxed text-muted-foreground italic">
              {ASSET_ALLOCATION_DISCLAIMER}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-primary/5">
        <Button
          id="cancel-allocation-btn"
          variant="ghost"
          onClick={onCancel}
          className="h-11 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          id="save-allocation-btn"
          onClick={handleSave}
          disabled={!isFormValid || saving}
          className={cn(
            "h-11 px-8 gap-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
            isFormValid ? "shadow-primary/20" : "opacity-50"
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFormValid ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Holdings"}
        </Button>
      </div>
    </div>
  );
}
