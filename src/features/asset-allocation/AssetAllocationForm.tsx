"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AssetAllocationService,
  ClientValidateResponse,
} from "@/core/services/asset-allocation.service";
import { AssetAllocationSlider, AllocationValues } from "./AssetAllocationSlider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ASSET_ALLOCATION_DISCLAIMER } from "../financial-analysis/constants";

interface AssetAllocationFormProps {
  
  clientInfo: ClientValidateResponse & { client_code: string };
  onSaved: () => void;
  onCancel: () => void;
}

const DEFAULT_VALUES: AllocationValues = {
  equities: 0,
  debt: 0,
  commodities: 0,
  stocks: 0,
  mf_equity: 0,
  ulip_equity: 0,
  fd_bonds: 0,
  mf_debt: 0,
  ulip_debt: 0,
  gold_etf: 0,
  silver_etf: 0,
};

export function AssetAllocationForm({
  clientInfo,
  onSaved,
  onCancel,
}: AssetAllocationFormProps) {
  const [values, setValues] = useState<AllocationValues>(DEFAULT_VALUES);
  const [generateConclusion, setGenerateConclusion] = useState(true);
  const [conclusion, setConclusion] = useState("");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [tierRecommendation, setTierRecommendation] = useState(`${clientInfo.category_name || "Moderate"} — Balanced approach to growth and stability`);
  const [disclaimerText, setDisclaimerText] = useState("");
  const [showOptionals, setShowOptionals] = useState(false);
  const [saving, setSaving] = useState(false);

  const mainTotal = values.equities + values.debt + values.commodities;
  const isMainValid = Math.abs(mainTotal - 100) < 0.01;

  // Validate each sub-asset group if parent > 0
  const subValidEquity =
    values.equities === 0 ||
    Math.abs(values.stocks + values.mf_equity + values.ulip_equity - 100) < 0.01;
  const subValidDebt =
    values.debt === 0 ||
    Math.abs(values.fd_bonds + values.mf_debt + values.ulip_debt - 100) < 0.01;
  const subValidCommodities =
    values.commodities === 0 ||
    Math.abs(values.gold_etf + values.silver_etf - 100) < 0.01;

  const isFormValid = isMainValid && subValidEquity && subValidDebt && subValidCommodities;

  const getValidationSummary = () => {
    const errors = [];
    if (!isMainValid) errors.push(`Main classes total ${mainTotal.toFixed(1)}% (need 100%) or not yet balanced.`);
    return errors;
  };

  const generateConclusionText = (vals: AllocationValues) => {
    const riskTier = clientInfo.category_name || "Moderate";
    const clientName = clientInfo.client_name;
    
    return `STRATEGIC IMPORTANCE OF ASSET ALLOCATION AND REBALANCING

Client: ${clientName} | Risk Tier: ${riskTier} | Edited Allocation: Equities ${vals.equities.toFixed(1)}% | Debt ${vals.debt.toFixed(1)}% | Commodities ${vals.commodities.toFixed(1)}%

THE IMPORTANCE OF ASSET ALLOCATION AND REBALANCING:

Asset allocation is a fundamental determinant of investment outcomes. The allocation represents a balance between growth (equities), stability (debt), and inflation protection (commodities). Periodic rebalancing helps maintain intended risk profiles despite market fluctuations, supporting disciplined investment practices.

HOW THIS ALLOCATION FUNCTIONS:

The ${vals.equities.toFixed(1)}% equity allocation provides calibrated exposure to long-term capital appreciation while respecting ${riskTier} risk boundaries. The ${vals.debt.toFixed(1)}% debt allocation provides stability during market downturns and can help meet short-to-medium-term obligations. The ${vals.commodities.toFixed(1)}% commodities allocation adds diversification that typically behaves differently from traditional financial assets, offering potential inflation protection.

CONSIDERATIONS FOR THIS ALLOCATION:

This allocation is designed to work across economic cycles. The debt component serves dual functions of income generation and capital preservation. The commodities allocation may help preserve purchasing power during periods of currency weakness or inflation.

This asset allocation represents an evolution of investment strategy. Regular reviews are essential as personal circumstances, financial objectives, and market conditions evolve. Maintaining an emergency fund outside this investment portfolio is recommended.`;
  };

  useEffect(() => {
    if (generateConclusion) {
      setConclusion(generateConclusionText(values));
    }
  }, [generateConclusion, values.equities, values.debt, values.commodities]);

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error("Please fix all validation errors before saving.");
      return;
    }

    setSaving(true);
    try {
      await AssetAllocationService.save({
        client_code: clientInfo.client_code,
        ia_registration_number: clientInfo.registration_number || "",
        assigned_risk_tier: clientInfo.category_name || "",
        tier_recommendation: tierRecommendation,
        equities_percentage: values.equities,
        debt_securities_percentage: values.debt,
        commodities_percentage: values.commodities,
        stocks_percentage: values.stocks,
        mutual_fund_equity_percentage: values.mf_equity,
        ulip_equity_percentage: values.ulip_equity,
        fixed_deposits_bonds_percentage: values.fd_bonds,
        mutual_fund_debt_percentage: values.mf_debt,
        ulip_debt_percentage: values.ulip_debt,
        gold_etf_percentage: values.gold_etf,
        silver_etf_percentage: values.silver_etf,
        generate_system_conclusion: generateConclusion,
        system_conclusion: conclusion || undefined,
        discussion_notes: discussionNotes || undefined,
        disclaimer_text: disclaimerText || undefined,
      });

      toast.success("Asset allocation saved successfully!");
      onSaved();
    } catch {
      toast.error("Failed to save allocation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const validationErrors = getValidationSummary();

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

      {/* Allocation Sliders */}
      <AssetAllocationSlider values={values} onChange={setValues} />

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-xs font-black uppercase tracking-widest">Validation Required</p>
          </div>
          {validationErrors.map((e, i) => (
            <p key={i} className="text-xs text-orange-600/80 ml-6">{e}</p>
          ))}
        </div>
      )}

      {/* Optional Sections */}
      <button
        type="button"
        id="toggle-optionals-btn"
        onClick={() => setShowOptionals(!showOptionals)}
        className="w-full flex items-center justify-between rounded-xl border border-primary/10 p-4 hover:bg-primary/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-primary/60" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Documentation</p>
            <p className="text-[10px] text-muted-foreground opacity-60">Conclusion, notes & disclaimer</p>
          </div>
        </div>
        {showOptionals ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
      </button>

        {showOptionals && (
        <div className="space-y-5 rounded-xl border border-primary/10 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Advisor Recommendation */}
          <div className="space-y-2">
            <Label htmlFor="tier-recommendation" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
              Advisor Recommendation / Risk Alignment
            </Label>
            <Textarea
              id="tier-recommendation"
              value={tierRecommendation}
              onChange={(e) => setTierRecommendation(e.target.value)}
              placeholder="Provide specific risk alignment guidance for this allocation..."
              className="min-h-[80px] bg-card/50 border-primary/15 text-sm resize-none focus:border-primary/40 leading-relaxed"
            />
          </div>

          {/* Conclusion Textarea */}
          <div className="space-y-2">
            <Label htmlFor="system-conclusion" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
              Sample Conclusion (Edited)
            </Label>
            <Textarea
              id="system-conclusion"
              value={conclusion}
              onChange={(e) => {
                setConclusion(e.target.value);
                if (generateConclusion) setGenerateConclusion(false); // Stop auto-gen if user manually edits
              }}
              placeholder="System generated conclusion details..."
              className="min-h-[180px] bg-card/50 border-primary/15 text-sm resize-none focus:border-primary/40 leading-relaxed"
            />
          </div>

          {/* Discussion Notes */}
          <div className="space-y-2">
            <Label htmlFor="discussion-notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
              Discussion Notes (Optional)
            </Label>
            <Textarea
              id="discussion-notes"
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              placeholder="Add any contextual notes from the advisor–client discussion..."
              className="min-h-[100px] bg-card/50 border-primary/15 text-sm resize-none focus:border-primary/40"
            />
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                Standard Regulatory Disclaimer (Mandatory)
              </Label>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[10px] leading-relaxed text-muted-foreground italic">
                {ASSET_ALLOCATION_DISCLAIMER}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disclaimer-text" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                Additional Guidance / Custom Disclaimer (Optional)
              </Label>
              <Textarea
                id="disclaimer-text"
                value={disclaimerText}
                onChange={(e) => setDisclaimerText(e.target.value)}
                placeholder="Add any additional advisor-specific guidance or custom disclaimer points..."
                className="min-h-[100px] bg-card/50 border-primary/15 text-xs resize-none focus:border-primary/40 leading-relaxed"
              />
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
          {saving ? "Saving..." : "Save Allocation"}
        </Button>
      </div>
    </div>
  );
}
