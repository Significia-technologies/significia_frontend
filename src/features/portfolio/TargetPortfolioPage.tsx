"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Loader2, MoreHorizontal, ToggleLeft, ToggleRight,
  AlertTriangle, TrendingUp, Check, ChevronsUpDown, Download,
  ChevronDown, ChevronUp, ChevronRight, Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  TargetPortfolioService,
  TargetPortfolioEntry,
  TargetPortfolioCreate,
  AssetClass,
  AvailableProduct,
} from "@/core/services/target-portfolio.service";
import { InvestorMember } from "@/core/services/investor-master.service";
import { AssetAllocationService, AssetAllocation } from "@/core/services/asset-allocation.service";

// ── Constants ──────────────────────────────────────────────────────

interface SubAssetConfig {
  key: string;
  label: string;
  parent: "Equities" | "Debt" | "Commodities";
}

const SUB_ASSETS: SubAssetConfig[] = [
  // Equities
  { key: "stocks_percentage", label: "Stocks / Shares", parent: "Equities" },
  { key: "mutual_fund_equity_percentage", label: "Mutual Fund (Equity)", parent: "Equities" },
  { key: "ulip_equity_percentage", label: "ULIP (Equity)", parent: "Equities" },
  { key: "etf_equity_percentage", label: "ETF (Equity)", parent: "Equities" },
  
  // Debt
  { key: "fixed_deposits_bonds_percentage", label: "Fixed Deposits & Bonds", parent: "Debt" },
  { key: "mutual_fund_debt_percentage", label: "Mutual Fund (Debt)", parent: "Debt" },
  { key: "ulip_debt_percentage", label: "ULIP (Debt)", parent: "Debt" },
  { key: "etf_debt_percentage", label: "ETF (Debt)", parent: "Debt" },
  
  // Commodities
  { key: "gold_etf_percentage", label: "Gold ETF", parent: "Commodities" },
  { key: "silver_etf_percentage", label: "Silver ETF", parent: "Commodities" },
  { key: "etf_commodity_percentage", label: "ETF (Commodity)", parent: "Commodities" },
];


const TABS: { key: AssetClass; label: string }[] = [
  { key: "shares", label: "Shares" },
  { key: "mf", label: "Mutual Funds" },
  { key: "etf", label: "ETF" },
  { key: "life_insurance", label: "Life Insurance" },
  { key: "health_insurance", label: "Health Insurance" },
];

const OBJECTIVES = ["Retirement", "Child Marriage", "Child Education", "General"];
const LIFE_OBJECTIVES = ["Retirement", "Child Education", "Child Marriage", "General", "HLV"];
const LIFE_REASONS = ["HLV", "HLV + Savings", "Retirement", "HLV + Investment"];

// ── Suitability Cell with Tooltip ──────────────────────────────────

const SUITABILITY_TRUNCATE = 30;

function SuitabilityCell({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  if (value.length <= SUITABILITY_TRUNCATE) return <span>{value}</span>;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default underline decoration-dotted underline-offset-2">
            {value.slice(0, SUITABILITY_TRUNCATE).trimEnd()}…
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-normal">{value}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatIndianNumber(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  const isNeg = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2
  });
  const res = "Rs. " + formatted;
  return isNeg ? `(${res})` : res;
}

function formatTxType(type: string | null | undefined): string {
  if (!type) return "—";
  if (type === "SIP" || type === "STP") return type;
  if (type === "LUMP_SUM") return "Lumpsum";
  return type.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatFrequency(freq: string | null | undefined): string {
  if (!freq) return "—";
  if (freq === "SIP" || freq === "STP") return freq;
  if (freq === "LUMP_SUM") return "Lumpsum";
  return freq.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ── Searchable Product Combobox ─────────────────────────────────────

function ProductCombobox({
  products,
  value,
  onChange,
  loading,
  placeholder = "Search product…",
  renderLabel,
}: {
  products: AvailableProduct[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  placeholder?: string;
  renderLabel: (p: AvailableProduct) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = products.find((p) => p.id === value);

  const filtered = query.trim()
    ? products.filter((p) =>
        renderLabel(p).toLowerCase().includes(query.toLowerCase()) ||
        (p.symbol ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (p.isin_code ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (p.scheme_code ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (p.company_name ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : products;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger — becomes search input when open */}
      <div
        className={cn(
          "w-full flex items-start gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-10 text-sm",
          "ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "cursor-text"
        )}
        onClick={handleOpen}
      >
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selected ? renderLabel(selected) : placeholder}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 leading-5"
          />
        ) : (
          <span className={cn("flex-1 break-words leading-5", !selected && "text-muted-foreground")}>
            {loading ? "Loading…" : selected ? renderLabel(selected) : placeholder}
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 mt-0.5" />
      </div>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1">
            {loading ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">Loading products…</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">No products found.</li>
            ) : (
              filtered.map((p) => (
                <li
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                  onClick={() => handleSelect(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    value === p.id && "bg-accent/60"
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0", value === p.id ? "opacity-100 text-primary" : "opacity-0")} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{renderLabel(p)}</span>
                    {(p.symbol || p.isin_code || p.scheme_code || p.company_name) && (
                      <span className="block truncate text-xs text-muted-foreground font-mono">
                        {p.symbol || p.scheme_code || p.company_name}
                        {p.isin_code ? ` · ${p.isin_code}` : ""}
                      </span>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Add Entry Dialog ────────────────────────────────────────────────

function AddEntryDialog({
  open, onClose, onAdded,
  clientId, member, assetClass, currentTotalPct, totalPortfolioSize, latestAllocation, existingEntries,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  clientId: string;
  member: InvestorMember;
  assetClass: AssetClass;
  currentTotalPct: number;
  totalPortfolioSize: number;
  latestAllocation: any | null;
  existingEntries: TargetPortfolioEntry[];
}) {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [suggestedAmount, setSuggestedAmount] = useState("");
  const [productSubtype, setProductSubtype] = useState("");
  const [nature, setNature] = useState("");
  const [objective, setObjective] = useState("");
  const [lifeObjective, setLifeObjective] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [frequency, setFrequency] = useState("");
  const [noOfInstallments, setNoOfInstallments] = useState("");
  const [currentAccumulation, setCurrentAccumulation] = useState("");
  const [action, setAction] = useState<"Buy" | "Sell">("Buy");

  const handleTransactionTypeChange = (val: string) => {
    setTransactionType(val);
    if (val === "LUMP_SUM") {
      if (assetClass === "health_insurance") {
        setFrequency("ANNUAL");
      } else {
        setFrequency("LUMP_SUM");
      }
    } else if (val === "SINGLE_PAY") {
      setFrequency("SINGLE_PAY");
    } else if (val === "SIP" || val === "STP") {
      setFrequency("MONTHLY");
    } else if (val === "RECURRING") {
      setFrequency("ANNUAL");
    } else {
      setFrequency("");
    }
    // Reset installments when switching away from SIP
    if (val !== "SIP") {
      setNoOfInstallments("");
    }
    // Reset current accumulation and action when switching away from SIP and LUMP_SUM
    if (val !== "SIP" && val !== "LUMP_SUM") {
      setCurrentAccumulation("");
      setAction("Buy");
    }
  };

  const getSelectedSubAssetDetails = () => {
    if (!latestAllocation || !totalPortfolioSize || totalPortfolioSize <= 0) return null;
    
    let key: string | null = null;
    if (assetClass === "shares") {
      key = "stocks_percentage";
    } else if (assetClass === "mf") {
      if (productSubtype === "Equity") key = "mutual_fund_equity_percentage";
      if (productSubtype === "Debt" || productSubtype === "Hybrid") key = "mutual_fund_debt_percentage";
    } else if (assetClass === "etf") {
      if (productSubtype === "Gold") key = "gold_etf_percentage";
      if (productSubtype === "Silver") key = "silver_etf_percentage";
      if (productSubtype === "Other ETF") key = "etf_commodity_percentage";
    } else if (assetClass === "life_insurance" && productSubtype === "ULIP") {
      if (nature === "Equity") key = "ulip_equity_percentage";
      if (nature === "Debt" || nature === "Hybrid") key = "ulip_debt_percentage";
    }

    if (!key) return null;

    const subAssetConfig = SUB_ASSETS.find((s) => s.key === key);
    if (!subAssetConfig) return null;

    const pct = parseFloat(latestAllocation[key]) || 0;
    const parentKey = subAssetConfig.parent === "Equities"
      ? "equities_percentage"
      : subAssetConfig.parent === "Debt"
      ? "debt_securities_percentage"
      : "commodities_percentage";
    const parentPct = parseFloat(latestAllocation[parentKey]) || 0;
    const parentAmt = (parentPct / 100) * totalPortfolioSize;
    const targetAmt = (pct / 100) * parentAmt;

    return {
      label: subAssetConfig.label,
      pct,
      targetAmt,
    };
  };

  const selectedSubAsset = getSelectedSubAssetDetails();
  const enteredAmount = parseFloat(suggestedAmount) || 0;
  const enteredCurrentAccumulation = parseFloat(currentAccumulation) || 0;
  const totalEnteredAmount = action === "Sell"
    ? (enteredCurrentAccumulation - enteredAmount)
    : (enteredAmount + enteredCurrentAccumulation);
  const isOverTarget = selectedSubAsset && totalEnteredAmount > selectedSubAsset.targetAmt;

  const handleAmountChange = (val: string) => {
    setSuggestedAmount(val);
    const amt = parseFloat(val) || 0;
    const curAcc = parseFloat(currentAccumulation) || 0;
    const totalAmt = action === "Sell" ? (curAcc - amt) : (amt + curAcc);
    if (selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      if (val || currentAccumulation) {
        const computedPct = (totalAmt / selectedSubAsset.targetAmt) * 100;
        setPercentage((Math.round(computedPct * 100) / 100).toString());
      } else {
        setPercentage("");
      }
    }
  };

  const handleCurrentAccumulationChange = (val: string) => {
    setCurrentAccumulation(val);
    const curAcc = parseFloat(val) || 0;
    const amt = parseFloat(suggestedAmount) || 0;
    const totalAmt = action === "Sell" ? (curAcc - amt) : (amt + curAcc);
    if (selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      if (val || suggestedAmount) {
        const computedPct = (totalAmt / selectedSubAsset.targetAmt) * 100;
        setPercentage((Math.round(computedPct * 100) / 100).toString());
      } else {
        setPercentage("");
      }
    }
  };

  const handlePercentageChange = (val: string) => {
    setPercentage(val);
    const pctVal = parseFloat(val);
    if (!isNaN(pctVal) && pctVal >= 0 && selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      const computedTotalAmt = (pctVal / 100) * selectedSubAsset.targetAmt;
      const curAcc = parseFloat(currentAccumulation) || 0;
      if (action === "Sell") {
        const computedSuggestedAmt = Math.max(0, curAcc - computedTotalAmt);
        setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
      } else {
        const computedSuggestedAmt = Math.max(0, computedTotalAmt - curAcc);
        setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
      }
    } else if (!val) {
      setSuggestedAmount("");
    }
  };

  const handleActionChange = (newAction: "Buy" | "Sell") => {
    setAction(newAction);
    const curAcc = parseFloat(currentAccumulation) || 0;
    if (percentage && selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      const pctVal = parseFloat(percentage);
      if (!isNaN(pctVal)) {
        const computedTotalAmt = (pctVal / 100) * selectedSubAsset.targetAmt;
        if (newAction === "Sell") {
          const computedSuggestedAmt = Math.max(0, curAcc - computedTotalAmt);
          setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
        } else {
          const computedSuggestedAmt = Math.max(0, computedTotalAmt - curAcc);
          setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
        }
      }
    }
  };

  // Recalculate amount if sub-asset category changes and percentage is already filled
  useEffect(() => {
    if (percentage && selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      const pctVal = parseFloat(percentage);
      if (!isNaN(pctVal)) {
        const computedTotalAmt = (pctVal / 100) * selectedSubAsset.targetAmt;
        const curAcc = parseFloat(currentAccumulation) || 0;
        if (action === "Sell") {
          const computedSuggestedAmt = Math.max(0, curAcc - computedTotalAmt);
          setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
        } else {
          const computedSuggestedAmt = Math.max(0, computedTotalAmt - curAcc);
          setSuggestedAmount((Math.round(computedSuggestedAmt * 100) / 100).toString());
        }
      }
    }
  }, [productSubtype, nature, latestAllocation, totalPortfolioSize, action]);



  useEffect(() => {
    if (productSubtype !== "ULIP") {
      setNature("");
    }
  }, [productSubtype]);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    setProductId("");
    setPercentage("");
    setSuggestedAmount("");
    setProductSubtype("");
    setNature("");
    setObjective("");
    setLifeObjective("");
    setReason("");
    setRemarks("");

    setNoOfInstallments("");
    setCurrentAccumulation("");
    setAction("Buy");

    if (assetClass === "health_insurance") {
      setTransactionType("LUMP_SUM");
      setFrequency("ANNUAL");
    } else if (assetClass === "shares" || assetClass === "mf" || assetClass === "etf") {
      setTransactionType("LUMP_SUM");
      setFrequency("LUMP_SUM");
    } else if (assetClass === "life_insurance") {
      setTransactionType("SINGLE_PAY");
      setFrequency("SINGLE_PAY");
    } else {
      setTransactionType("");
      setFrequency("");
    }

    TargetPortfolioService.listProducts(clientId, member.id, assetClass)
      .then((res) => setProducts(res.products))
      .catch(() => toast.error("Failed to load products."))
      .finally(() => setLoadingProducts(false));
  }, [open, clientId, member.id, assetClass]);

  const pct = parseFloat(percentage) || 0;

  // Sum of percentages of existing active entries matching the selected sub-asset
  const activeSubAssetPct = existingEntries
    .filter((e) => {
      if (!e.is_active) return false;
      if (assetClass === "shares") {
        return e.asset_class === "shares";
      } else if (assetClass === "mf") {
        const isDebtGroup = productSubtype === "Debt" || productSubtype === "Hybrid";
        if (isDebtGroup) {
          return e.asset_class === "mf" && (e.product_subtype === "Debt" || e.product_subtype === "Hybrid");
        }
        return e.asset_class === "mf" && e.product_subtype === productSubtype;
      } else if (assetClass === "etf") {
        return e.asset_class === "etf" && e.product_subtype === productSubtype;
      } else if (assetClass === "life_insurance") {
        if (productSubtype === "ULIP") {
          const isDebtGroup = nature === "Debt" || nature === "Hybrid";
          if (isDebtGroup) {
            return e.asset_class === "life_insurance" && e.product_subtype === "ULIP" && (e.nature === "Debt" || e.nature === "Hybrid");
          }
          return e.asset_class === "life_insurance" && e.product_subtype === "ULIP" && e.nature === nature;
        } else {
          return e.asset_class === "life_insurance" && e.product_subtype === productSubtype;
        }
      } else if (assetClass === "health_insurance") {
        return e.asset_class === "health_insurance";
      }
      return false;
    })
    .reduce((sum, e) => sum + e.percentage, 0);

  const getSubAssetName = () => {
    if (assetClass === "shares") return "Stocks / Shares";
    if (assetClass === "mf") {
      if (productSubtype === "Debt" || productSubtype === "Hybrid") return "Mutual Fund (Debt/Hybrid)";
      return `Mutual Fund (${productSubtype || "Select type"})`;
    }
    if (assetClass === "etf") return `ETF (${productSubtype || "Select type"})`;
    if (assetClass === "life_insurance") {
      if (productSubtype === "ULIP") {
        if (nature === "Debt" || nature === "Hybrid") return "ULIP (Debt/Hybrid)";
        return `ULIP (${nature || "Select nature"})`;
      }
      return `Life Insurance (${productSubtype || "Select type"})`;
    }
    if (assetClass === "health_insurance") return "Health Insurance";
    return "Sub-asset";
  };

  const wouldExceedSubAsset = activeSubAssetPct + pct > 100.001;

  const remainingPctVal = 100 - activeSubAssetPct;
  const remainingAmtVal = selectedSubAsset ? (selectedSubAsset.targetAmt - (activeSubAssetPct / 100) * selectedSubAsset.targetAmt) : 0;

  const currentRemainingPct = remainingPctVal - pct;
  const currentRemainingAmt = remainingAmtVal - totalEnteredAmount;

  const hasPctError = pct > 100 || currentRemainingPct < -0.001;
  const hasAmtError = selectedSubAsset ? (currentRemainingAmt < -0.001) : false;

  const productLabel = (p: AvailableProduct) => {
    if (assetClass === "shares" || assetClass === "etf")
      return `${p.product_name}${p.symbol ? ` (${p.symbol})` : ""}`;
    if (assetClass === "mf")
      return `${p.product_name}${p.fund_house_name ? ` — ${p.fund_house_name}` : ""}`;
    if (assetClass === "life_insurance" || assetClass === "health_insurance")
      return `${p.product_name}${p.company_name ? ` — ${p.company_name}` : ""}`;
    return p.product_name;
  };

  const handleSubmit = async () => {
    if (!productId) return toast.error("Select a product.");
    if (!percentage || isNaN(pct) || pct <= 0) return toast.error("Enter a valid percentage.");
    if (pct > 100) return toast.error("Percentage cannot exceed 100.");

    const amt = parseFloat(suggestedAmount);
    if (!suggestedAmount || isNaN(amt) || amt <= 0) {
      return toast.error("Enter a valid suggested investment amount.");
    }

    const curAcc = parseFloat(currentAccumulation) || 0;
    if (transactionType === "LUMP_SUM" && action === "Sell" && amt > curAcc) {
      return toast.error("Suggested amount to sell cannot exceed current accumulation.");
    }

    if (assetClass === "mf" && !productSubtype) {
      return toast.error("Select a Mutual Fund type.");
    }
    if (assetClass === "etf" && !productSubtype) {
      return toast.error("Select an ETF type.");
    }
    if (assetClass === "life_insurance") {
      if (!productSubtype) {
        return toast.error("Select a Life Insurance type.");
      }
      if (productSubtype === "ULIP" && !nature) {
        return toast.error("Select a ULIP nature.");
      }
    }

    if (assetClass !== "life_insurance" && assetClass !== "health_insurance" && !objective)
      return toast.error("Select an investment objective.");
    if (assetClass === "life_insurance" && !lifeObjective)
      return toast.error("Select an investment objective.");
    if (assetClass === "life_insurance" && !reason)
      return toast.error("Select reason for investment.");

    if (activeSubAssetPct + pct > 100.001) {
      return toast.error(
        `Total allocation for ${getSubAssetName()} cannot exceed 100% (currently at ${activeSubAssetPct.toFixed(1)}%).`
      );
    }

    const payload: TargetPortfolioCreate = {
      asset_class: assetClass,
      product_id: productId,
      percentage: pct,
      suggested_investment_amount: amt,
      product_subtype: productSubtype || undefined,
      nature: nature || undefined,
      objective: assetClass === "health_insurance"
        ? "Health Cover"
        : assetClass === "life_insurance"
        ? lifeObjective
        : objective || undefined,
      reason_for_investment: reason || undefined,
      remarks: remarks.trim() || undefined,
      transaction_type: transactionType || undefined,
      frequency: frequency || undefined,
      no_of_installments: transactionType === "SIP" && noOfInstallments ? parseInt(noOfInstallments) : undefined,
      current_accumulation: (transactionType === "SIP" || transactionType === "LUMP_SUM") && currentAccumulation ? parseFloat(currentAccumulation) : undefined,
      action: transactionType === "LUMP_SUM" ? action : (transactionType === "SIP" ? "Buy" : undefined),
    };

    setSubmitting(true);
    try {
      await TargetPortfolioService.createEntry(clientId, member.id, payload);
      toast.success("Product added to target portfolio.");
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const isInsurance = assetClass === "life_insurance" || assetClass === "health_insurance";
  const pctLabel = assetClass === "life_insurance"
    ? "% of HLV Covered"
    : assetClass === "health_insurance"
    ? "% of Health Insurance Covered"
    : "% of Investment";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">
            Add to {TABS.find((t) => t.key === assetClass)?.label}{" "}
            <span className="font-mono text-xs text-muted-foreground">— {member.investor_code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product */}
          <div className="space-y-1">
            <Label className="text-xs">Product <span className="text-destructive">*</span></Label>
            {!loadingProducts && products.length === 0 ? (
              <p className="text-xs text-muted-foreground border rounded-md px-3 py-2">
                No active products in this basket.
              </p>
            ) : (
              <ProductCombobox
                products={products}
                value={productId}
                onChange={setProductId}
                loading={loadingProducts}
                renderLabel={productLabel}
              />
            )}
          </div>

          {/* Mutual Fund Type */}
          {assetClass === "mf" && (
            <div className="space-y-1">
              <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
              <Select value={productSubtype} onValueChange={setProductSubtype}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Debt">Debt</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ETF Type */}
          {assetClass === "etf" && (
            <div className="space-y-1">
              <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
              <Select value={productSubtype} onValueChange={setProductSubtype}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Other ETF">Other ETF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Life Insurance Type & Nature */}
          {assetClass === "life_insurance" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                <Select value={productSubtype} onValueChange={setProductSubtype}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term">Term</SelectItem>
                    <SelectItem value="Endowment">Endowment</SelectItem>
                    <SelectItem value="ULIP">ULIP</SelectItem>
                    <SelectItem value="Annuity">Annuity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {productSubtype === "ULIP" && (
                <div className="space-y-1">
                  <Label className="text-xs">Nature <span className="text-destructive">*</span></Label>
                  <Select value={nature} onValueChange={setNature}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select nature" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Debt">Debt</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Transaction Type + Frequency in 2-col grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Transaction Type <span className="text-destructive">*</span></Label>
              <Select value={transactionType} onValueChange={handleTransactionTypeChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(assetClass === "shares" || assetClass === "mf" || assetClass === "etf") && (
                    <>
                      <SelectItem value="LUMP_SUM">Lumpsum</SelectItem>
                      <SelectItem value="SIP">SIP</SelectItem>
                      {assetClass === "mf" && <SelectItem value="STP">STP</SelectItem>}
                    </>
                  )}
                  {assetClass === "health_insurance" && (
                    <SelectItem value="LUMP_SUM">Lumpsum</SelectItem>
                  )}
                  {assetClass === "life_insurance" && (
                    <>
                      <SelectItem value="SINGLE_PAY">Single Pay</SelectItem>
                      <SelectItem value="RECURRING">Recurring</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Frequency <span className="text-destructive">*</span></Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  {transactionType === "LUMP_SUM" && assetClass !== "health_insurance" && (
                    <SelectItem value="LUMP_SUM">Lumpsum</SelectItem>
                  )}
                  {transactionType === "LUMP_SUM" && assetClass === "health_insurance" && (
                    <>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                      <SelectItem value="BI_YEARLY">Bi-yearly</SelectItem>
                    </>
                  )}
                  {transactionType === "SINGLE_PAY" && (
                    <SelectItem value="SINGLE_PAY">Single Pay</SelectItem>
                  )}
                  {(transactionType === "SIP" || transactionType === "STP") && (
                    <>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="HALF_YEARLY">Half-yearly</SelectItem>
                    </>
                  )}
                  {transactionType === "RECURRING" && (
                    <>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="HALF_YEARLY">Half-yearly</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SIP Fields: Current Accumulation & No. of Installments */}
          {transactionType === "SIP" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Current Accumulation</Label>
                <Input
                  type="number"
                  min="0"
                  value={currentAccumulation}
                  onChange={(e) => handleCurrentAccumulationChange(e.target.value)}
                  placeholder="e.g. 50000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No. of Installments</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={noOfInstallments}
                  onChange={(e) => setNoOfInstallments(e.target.value)}
                  placeholder="e.g. 12"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* LUMP_SUM Fields: Current Accumulation & Action (Buy/Sell) */}
          {transactionType === "LUMP_SUM" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Current Accumulation</Label>
                <Input
                  type="number"
                  min="0"
                  value={currentAccumulation}
                  onChange={(e) => handleCurrentAccumulationChange(e.target.value)}
                  placeholder="e.g. 50000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Action <span className="text-destructive">*</span></Label>
                <Select value={action} onValueChange={(val: "Buy" | "Sell") => handleActionChange(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Suggested Amount + % Investment in 2-col grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className={cn("text-xs", hasAmtError && "text-destructive")}>
                Suggested Amt <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={suggestedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="e.g. 50000"
                className={cn(
                  "h-8 text-xs",
                  hasAmtError && "border-destructive/60 focus-visible:ring-destructive/80 text-destructive bg-destructive/5"
                )}
              />
              {selectedSubAsset && (
                <span className={cn(
                  "text-[10px] font-medium flex items-center gap-1",
                  hasAmtError ? "text-destructive" : "text-muted-foreground"
                )}>
                  {hasAmtError && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                  {hasAmtError
                    ? `Exceeded by ${formatIndianNumber(Math.abs(currentRemainingAmt))}`
                    : `${formatIndianNumber(currentRemainingAmt)} remaining`}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <Label className={cn("text-xs", hasPctError && "text-destructive")}>
                {pctLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="e.g. 25"
                className={cn(
                  "h-8 text-xs",
                  hasPctError && "border-destructive/60 focus-visible:ring-destructive/80 text-destructive bg-destructive/5"
                )}
              />
              <span className={cn(
                "text-[10px] font-medium flex items-center gap-1",
                hasPctError ? "text-destructive" : "text-muted-foreground"
              )}>
                {hasPctError && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                {hasPctError
                  ? `Exceeded by ${Math.abs(currentRemainingPct).toFixed(1)}%`
                  : `${currentRemainingPct.toFixed(1)}% remaining`}
              </span>
            </div>
          </div>

          {/* Objective & Anticipated Future Value row (side-by-side for SIP, objective only otherwise) */}
          {!isInsurance && (
            transactionType === "SIP" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Anticipated Future Value</Label>
                  <Input
                    readOnly
                    value={
                      suggestedAmount && noOfInstallments
                        ? formatIndianNumber(
                            parseFloat(suggestedAmount) * parseInt(noOfInstallments)
                          )
                        : "—"
                    }
                    className="h-8 text-xs bg-muted text-muted-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    SIP Amt × Installments (not part of allocation)
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Investment Objective <span className="text-destructive">*</span></Label>
                  <Select value={objective} onValueChange={setObjective}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select objective" /></SelectTrigger>
                    <SelectContent>
                      {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Investment Objective <span className="text-destructive">*</span></Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select objective" /></SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )
          )}

          {/* Objective + Reason (Life Insurance) — side by side */}
          {assetClass === "life_insurance" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Objective <span className="text-destructive">*</span></Label>
                <Select value={lifeObjective} onValueChange={setLifeObjective}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select objective" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reason <span className="text-destructive">*</span></Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Objective (Health Insurance — read-only) */}
          {assetClass === "health_insurance" && (
            <div className="space-y-1">
              <Label className="text-xs">Objective</Label>
              <Input value="Health Cover" readOnly className="h-8 text-xs bg-muted text-muted-foreground" />
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center justify-between">
              Remarks on Suitability
              <span className={cn("font-normal", remarks.length > 150 ? "text-destructive" : "text-muted-foreground")}>
                {remarks.length}/150
              </span>
            </Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 150))}
              placeholder="Optional remarks"
              maxLength={150}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || loadingProducts}>
            {submitting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Asset Class Tab Content ─────────────────────────────────────────

function AssetClassTab({
  clientId, member, assetClass, totalPortfolioSize, latestAllocation,
}: {
  clientId: string;
  member: InvestorMember;
  assetClass: AssetClass;
  totalPortfolioSize: number;
  latestAllocation: any | null;
}) {
  const [entries, setEntries] = useState<TargetPortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPct, setTotalPct] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TargetPortfolioService.listEntries(clientId, member.id, assetClass);
      setEntries(res.entries);
      setTotalPct(res.total_percentage);
    } catch {
      toast.error("Failed to load portfolio entries.");
    } finally {
      setLoading(false);
    }
  }, [clientId, member.id, assetClass]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggle = async (entry: TargetPortfolioEntry) => {
    if (!entry.is_active) {
      let subAssetName = "";
      let matchingEntries = entries.filter((e) => e.is_active && e.id !== entry.id);

      if (assetClass === "shares") {
        subAssetName = "Stocks / Shares";
        matchingEntries = matchingEntries.filter((e) => e.asset_class === "shares");
      } else if (assetClass === "mf") {
        const isDebtGroup = entry.product_subtype === "Debt" || entry.product_subtype === "Hybrid";
        if (isDebtGroup) {
          subAssetName = "Mutual Fund (Debt/Hybrid)";
          matchingEntries = matchingEntries.filter(
            (e) => e.asset_class === "mf" && (e.product_subtype === "Debt" || e.product_subtype === "Hybrid")
          );
        } else {
          subAssetName = `Mutual Fund (${entry.product_subtype})`;
          matchingEntries = matchingEntries.filter(
            (e) => e.asset_class === "mf" && e.product_subtype === entry.product_subtype
          );
        }
      } else if (assetClass === "etf") {
        subAssetName = `ETF (${entry.product_subtype})`;
        matchingEntries = matchingEntries.filter(
          (e) => e.asset_class === "etf" && e.product_subtype === entry.product_subtype
        );
      } else if (assetClass === "life_insurance") {
        if (entry.product_subtype === "ULIP") {
          const isDebtGroup = entry.nature === "Debt" || entry.nature === "Hybrid";
          if (isDebtGroup) {
            subAssetName = "ULIP (Debt/Hybrid)";
            matchingEntries = matchingEntries.filter(
              (e) => e.asset_class === "life_insurance" && e.product_subtype === "ULIP" && (e.nature === "Debt" || e.nature === "Hybrid")
            );
          } else {
            subAssetName = `ULIP (${entry.nature})`;
            matchingEntries = matchingEntries.filter(
              (e) => e.asset_class === "life_insurance" && e.product_subtype === "ULIP" && e.nature === entry.nature
            );
          }
        } else {
          subAssetName = `Life Insurance (${entry.product_subtype})`;
          matchingEntries = matchingEntries.filter(
            (e) => e.asset_class === "life_insurance" && e.product_subtype === entry.product_subtype
          );
        }
      } else if (assetClass === "health_insurance") {
        subAssetName = "Health Insurance";
        matchingEntries = matchingEntries.filter((e) => e.asset_class === "health_insurance");
      }

      const existingPct = matchingEntries.reduce((sum, e) => sum + e.percentage, 0);
      if (existingPct + entry.percentage > 100.001) {
        toast.error(
          `Cannot activate ${entry.product_name} because total allocation for ${subAssetName} would exceed 100% (currently at ${existingPct.toFixed(1)}%).`
        );
        return;
      }
    }

    setTogglingId(entry.id);
    try {
      await TargetPortfolioService.toggleEntry(clientId, member.id, entry.id);
      toast.success(`${entry.product_name} deactivated.`);
      fetch();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const isInsurance = assetClass === "life_insurance" || assetClass === "health_insurance";
  const pctColLabel = assetClass === "life_insurance"
    ? "% HLV Covered"
    : assetClass === "health_insurance"
    ? "% Health Covered"
    : "% Investment";
  const objectiveColLabel = assetClass === "life_insurance" ? "Objective / Reason" : "Objective";

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Active allocation:
            <span className={cn(
              "ml-1.5 font-semibold",
              totalPct > 100 ? "text-destructive" : totalPct === 100 ? "text-green-600" : "text-foreground"
            )}>
              {totalPct.toFixed(1)}%
            </span>
            {" / 100%"}
          </span>
          {totalPct > 100 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Exceeds 100%
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-x-auto">
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Product</TableHead>
                <TableHead className="w-[80px]">{pctColLabel}</TableHead>
                <TableHead className="w-[110px]">Current Accum.</TableHead>
                <TableHead className="w-[110px]">Suggested Amt</TableHead>
                <TableHead className="w-[100px]">Tx / Freq</TableHead>
                <TableHead className="w-[80px]">Installments</TableHead>
                <TableHead className="w-[110px]">Anticipated Value</TableHead>
                <TableHead className="w-[100px]">{objectiveColLabel}</TableHead>
                <TableHead className="w-[110px]">Suitability</TableHead>
                <TableHead className="w-[68px]">Status</TableHead>
                <TableHead className="w-[48px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No products added yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id} className={!e.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-2 leading-snug">{e.product_name}</span>
                      {e.product_subtype && (
                        <span className="block mt-0.5 text-[10px] text-muted-foreground font-normal">
                          {e.product_subtype}{e.nature ? ` — ${e.nature}` : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-semibold",
                        totalPct > 100 && e.is_active && "text-amber-600"
                      )}>
                        {e.percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {(e.transaction_type === "SIP" || e.transaction_type === "LUMP_SUM") && e.current_accumulation !== null && e.current_accumulation !== undefined
                        ? formatIndianNumber(e.current_accumulation)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {e.action === "Sell" && e.suggested_investment_amount !== null && e.suggested_investment_amount !== undefined
                        ? `(${formatIndianNumber(e.suggested_investment_amount)})`
                        : formatIndianNumber(e.suggested_investment_amount)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {e.transaction_type === "LUMP_SUM" && e.action
                          ? `Lumpsum (${e.action})`
                          : formatTxType(e.transaction_type)}
                      </span>
                      {e.frequency && e.frequency !== e.transaction_type && (
                        <span className="block text-[10px] text-muted-foreground">{formatFrequency(e.frequency)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.transaction_type === "SIP" && e.no_of_installments
                        ? e.no_of_installments
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {e.transaction_type === "SIP" && e.no_of_installments && e.suggested_investment_amount
                        ? formatIndianNumber(e.suggested_investment_amount * e.no_of_installments)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {assetClass === "life_insurance" ? (
                        <div>
                          <span>{e.objective || "—"}</span>
                          {e.reason_for_investment && (
                            <span className="block text-[10px] text-muted-foreground">{e.reason_for_investment}</span>
                          )}
                        </div>
                      ) : (
                        e.objective || "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <SuitabilityCell value={e.remarks} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {e.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {e.is_active && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={togglingId === e.id}>
                              {togglingId === e.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <MoreHorizontal className="h-3.5 w-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggle(e)}>
                              <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No products added yet.</div>
        ) : (
          entries.map((e) => (
            <Card key={e.id} className={!e.is_active ? "opacity-60" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">{e.product_name}</p>
                    {e.product_subtype && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.product_subtype}{e.nature ? ` — ${e.nature}` : ""}
                      </p>
                    )}
                  </div>
                  <Badge variant={e.is_active ? "default" : "secondary"} className="shrink-0 text-xs">
                    {e.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{pctColLabel}</span>
                    <p className="font-semibold mt-0.5">{e.percentage.toFixed(1)}%</p>
                  </div>
                  {(e.transaction_type === "SIP" || e.transaction_type === "LUMP_SUM") && e.current_accumulation !== null && e.current_accumulation !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Current Accum.</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.current_accumulation)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Suggested Amount</span>
                    <p className="font-semibold mt-0.5">
                      {e.action === "Sell" && e.suggested_investment_amount !== null && e.suggested_investment_amount !== undefined
                        ? `(${formatIndianNumber(e.suggested_investment_amount)})`
                        : formatIndianNumber(e.suggested_investment_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transaction Type</span>
                    <p className="font-semibold mt-0.5">
                      {e.transaction_type === "LUMP_SUM" && e.action
                        ? `Lumpsum (${e.action})`
                        : formatTxType(e.transaction_type)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency</span>
                    <p className="font-semibold mt-0.5">{formatFrequency(e.frequency)}</p>
                  </div>
                  {e.transaction_type === "SIP" && e.no_of_installments && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Installments</span>
                        <p className="font-semibold mt-0.5">{e.no_of_installments}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Anticipated Value</span>
                        <p className="font-semibold mt-0.5">
                          {e.suggested_investment_amount
                            ? formatIndianNumber(e.suggested_investment_amount * e.no_of_installments)
                            : "—"}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{objectiveColLabel}</span>
                    {assetClass === "life_insurance" ? (
                      <div className="mt-0.5">
                        <p className="font-medium">{e.objective || "—"}</p>
                        {e.reason_for_investment && (
                          <p className="text-xs text-muted-foreground">{e.reason_for_investment}</p>
                        )}
                      </div>
                    ) : (
                      <p className="font-medium mt-0.5">{e.objective || "—"}</p>
                    )}
                  </div>
                  {e.remarks && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Suitability</span>
                      <p className="mt-0.5 text-xs">
                        <SuitabilityCell value={e.remarks} />
                      </p>
                    </div>
                  )}
                </div>
                {e.is_active && (
                  <div className="border-t border-border pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs" disabled={togglingId === e.id}>
                          {togglingId === e.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MoreHorizontal className="h-3.5 w-3.5" />}
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggle(e)}>
                          <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showAdd && (
        <AddEntryDialog
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={fetch}
          clientId={clientId}
          member={member}
          assetClass={assetClass}
          currentTotalPct={totalPct}
          totalPortfolioSize={totalPortfolioSize}
          latestAllocation={latestAllocation}
          existingEntries={entries}
        />
      )}
    </div>
  );
}

// ── Export Report Dialog ────────────────────────────────────────────

// ── Export Report Dialog ────────────────────────────────────────────

const ALL_OBJECTIVES = [
  "Retirement", "Child Education", "Child Marriage", "General", "HLV", "Health Cover",
];

const PRODUCT_CATEGORIES = [
  { key: "shares", label: "Shares / Stocks" },
  { key: "mf", label: "Mutual Funds" },
  { key: "etf", label: "ETFs" },
  { key: "life_insurance", label: "Life Insurance" },
  { key: "health_insurance", label: "Health Insurance" },
];

function ExportReportDialog({
  open, onClose,
  clientId, memberId, clientName, clientCode,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  memberId: string;
  clientName: string;
  clientCode: string;
}) {
  const [exportBasis, setExportBasis] = useState<"objective" | "product" | "investor">("objective");
  const [selectedObjective, setSelectedObjective] = useState("");
  const [selectedAssetClasses, setSelectedAssetClasses] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (exportBasis === "objective" && !selectedObjective) {
      return toast.error("Select an objective.");
    }
    if (exportBasis === "product" && selectedAssetClasses.length === 0) {
      return toast.error("Select at least one product category.");
    }

    setDownloading(true);
    try {
      await TargetPortfolioService.downloadReport(
        clientId,
        memberId,
        clientName,
        clientCode,
        {
          exportBasis,
          objective: exportBasis === "objective" ? selectedObjective : undefined,
          assetClasses: exportBasis === "product" ? selectedAssetClasses : undefined,
        }
      );
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const desc = exportBasis === "objective"
          ? `objective "${selectedObjective}"`
          : exportBasis === "product"
          ? "selected product types"
          : "active investor members";
        toast.error(`No active entries found for ${desc}.`);
      } else {
        toast.error("Failed to generate report.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const isSubmitDisabled = downloading || (
    exportBasis === "objective"
      ? !selectedObjective
      : exportBasis === "product"
      ? selectedAssetClasses.length === 0
      : false
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Portfolio Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Export Report By</Label>
            <Select value={exportBasis} onValueChange={(val: any) => setExportBasis(val)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="objective">Goal / Objective-wise</SelectItem>
                <SelectItem value="product">Product-wise</SelectItem>
                <SelectItem value="investor">Investor-wise (All Members)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportBasis === "objective" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Select an objective to generate a PDF report showing all matching active entries across all asset classes.
              </p>
              <div className="space-y-1.5">
                <Label>Objective <span className="text-destructive">*</span></Label>
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger><SelectValue placeholder="Select objective" /></SelectTrigger>
                  <SelectContent>
                    {ALL_OBJECTIVES.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : exportBasis === "product" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Select product categories to include in the generated report. Active target portfolio products matching these groups will be exported.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Product Types <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssetClasses(PRODUCT_CATEGORIES.map(p => p.key))}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground text-xs font-normal">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAssetClasses([])}
                      className="text-xs text-muted-foreground hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-md p-2 bg-background">
                  {PRODUCT_CATEGORIES.map((p) => {
                    const isChecked = selectedAssetClasses.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors",
                          isChecked
                            ? "bg-primary/5 border-primary text-foreground"
                            : "hover:bg-accent hover:text-accent-foreground border-transparent text-muted-foreground"
                        )}
                      >
                        <span>{p.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssetClasses([...selectedAssetClasses, p.key]);
                            } else {
                              setSelectedAssetClasses(selectedAssetClasses.filter((c) => c !== p.key));
                            }
                          }}
                          className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Generates a consolidated PDF report for all active investor members of this client, grouped by investor.
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={downloading}>Cancel</Button>
          <Button onClick={handleDownload} disabled={isSubmitDisabled}>
            {downloading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              : <><Download className="h-4 w-4 mr-2" /> Download PDF</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────

interface TargetPortfolioPageProps {
  clientId: string;
  clientCode: string;
  clientName: string;
  members: InvestorMember[];
}

export function TargetPortfolioPage({
  clientId, clientCode, clientName, members,
}: TargetPortfolioPageProps) {
  const activeMembers = members.filter((m) => m.is_active);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    activeMembers[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState<AssetClass>("shares");
  const [showExport, setShowExport] = useState(false);

  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId) ?? null;

  const [latestAllocation, setLatestAllocation] = useState<any | null>(null);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [totalPortfolioSize, setTotalPortfolioSize] = useState<string>("");
  const [isCalculatorCollapsed, setIsCalculatorCollapsed] = useState<boolean>(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({
    Equities: false,
    "Debt Securities": false,
    Commodities: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSize = localStorage.getItem(`target_portfolio_size_${clientId}_${selectedMemberId}`) || "";
      setTotalPortfolioSize(savedSize);
      const savedCollapsed = localStorage.getItem(`target_portfolio_calculator_collapsed_${clientId}_${selectedMemberId}`) === "true";
      setIsCalculatorCollapsed(savedCollapsed);
    }
  }, [clientId, selectedMemberId]);

  useEffect(() => {
    const fetchLatestAllocation = async () => {
      if (!clientId) return;
      setLoadingAllocation(true);
      try {
        const allocations = await AssetAllocationService.getAll(clientId);
        if (allocations && allocations.length > 0) {
          const latest = allocations.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setLatestAllocation(latest);
        } else {
          setLatestAllocation(null);
        }
      } catch (error) {
        console.error("Failed to fetch latest asset allocation", error);
        setLatestAllocation(null);
      } finally {
        setLoadingAllocation(false);
      }
    };

    fetchLatestAllocation();
  }, [clientId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Target Portfolio
          </h2>
          <p className="text-sm text-muted-foreground">{clientName} &mdash; {clientCode}</p>
        </div>
        {selectedMember && (
          <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        )}
      </div>

      {showExport && selectedMember && (
        <ExportReportDialog
          open={showExport}
          onClose={() => setShowExport(false)}
          clientId={clientId}
          memberId={selectedMember.id}
          clientName={clientName}
          clientCode={clientCode}
        />
      )}

      {/* Investor Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Investor Sub-code</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor" />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="font-mono font-semibold">{m.investor_code}</span>
                      <span className="ml-2 text-muted-foreground">— {m.relation}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMember && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Investor Name</p>
                <p className="font-semibold">{selectedMember.full_name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Allocation Calculator Card */}
      {selectedMember && (
        <Card className="shadow-md border-primary/30 bg-gradient-to-r from-primary/[0.01] to-primary/[0.03] dark:from-primary/[0.03] dark:to-primary/[0.06] transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
          <CardHeader 
            className="flex flex-row items-center justify-between space-y-0 pb-3 cursor-pointer select-none hover:bg-muted/5 transition-colors"
            onClick={() => {
              const newCollapsed = !isCalculatorCollapsed;
              setIsCalculatorCollapsed(newCollapsed);
              localStorage.setItem(
                `target_portfolio_calculator_collapsed_${clientId}_${selectedMemberId}`,
                String(newCollapsed)
              );
            }}
          >
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                <Calculator className="h-5 w-5 text-primary" />
                <span>Target Allocation Calculator</span>
                <Badge variant="secondary" className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/20 text-[10px] px-2 py-0.5 ml-1 font-semibold uppercase tracking-wider">
                  Calculator Tool
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Enter total portfolio size to instantly compute recommended target amounts for each asset class
              </p>
            </div>
            <div className="text-muted-foreground hover:text-foreground transition-colors p-1">
              {isCalculatorCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          
          <CardContent className={cn("space-y-4", isCalculatorCollapsed && "hidden")}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2 border-b border-border">
              <div className="space-y-1.5 flex-1 max-w-sm">
                <Label htmlFor="total_portfolio_size" className="text-xs font-semibold uppercase text-muted-foreground">
                  Total Portfolio Size (Rs.)
                </Label>
                <div className="relative">
                  <Input
                    id="total_portfolio_size"
                    type="number"
                    min="0"
                    placeholder="e.g. 1000000"
                    value={totalPortfolioSize}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTotalPortfolioSize(val);
                      localStorage.setItem(`target_portfolio_size_${clientId}_${selectedMemberId}`, val);
                    }}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground font-semibold">
                    INR
                  </div>
                </div>
                {totalPortfolioSize && parseFloat(totalPortfolioSize) > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Value: {formatIndianNumber(parseFloat(totalPortfolioSize))}
                  </p>
                )}
              </div>

              {totalPortfolioSize && parseFloat(totalPortfolioSize) > 0 && latestAllocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await TargetPortfolioService.downloadAllocationTargetPDF(
                        clientId,
                        selectedMember.id,
                        parseFloat(totalPortfolioSize),
                        clientName,
                        clientCode,
                        selectedMember.full_name,
                        selectedMember.investor_code
                      );
                      toast.success("Target allocation breakdown report downloaded.");
                    } catch {
                      toast.error("Failed to download report.");
                    }
                  }}
                  className="mt-2 md:mt-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Target PDF
                </Button>
              )}
            </div>

            {loadingAllocation ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                Loading latest asset allocation...
              </div>
            ) : !latestAllocation ? (
              <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-0.5">No Asset Allocation Found</h4>
                  <p>
                    Please create an asset allocation report for this client in the Asset Allocation tool first, so target portfolio ratios can be computed.
                  </p>
                </div>
              </div>
            ) : !totalPortfolioSize || parseFloat(totalPortfolioSize) <= 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                Enter a Total Portfolio Size above to calculate investment target amounts for each asset class.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[50%]">Asset / Sub-Asset Class</TableHead>
                      <TableHead className="text-right">Recommended %</TableHead>
                      <TableHead className="text-right">Target Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        label: "Equities",
                        pctKey: "equities_percentage",
                        items: [
                          { key: "stocks_percentage", label: "Stocks / Shares" },
                          { key: "mutual_fund_equity_percentage", label: "Mutual Fund (Equity)" },
                          { key: "ulip_equity_percentage", label: "ULIP (Equity)" },
                          { key: "etf_equity_percentage", label: "ETF (Equity)" },
                        ]
                      },
                      {
                        label: "Debt Securities",
                        pctKey: "debt_securities_percentage",
                        items: [
                          { key: "fixed_deposits_bonds_percentage", label: "Fixed Deposits & Bonds" },
                          { key: "mutual_fund_debt_percentage", label: "Mutual Fund (Debt)" },
                          { key: "ulip_debt_percentage", label: "ULIP (Debt)" },
                          { key: "etf_debt_percentage", label: "ETF (Debt)" },
                        ]
                      },
                      {
                        label: "Commodities",
                        pctKey: "commodities_percentage",
                        items: [
                          { key: "gold_etf_percentage", label: "Gold ETF" },
                          { key: "silver_etf_percentage", label: "Silver ETF" },
                          { key: "etf_commodity_percentage", label: "ETF (Commodity)" },
                        ]
                      }
                    ].map((cat) => {
                      const catPct = parseFloat(latestAllocation[cat.pctKey]) || 0;
                      const catAmt = (catPct / 100) * parseFloat(totalPortfolioSize);

                      return (
                        <React.Fragment key={cat.label}>
                          <TableRow 
                            className="bg-muted/20 font-semibold text-foreground cursor-pointer hover:bg-muted/30 select-none"
                            onClick={() => setExpandedBreakdown(prev => ({ ...prev, [cat.label]: !prev[cat.label] }))}
                          >
                            <TableCell className="font-semibold py-3">
                              <span className="flex items-center gap-1.5">
                                {expandedBreakdown[cat.label] ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                {cat.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{catPct.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{formatIndianNumber(catAmt)}</TableCell>
                          </TableRow>
                          {expandedBreakdown[cat.label] && cat.items.map((item) => {
                            const itemPct = parseFloat(latestAllocation[item.key]) || 0;
                            const itemAmt = (itemPct / 100) * catAmt;
                            return (
                              <TableRow key={item.key} className="hover:bg-muted/10">
                                <TableCell className="pl-6 text-muted-foreground font-normal">
                                  • &nbsp;{item.label}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{itemPct.toFixed(1)}%</TableCell>
                                <TableCell className="text-right font-medium text-foreground">{formatIndianNumber(itemAmt)}</TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {selectedMember ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetClass)}>
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="shrink-0 text-xs sm:text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.key} value={t.key} className="mt-4">
              <AssetClassTab
                key={`${selectedMember.id}-${t.key}`}
                clientId={clientId}
                member={selectedMember}
                assetClass={t.key}
                totalPortfolioSize={totalPortfolioSize ? parseFloat(totalPortfolioSize) : 0}
                latestAllocation={latestAllocation}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No active investor members found for this client.
        </div>
      )}
    </div>
  );
}

