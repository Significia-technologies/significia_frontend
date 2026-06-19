"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Loader2, MoreHorizontal, ToggleLeft, ToggleRight,
  AlertTriangle, TrendingUp, Check, ChevronsUpDown, Download,
  ChevronDown, ChevronUp, ChevronRight, Calculator,
  Save, GitFork, History, PlusCircle, Trash2, ArrowLeft,
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  TargetPortfolio,
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
  if (type === "SWITCH_IN") return "Switch In";
  if (type === "SWITCH_OUT") return "Switch Out";
  if (type === "TRANSFER_IN") return "Transfer In";
  if (type === "TRANSFER_OUT") return "Transfer Out";
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
  portfolioId,
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
  portfolioId?: string;
}) {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarn, setDuplicateWarn] = useState<{ existingEntryId: string; message: string } | null>(null);

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
  const [toFundId, setToFundId] = useState("");
  const [toFundType, setToFundType] = useState("");
  const [sumAssured, setSumAssured] = useState("");
  const [currentSumAssured, setCurrentSumAssured] = useState("");
  const [suggestedSumInsured, setSuggestedSumInsured] = useState("");
  const [currentSumInsured, setCurrentSumInsured] = useState("");
  const [stpTotalAmount, setStpTotalAmount] = useState("");
  const [stpAlreadyTransferred, setStpAlreadyTransferred] = useState("");
  const [stpTopUp, setStpTopUp] = useState("");

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
      // SWITCH_IN, SWITCH_OUT, TRANSFER_IN, TRANSFER_OUT — no frequency
      setFrequency("");
    }
    // Reset installments when switching away from SIP/STP
    if (val !== "SIP" && val !== "STP") {
      setNoOfInstallments("");
    }
    // Reset current accumulation and action when switching away from SIP, STP, and LUMP_SUM
    if (val !== "SIP" && val !== "STP" && val !== "LUMP_SUM") {
      setCurrentAccumulation("");
      setAction("Buy");
    }
    // Reset to-fund fields when switching away from STP/Switch/Transfer types
    const toFundTypes = ["STP", "SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"];
    if (!toFundTypes.includes(val)) {
      setToFundId("");
      setToFundType("");
    }
    // Reset STP-only amount fields when switching away from STP
    if (val !== "STP") {
      setStpTotalAmount("");
      setStpAlreadyTransferred("");
      setStpTopUp("");
    }
  };

  const getSelectedSubAssetDetails = () => {
    if (!latestAllocation || !totalPortfolioSize || totalPortfolioSize <= 0) return null;
    
    let key: string | null = null;
    if (assetClass === "shares") {
      key = "stocks_percentage";
    } else if (assetClass === "mf") {
      const isSwitchOrTransfer = ["SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(transactionType);
      const mfType = isSwitchOrTransfer ? toFundType : productSubtype;
      if (mfType === "Equity") key = "mutual_fund_equity_percentage";
      if (mfType === "Debt" || mfType === "Hybrid") key = "mutual_fund_debt_percentage";
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

  const isSwitch = transactionType === "SWITCH_IN" || transactionType === "SWITCH_OUT";
  const isTransfer = transactionType === "TRANSFER_IN" || transactionType === "TRANSFER_OUT";

  const selectedSubAsset = getSelectedSubAssetDetails();
  const enteredAmount = parseFloat(suggestedAmount) || 0;
  const enteredCurrentAccumulation = parseFloat(currentAccumulation) || 0;
  const stpTotal = (parseFloat(stpTotalAmount) || 0) + (parseFloat(stpTopUp) || 0);
  const stpCurrentAccumulation = transactionType === "STP"
    ? Math.max(0, stpTotal - (parseFloat(stpAlreadyTransferred) || 0))
    : null;
  const totalEnteredAmount = transactionType === "STP"
    ? stpTotal
    : action === "Sell"
    ? (enteredCurrentAccumulation - enteredAmount)
    : (enteredAmount + enteredCurrentAccumulation);
  const isOverTarget = selectedSubAsset && totalEnteredAmount > selectedSubAsset.targetAmt;

  const handleAmountChange = (val: string) => {
    setSuggestedAmount(val);
    // For STP, per-installment amount is independent of % — driven by stpTotalAmount instead
    if (transactionType === "STP") return;
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

  const handleStpTotalAmountChange = (val: string) => {
    setStpTotalAmount(val);
    const total = (parseFloat(val) || 0) + (parseFloat(stpTopUp) || 0);
    if (selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      if (val || stpTopUp) {
        const computedPct = (total / selectedSubAsset.targetAmt) * 100;
        setPercentage((Math.round(computedPct * 100) / 100).toString());
      } else {
        setPercentage("");
      }
    }
  };

  const handleStpTopUpChange = (val: string) => {
    setStpTopUp(val);
    const total = (parseFloat(stpTotalAmount) || 0) + (parseFloat(val) || 0);
    if (selectedSubAsset && selectedSubAsset.targetAmt > 0) {
      if (stpTotalAmount || val) {
        const computedPct = (total / selectedSubAsset.targetAmt) * 100;
        setPercentage((Math.round(computedPct * 100) / 100).toString());
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
      if (transactionType === "STP") {
        const computedTotal = (pctVal / 100) * selectedSubAsset.targetAmt;
        const topUp = parseFloat(stpTopUp) || 0;
        setStpTotalAmount((Math.round(Math.max(0, computedTotal - topUp) * 100) / 100).toString());
      } else {
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
    } else if (!val) {
      if (transactionType === "STP") {
        setStpTotalAmount("");
      } else {
        setSuggestedAmount("");
      }
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
        if (transactionType === "STP") {
          const computedTotal = (pctVal / 100) * selectedSubAsset.targetAmt;
          const topUp = parseFloat(stpTopUp) || 0;
          setStpTotalAmount((Math.round(Math.max(0, computedTotal - topUp) * 100) / 100).toString());
        } else {
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
    }
  }, [productSubtype, toFundType, nature, latestAllocation, totalPortfolioSize, action, transactionType]);

  // STP: auto-calculate suggested amount per installment = Existing Investment ÷ No. of Installments
  useEffect(() => {
    if (transactionType !== "STP") return;
    const currentAcc = Math.max(0, (parseFloat(stpTotalAmount) || 0) + (parseFloat(stpTopUp) || 0) - (parseFloat(stpAlreadyTransferred) || 0));
    const installments = parseInt(noOfInstallments) || 0;
    if (currentAcc > 0 && installments > 0) {
      setSuggestedAmount((Math.round((currentAcc / installments) * 100) / 100).toString());
    } else {
      setSuggestedAmount("");
    }
  }, [stpTotalAmount, stpTopUp, stpAlreadyTransferred, noOfInstallments, transactionType]);

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
    setToFundId("");
    setToFundType("");
    setSumAssured("");
    setCurrentSumAssured("");
    setSuggestedSumInsured("");
    setCurrentSumInsured("");
    setStpTotalAmount("");
    setStpAlreadyTransferred("");
    setStpTopUp("");

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
        const isSwitchOrTransfer = ["SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(transactionType);
        const mfType = isSwitchOrTransfer ? toFundType : productSubtype;
        const isDebtGroup = mfType === "Debt" || mfType === "Hybrid";
        if (isDebtGroup) {
          return e.asset_class === "mf" && (e.product_subtype === "Debt" || e.product_subtype === "Hybrid");
        }
        return e.asset_class === "mf" && e.product_subtype === mfType;
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

  const [pendingPayload, setPendingPayload] = useState<TargetPortfolioCreate | null>(null);

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

    if (transactionType === "STP" && !toFundId) {
      return toast.error("Select a destination (To) fund for STP.");
    }
    if (transactionType === "STP" && toFundId === productId) {
      return toast.error("From and To funds cannot be the same.");
    }
    if (transactionType === "STP" && !toFundType) {
      return toast.error("Select the To Fund type (Equity / Debt / Hybrid).");
    }
    if (transactionType === "STP" && (!stpTotalAmount || (parseFloat(stpTotalAmount) || 0) <= 0)) {
      return toast.error("Enter the total amount to transfer for STP.");
    }
    if ((isSwitch || isTransfer) && !toFundId) {
      return toast.error(`Select a destination (To) fund for ${isSwitch ? "Switch" : "Transfer"}.`);
    }
    if ((isSwitch || isTransfer) && toFundId === productId) {
      return toast.error("From and To funds cannot be the same.");
    }
    if (isSwitch && !toFundType) {
      return toast.error("Select the To Fund type (Equity / Debt / Hybrid).");
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

    if (assetClass === "health_insurance") {
      const si = parseFloat(suggestedSumInsured);
      if (!suggestedSumInsured || isNaN(si) || si <= 0)
        return toast.error("Enter a valid Suggested Sum Insured.");
      const csi = parseFloat(currentSumInsured);
      if (currentSumInsured === "" || isNaN(csi) || csi < 0)
        return toast.error("Enter a valid Current Sum Insured.");
    }

    if (assetClass === "life_insurance") {
      if (transactionType === "RECURRING" && (!noOfInstallments || parseInt(noOfInstallments) <= 0)) {
        return toast.error("Enter a valid number of installments for Recurring.");
      }
      const sa = parseFloat(sumAssured);
      if (!sumAssured || isNaN(sa) || sa <= 0) return toast.error("Enter a valid Sum Assured.");
      const csa = parseFloat(currentSumAssured);
      if (currentSumAssured === "" || isNaN(csa) || csa < 0) return toast.error("Enter a valid Current Sum Assured.");
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
      no_of_installments: (transactionType === "SIP" || transactionType === "STP" || (assetClass === "life_insurance" && transactionType === "RECURRING")) && noOfInstallments ? parseInt(noOfInstallments) : undefined,
      sum_assured: assetClass === "life_insurance" ? parseFloat(sumAssured) : undefined,
      current_sum_assured: assetClass === "life_insurance" ? parseFloat(currentSumAssured) : undefined,
      sum_insured: assetClass === "health_insurance" ? parseFloat(suggestedSumInsured) : undefined,
      current_sum_insured: assetClass === "health_insurance" ? parseFloat(currentSumInsured) : undefined,
      current_accumulation: transactionType === "STP"
        ? (stpCurrentAccumulation ?? undefined)
        : (transactionType === "SIP" || transactionType === "LUMP_SUM") && currentAccumulation
        ? parseFloat(currentAccumulation)
        : undefined,
      action: transactionType === "LUMP_SUM" ? action : (transactionType === "SIP" ? "Buy" : undefined),
      stp_to_product_id: (transactionType === "STP" || isSwitch || isTransfer) ? toFundId : undefined,
      stp_from_type: (transactionType === "STP" || isSwitch || isTransfer) ? (productSubtype || undefined) : undefined,
      stp_to_fund_type: (transactionType === "STP" || isSwitch) ? toFundType : isTransfer ? (productSubtype || undefined) : undefined,
      stp_total_amount: transactionType === "STP" && stpTotalAmount ? parseFloat(stpTotalAmount) : undefined,
      stp_already_transferred: transactionType === "STP" && stpAlreadyTransferred ? parseFloat(stpAlreadyTransferred) : undefined,
      stp_top_up: transactionType === "STP" && stpTopUp ? parseFloat(stpTopUp) : undefined,
    };

    setSubmitting(true);
    try {
      if (portfolioId) {
        const result = await TargetPortfolioService.addProduct(portfolioId, payload);
        if (result.warn) {
          setPendingPayload(payload);
          setDuplicateWarn({ existingEntryId: result.existing_entry_id!, message: result.message! });
          return;
        }
      } else {
        await TargetPortfolioService.createEntry(clientId, member.id, payload);
      }
      toast.success("Product added to target portfolio.");
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceAdd = async () => {
    if (!portfolioId || !pendingPayload) return;
    setSubmitting(true);
    try {
      await TargetPortfolioService.addProduct(portfolioId, { ...pendingPayload, force: true });
      toast.success("Product added as a separate entry.");
      setDuplicateWarn(null);
      setPendingPayload(null);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExisting = async () => {
    if (!portfolioId || !pendingPayload || !duplicateWarn?.existingEntryId) return;
    setSubmitting(true);
    try {
      await TargetPortfolioService.updateProduct(portfolioId, duplicateWarn.existingEntryId, pendingPayload);
      toast.success("Existing entry updated.");
      setDuplicateWarn(null);
      setPendingPayload(null);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update entry.");
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
    <>
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">
            Add to {TABS.find((t) => t.key === assetClass)?.label}{" "}
            <span className="font-mono text-xs text-muted-foreground">— {member.investor_code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product / From Fund */}
          <div className="space-y-1">
            <Label className="text-xs">
              {transactionType === "STP" ? "From Fund" : "Product"}{" "}
              <span className="text-destructive">*</span>
            </Label>
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

          {/* Mutual Fund Type — splits into From/To for STP & Switch; single for Transfer */}
          {assetClass === "mf" && (
            (transactionType === "STP" || isSwitch) ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">From Type <span className="text-destructive">*</span></Label>
                  <Select value={productSubtype} onValueChange={setProductSubtype}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Debt">Debt</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To Type <span className="text-destructive">*</span></Label>
                  <Select value={toFundType} onValueChange={setToFundType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Debt">Debt</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : isTransfer ? (
              <div className="space-y-1">
                <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                <Select value={productSubtype} onValueChange={(val) => { setProductSubtype(val); setToFundType(val); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equity">Equity</SelectItem>
                    <SelectItem value="Debt">Debt</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )
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

          {/* Transaction Type + Frequency in 2-col grid (frequency hidden for Switch/Transfer types) */}
          <div className={cn("grid gap-2", (isSwitch || isTransfer) ? "grid-cols-1" : "grid-cols-2")}>
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
                      {assetClass === "mf" && <SelectItem value="SWITCH_IN">Switch In</SelectItem>}
                      {assetClass === "mf" && <SelectItem value="SWITCH_OUT">Switch Out</SelectItem>}
                      {assetClass === "mf" && <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>}
                      {assetClass === "mf" && <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>}
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

            {!isSwitch && !isTransfer && (
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
            )}
          </div>

          {/* STP / Switch / Transfer: To Fund picker */}
          {(transactionType === "STP" || isSwitch || isTransfer) && (
            <div className="space-y-1">
              <Label className="text-xs">To Fund <span className="text-destructive">*</span></Label>
              {!loadingProducts && products.length === 0 ? (
                <p className="text-xs text-muted-foreground border rounded-md px-3 py-2">
                  No active products in this basket.
                </p>
              ) : (
                <ProductCombobox
                  products={products.filter((p) => p.id !== productId)}
                  value={toFundId}
                  onChange={setToFundId}
                  loading={loadingProducts}
                  placeholder="Search destination fund…"
                  renderLabel={productLabel}
                />
              )}
              <p className="text-[10px] text-muted-foreground">
                {transactionType === "STP"
                  ? "Amount will be periodically transferred from the above fund into this fund."
                  : isSwitch
                  ? "Units will be switched from the above fund into this fund (cross-type allowed)."
                  : "Units will be transferred from the above fund into this fund (same type)."}
              </p>
            </div>
          )}

          {/* SIP Fields: Existing Investment & No. of Installments */}
          {transactionType === "SIP" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Existing Investment</Label>
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

          {/* STP Amount Fields */}
          {transactionType === "STP" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Total Amt to Transfer <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    value={stpTotalAmount}
                    onChange={(e) => handleStpTotalAmountChange(e.target.value)}
                    placeholder="e.g. 500000"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amt Already Transferred</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stpAlreadyTransferred}
                    onChange={(e) => setStpAlreadyTransferred(e.target.value)}
                    placeholder="e.g. 50000"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Additional Top-up</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stpTopUp}
                    onChange={(e) => handleStpTopUpChange(e.target.value)}
                    placeholder="e.g. 100000"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Existing Investment</Label>
                  <Input
                    readOnly
                    value={stpCurrentAccumulation !== null ? formatIndianNumber(stpCurrentAccumulation) : "—"}
                    className="h-8 text-xs bg-muted text-muted-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">(Total + Top-up) − Transferred</span>
                </div>
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

          {/* Life Insurance — No. of Installments (Recurring only) */}
          {assetClass === "life_insurance" && transactionType === "RECURRING" && (
            <div className="space-y-1">
              <Label className="text-xs">No. of Installments <span className="text-destructive">*</span></Label>
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
          )}

          {/* Life Insurance — Sum Assured & Current Sum Assured */}
          {assetClass === "life_insurance" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Sum Assured <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={sumAssured}
                  onChange={(e) => setSumAssured(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Current Sum Assured <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={currentSumAssured}
                  onChange={(e) => setCurrentSumAssured(e.target.value)}
                  placeholder="e.g. 2000000"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Health Insurance — Suggested Sum Insured & Current Sum Insured */}
          {assetClass === "health_insurance" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Suggested Sum Insured <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={suggestedSumInsured}
                  onChange={(e) => setSuggestedSumInsured(e.target.value)}
                  placeholder="e.g. 500000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Current Sum Insured <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  value={currentSumInsured}
                  onChange={(e) => setCurrentSumInsured(e.target.value)}
                  placeholder="e.g. 200000"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* LUMP_SUM Fields: Existing Investment & Action (Buy/Sell) */}
          {transactionType === "LUMP_SUM" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Existing Investment</Label>
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

          {/* Suggested Premium/Amt + % Investment in 2-col grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className={cn("text-xs", hasAmtError && "text-destructive")}>
                {(isSwitch || isTransfer) ? "Amount" : (assetClass === "life_insurance" || assetClass === "health_insurance") ? "Suggested Premium" : "Suggested Amt"}
                {transactionType !== "STP" && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                type={transactionType === "STP" ? "text" : "number"}
                min="0"
                readOnly={transactionType === "STP"}
                value={transactionType === "STP"
                  ? (suggestedAmount ? formatIndianNumber(parseFloat(suggestedAmount)) : "—")
                  : suggestedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="e.g. 50000"
                className={cn(
                  "h-8 text-xs",
                  transactionType === "STP" && "bg-muted text-muted-foreground",
                  hasAmtError && "border-destructive/60 focus-visible:ring-destructive/80 text-destructive bg-destructive/5"
                )}
              />
              {transactionType === "STP" ? (
                <span className="text-[10px] text-muted-foreground">Existing Investment ÷ Installments</span>
              ) : selectedSubAsset && (
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

          {/* Objective & Anticipated Future Value row (side-by-side for SIP/STP, objective only otherwise) */}
          {!isInsurance && (
            (transactionType === "SIP" || transactionType === "STP") ? (
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
                    {transactionType === "STP" ? "Transfer Amt × Installments" : "SIP Amt × Installments"} (not part of allocation)
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

          {/* Life Insurance Recurring — Anticipated Value */}
          {assetClass === "life_insurance" && transactionType === "RECURRING" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Anticipated Value</Label>
              <Input
                readOnly
                value={
                  suggestedAmount && noOfInstallments
                    ? formatIndianNumber(parseFloat(suggestedAmount) * parseInt(noOfInstallments))
                    : "—"
                }
                className="h-8 text-xs bg-muted text-muted-foreground"
              />
              <span className="text-[10px] text-muted-foreground">Premium × Installments (not part of allocation)</span>
            </div>
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

    <AlertDialog open={!!duplicateWarn} onOpenChange={(o) => !o && setDuplicateWarn(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" /> Duplicate Product Detected
          </AlertDialogTitle>
          <AlertDialogDescription>{duplicateWarn?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setDuplicateWarn(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleUpdateExisting}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Update Existing Entry
          </AlertDialogAction>
          <AlertDialogAction
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleForceAdd}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Add as Separate Entry
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ── Asset Class Tab Content ─────────────────────────────────────────

function AssetClassTab({
  clientId, member, assetClass, totalPortfolioSize, latestAllocation, portfolioId, isSaved,
}: {
  clientId: string;
  member: InvestorMember;
  assetClass: AssetClass;
  totalPortfolioSize: number;
  latestAllocation: any | null;
  portfolioId?: string;
  isSaved?: boolean;
}) {
  const [entries, setEntries] = useState<TargetPortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPct, setTotalPct] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<TargetPortfolioEntry | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<TargetPortfolioEntry | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TargetPortfolioService.listEntries(clientId, member.id, assetClass, portfolioId);
      setEntries(res.entries);
      setTotalPct(res.total_percentage);
    } catch {
      toast.error("Failed to load portfolio entries.");
    } finally {
      setLoading(false);
    }
  }, [clientId, member.id, assetClass, portfolioId]);

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

  const handleRemove = async (entry: TargetPortfolioEntry) => {
    if (!portfolioId) return;
    setRemovingId(entry.id);
    try {
      await TargetPortfolioService.removeProduct(portfolioId, entry.id);
      toast.success(`${entry.product_name} removed.`);
      setConfirmRemove(null);
      fetch();
    } catch {
      toast.error("Failed to remove entry.");
    } finally {
      setRemovingId(null);
    }
  };

  const isInsurance = assetClass === "life_insurance" || assetClass === "health_insurance";
  const pctColLabel = assetClass === "life_insurance"
    ? "% HLV Covered"
    : assetClass === "health_insurance"
    ? "% Health Covered"
    : "% Investment";
  const accumColLabel = assetClass === "life_insurance"
    ? "Sum Assured"
    : assetClass === "health_insurance"
    ? "Suggested Sum Insured"
    : "Existing Investment";
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
        {!isSaved && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Product
          </Button>
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-x-auto">
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Product</TableHead>
                <TableHead className="w-[80px]">{pctColLabel}</TableHead>
                <TableHead className="w-[110px]">{accumColLabel}</TableHead>
                {assetClass === "life_insurance" && <TableHead className="w-[110px]">Curr. Sum Assured</TableHead>}
                {assetClass === "health_insurance" && <TableHead className="w-[110px]">Curr. Sum Insured</TableHead>}
                <TableHead className="w-[110px]">{(assetClass === "life_insurance" || assetClass === "health_insurance") ? "Suggested Premium" : "Suggested Amt"}</TableHead>
                <TableHead className="w-[110px]">Balance Amt</TableHead>
                <TableHead className="w-[100px]">Tx / Freq</TableHead>
                <TableHead className="w-[80px]">Installments</TableHead>
                <TableHead className="w-[110px]">{assetClass === "health_insurance" ? "Anticipated Cover" : "Anticipated Value"}</TableHead>
                <TableHead className="w-[100px]">{objectiveColLabel}</TableHead>
                <TableHead className="w-[110px]">Suitability</TableHead>
                <TableHead className="w-[110px] text-right">Status</TableHead>
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
                      {(["STP", "SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(e.transaction_type ?? "")) ? (
                        <span className="block mt-0.5 text-[10px] text-muted-foreground font-normal">
                          {e.stp_from_type || e.product_subtype || ""}
                          {(e.stp_from_type || e.product_subtype) && e.stp_to_fund_type ? " → " : ""}
                          {e.stp_to_fund_type || ""}
                        </span>
                      ) : (
                        e.product_subtype && (
                          <span className="block mt-0.5 text-[10px] text-muted-foreground font-normal">
                            {e.product_subtype}{e.nature ? ` — ${e.nature}` : ""}
                          </span>
                        )
                      )}
                      {(["STP", "SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(e.transaction_type ?? "")) && e.stp_to_product_name && (
                        <span className="block mt-0.5 text-[10px] text-primary font-normal">
                          → {e.stp_to_product_name}
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
                      {e.asset_class === "life_insurance" ? (
                        e.sum_assured !== null && e.sum_assured !== undefined
                          ? formatIndianNumber(e.sum_assured)
                          : <span className="text-muted-foreground">—</span>
                      ) : e.asset_class === "health_insurance" ? (
                        e.sum_insured !== null && e.sum_insured !== undefined
                          ? formatIndianNumber(e.sum_insured)
                          : <span className="text-muted-foreground">—</span>
                      ) : e.transaction_type === "STP" ? (
                        e.stp_total_amount !== null && e.stp_total_amount !== undefined ? (
                          <span>
                            {formatIndianNumber(e.current_accumulation ?? null)}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {formatIndianNumber(e.stp_already_transferred ?? 0)} of {formatIndianNumber(e.stp_total_amount + (e.stp_top_up ?? 0))}
                            </span>
                          </span>
                        ) : <span className="text-muted-foreground">—</span>
                      ) : (e.transaction_type === "SIP" || e.transaction_type === "LUMP_SUM") && e.current_accumulation !== null && e.current_accumulation !== undefined
                        ? formatIndianNumber(e.current_accumulation)
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    {assetClass === "life_insurance" && (
                      <TableCell className="font-semibold">
                        {e.current_sum_assured !== null && e.current_sum_assured !== undefined
                          ? formatIndianNumber(e.current_sum_assured)
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    )}
                    {assetClass === "health_insurance" && (
                      <TableCell className="font-semibold">
                        {e.current_sum_insured !== null && e.current_sum_insured !== undefined
                          ? formatIndianNumber(e.current_sum_insured)
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    )}
                    <TableCell className="font-semibold">
                      {e.action === "Sell" && e.suggested_investment_amount !== null && e.suggested_investment_amount !== undefined
                        ? formatIndianNumber(e.suggested_investment_amount)
                        : formatIndianNumber(e.suggested_investment_amount)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {e.transaction_type === "LUMP_SUM" && e.suggested_investment_amount != null ? (() => {
                        const existing = e.current_accumulation ?? 0;
                        const suggested = e.suggested_investment_amount;
                        const balance = e.action === "Sell" ? existing - suggested : existing + suggested;
                        return (
                          <div>
                            <span className={balance < 0 ? "text-destructive" : ""}>
                              {formatIndianNumber(balance)}
                            </span>
                            {e.action && (
                              <span className={`block text-[10px] font-semibold ${e.action === "Sell" ? "text-red-500" : "text-emerald-500"}`}>
                                {e.action}
                              </span>
                            )}
                          </div>
                        );
                      })() : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {formatTxType(e.transaction_type)}
                      </span>
                      {e.frequency && e.frequency !== e.transaction_type && (
                        <span className="block text-[10px] text-muted-foreground">{formatFrequency(e.frequency)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(e.transaction_type === "SIP" || e.transaction_type === "STP" || e.transaction_type === "RECURRING") && e.no_of_installments
                        ? e.no_of_installments
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {(e.transaction_type === "SIP" || e.transaction_type === "STP" || e.transaction_type === "RECURRING") && e.no_of_installments && e.suggested_investment_amount
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Badge variant={e.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {e.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {e.is_active && !isSaved && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={togglingId === e.id || removingId === e.id}>
                                {(togglingId === e.id || removingId === e.id)
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <MoreHorizontal className="h-3.5 w-3.5" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {e.forked_from_entry_id ? (
                                <DropdownMenuItem onClick={() => setConfirmDeactivate(e)}>
                                  <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmRemove(e)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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
                    {(["STP", "SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(e.transaction_type ?? "")) ? (
                      <>
                        {(e.stp_from_type || e.product_subtype || e.stp_to_fund_type) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {e.stp_from_type || e.product_subtype || ""}
                            {((e.stp_from_type || e.product_subtype) && e.stp_to_fund_type) ? " → " : ""}
                            {e.stp_to_fund_type || ""}
                          </p>
                        )}
                        {e.stp_to_product_name && (
                          <p className="text-xs text-primary mt-0.5">→ {e.stp_to_product_name}</p>
                        )}
                      </>
                    ) : (
                      e.product_subtype && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.product_subtype}{e.nature ? ` — ${e.nature}` : ""}
                        </p>
                      )
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
                  {e.asset_class === "life_insurance" && e.sum_assured !== null && e.sum_assured !== undefined ? (
                    <div>
                      <span className="text-muted-foreground">Sum Assured</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.sum_assured)}</p>
                    </div>
                  ) : e.asset_class === "health_insurance" && e.sum_insured !== null && e.sum_insured !== undefined ? (
                    <div>
                      <span className="text-muted-foreground">Suggested Sum Insured</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.sum_insured)}</p>
                    </div>
                  ) : e.transaction_type === "STP" && e.stp_total_amount !== null && e.stp_total_amount !== undefined ? (
                    <div>
                      <span className="text-muted-foreground">Existing Investment</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.current_accumulation ?? null)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatIndianNumber(e.stp_already_transferred ?? 0)} of {formatIndianNumber(e.stp_total_amount + (e.stp_top_up ?? 0))} transferred
                      </p>
                    </div>
                  ) : (e.transaction_type === "SIP" || e.transaction_type === "LUMP_SUM") && e.current_accumulation !== null && e.current_accumulation !== undefined ? (
                    <div>
                      <span className="text-muted-foreground">Existing Investment</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.current_accumulation)}</p>
                    </div>
                  ) : null}
                  {e.asset_class === "life_insurance" && e.current_sum_assured !== null && e.current_sum_assured !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Curr. Sum Assured</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.current_sum_assured)}</p>
                    </div>
                  )}
                  {e.asset_class === "health_insurance" && e.current_sum_insured !== null && e.current_sum_insured !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Curr. Sum Insured</span>
                      <p className="font-semibold mt-0.5">{formatIndianNumber(e.current_sum_insured)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{(e.asset_class === "life_insurance" || e.asset_class === "health_insurance") ? "Suggested Premium" : "Suggested Amount"}</span>
                    <p className="font-semibold mt-0.5">
                      {e.action === "Sell" && e.suggested_investment_amount !== null && e.suggested_investment_amount !== undefined
                        ? formatIndianNumber(e.suggested_investment_amount)
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
                  {(e.transaction_type === "SIP" || e.transaction_type === "STP" || e.transaction_type === "RECURRING") && e.no_of_installments && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Installments</span>
                        <p className="font-semibold mt-0.5">{e.no_of_installments}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{e.asset_class === "health_insurance" ? "Anticipated Cover" : "Anticipated Value"}</span>
                        <p className="font-semibold mt-0.5">
                          {e.suggested_investment_amount
                            ? formatIndianNumber(e.suggested_investment_amount * e.no_of_installments)
                            : "—"}
                        </p>
                      </div>
                    </>
                  )}
                  {(["STP", "SWITCH_IN", "SWITCH_OUT", "TRANSFER_IN", "TRANSFER_OUT"].includes(e.transaction_type ?? "")) && e.stp_to_product_name && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">To Fund</span>
                      <p className="font-medium mt-0.5 text-primary">{e.stp_to_product_name}</p>
                    </div>
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
                {e.is_active && !isSaved && (
                  <div className="border-t border-border pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full h-8 gap-1.5 text-xs" disabled={togglingId === e.id || removingId === e.id}>
                          {(togglingId === e.id || removingId === e.id)
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MoreHorizontal className="h-3.5 w-3.5" />}
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(e.forked_from_entry_id || !portfolioId) ? (
                          <DropdownMenuItem onClick={() => setConfirmDeactivate(e)}>
                            <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmRemove(e)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!confirmDeactivate} onOpenChange={(o) => !o && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Deactivate Product?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You are about to deactivate <strong>{confirmDeactivate?.product_name}</strong>.
              </span>
              <span className="block font-semibold text-destructive">
                This action is irreversible — the product cannot be reactivated once deactivated.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeactivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => { if (confirmDeactivate) { handleToggle(confirmDeactivate); setConfirmDeactivate(null); } }}
              disabled={!!togglingId}
            >
              {togglingId ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Yes, Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Remove Product Entry
            </AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{confirmRemove?.product_name}</strong> from this draft?
              This entry was added in the current version and has not been saved yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmRemove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
              disabled={!!removingId}
            >
              {removingId ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          portfolioId={portfolioId}
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
  const router = useRouter();
  const activeMembers = members.filter((m) => m.is_active);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    activeMembers[0]?.id ?? ""
  );
  const [activeTab, setActiveTab] = useState<AssetClass>("shares");
  const [showExport, setShowExport] = useState(false);

  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId) ?? null;

  const [latestAllocation, setLatestAllocation] = useState<any | null>(null);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [isCalculatorCollapsed, setIsCalculatorCollapsed] = useState<boolean>(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState<Record<string, boolean>>({
    Equities: false,
    "Debt Securities": false,
    Commodities: false,
  });

  // ── Portfolio version state ──────────────────────────────────────
  const [portfolios, setPortfolios] = useState<TargetPortfolio[]>([]);
  const [currentPortfolio, setCurrentPortfolio] = useState<TargetPortfolio | null>(null);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [newFundAmount, setNewFundAmount] = useState("");
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [forkingPortfolio, setForkingPortfolio] = useState(false);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [forkReason, setForkReason] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [fundAmountInput, setFundAmountInput] = useState<string>("");
  const fundAmountDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPortfolios = useCallback(async () => {
    if (!selectedMemberId) return;
    setLoadingPortfolios(true);
    try {
      const res = await TargetPortfolioService.listPortfolios(clientId, selectedMemberId);
      setPortfolios(res.portfolios);
      // Auto-select: prefer current saved, then latest draft
      const current = res.portfolios.find((p) => p.is_current && p.is_saved)
        ?? res.portfolios.find((p) => !p.is_saved)
        ?? res.portfolios[0]
        ?? null;
      setCurrentPortfolio(current);
      setFundAmountInput(current ? String(current.fund_amount) : "");
    } catch {
      toast.error("Failed to load portfolios.");
    } finally {
      setLoadingPortfolios(false);
    }
  }, [clientId, selectedMemberId]);

  useEffect(() => { loadPortfolios(); }, [loadPortfolios]);

  const handleCreatePortfolio = async () => {
    const amt = parseFloat(newFundAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid fund amount.");
    setCreatingPortfolio(true);
    try {
      await TargetPortfolioService.createPortfolio(clientId, selectedMemberId, amt);
      setShowCreatePortfolio(false);
      setNewFundAmount("");
      await loadPortfolios();
      toast.success("Portfolio draft created.");
    } catch {
      toast.error("Failed to create portfolio.");
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const handleSavePortfolio = async () => {
    if (!currentPortfolio) return;
    setSavingPortfolio(true);
    try {
      await TargetPortfolioService.savePortfolio(currentPortfolio.id);
      await loadPortfolios();
      toast.success("Portfolio saved and marked as current.");
    } catch {
      toast.error("Failed to save portfolio.");
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleForkPortfolio = async () => {
    if (!currentPortfolio || !forkReason.trim()) return;
    setForkingPortfolio(true);
    try {
      await TargetPortfolioService.forkPortfolio(currentPortfolio.id, forkReason.trim());
      setShowForkDialog(false);
      setForkReason("");
      await loadPortfolios();
      toast.success("New draft version created. Edit and save when ready.");
    } catch {
      toast.error("Failed to create new version.");
    } finally {
      setForkingPortfolio(false);
    }
  };

  const handleFundAmountChange = (val: string) => {
    setFundAmountInput(val);
    if (!currentPortfolio || currentPortfolio.is_saved) return;
    if (fundAmountDebounceRef.current) clearTimeout(fundAmountDebounceRef.current);
    fundAmountDebounceRef.current = setTimeout(async () => {
      const amt = parseFloat(val);
      if (!amt || amt <= 0) return;
      try {
        const updated = await TargetPortfolioService.updateFundAmount(currentPortfolio.id, amt);
        setCurrentPortfolio(updated);
      } catch {
        toast.error("Failed to update fund amount.");
      }
    }, 800);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
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
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/portfolio/target-portfolio")}
          className="gap-1.5 text-xs uppercase font-bold tracking-widest -ml-2 h-7"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to client list
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Target Portfolio
            </h2>
            <p className="text-sm text-muted-foreground">{clientName} &mdash; {clientCode}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="h-8 text-sm w-auto min-w-[180px]">
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

            {selectedMember && (
              <span className="text-sm font-semibold">{selectedMember.full_name}</span>
            )}

            {selectedMember && (
              <Button variant="outline" size="sm" onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4 mr-2" /> Export Report
              </Button>
            )}
          </div>
        </div>
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

      {/* Portfolio Version Banner */}
      {selectedMember && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/[0.02]">
          {loadingPortfolios ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading portfolios...
            </div>
          ) : !currentPortfolio ? (
            <>
              <div>
                <p className="font-semibold text-sm">No portfolio yet for this member.</p>
                <p className="text-xs text-muted-foreground">Create a portfolio to start adding products.</p>
              </div>
              <Button size="sm" onClick={() => setShowCreatePortfolio(true)}>
                <PlusCircle className="h-4 w-4 mr-1.5" /> Create Portfolio
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {currentPortfolio.is_saved ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase tracking-wider">
                      <Save className="h-2.5 w-2.5 mr-1" /> Saved
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase tracking-wider">
                      Draft
                    </Badge>
                  )}
                  <span className="text-sm font-semibold">Version {currentPortfolio.version_number}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(currentPortfolio.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                {portfolios.length > 1 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowVersionHistory(true)}>
                    <History className="h-3 w-3" /> {portfolios.length} versions
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!currentPortfolio.is_saved && (
                  <Button size="sm" onClick={handleSavePortfolio} disabled={savingPortfolio} className="gap-1.5">
                    {savingPortfolio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Portfolio
                  </Button>
                )}
                {currentPortfolio.is_saved && (
                  <Button size="sm" variant="outline" onClick={() => { setForkReason(""); setShowForkDialog(true); }} className="gap-1.5">
                    <GitFork className="h-3.5 w-3.5" />
                    Edit (New Version)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Portfolio Dialog */}
      <Dialog open={showCreatePortfolio} onOpenChange={(o) => !o && setShowCreatePortfolio(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Asset Allocation Fund Amount (Rs.)</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                placeholder="e.g. 1000000"
                value={newFundAmount}
                onChange={(e) => setNewFundAmount(e.target.value)}
                className="pr-16"
                autoFocus
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground font-semibold">INR</div>
            </div>
            {newFundAmount && parseFloat(newFundAmount) > 0 && (
              <p className="text-xs text-green-600">{formatIndianNumber(parseFloat(newFundAmount))}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePortfolio(false)}>Cancel</Button>
            <Button onClick={handleCreatePortfolio} disabled={creatingPortfolio}>
              {creatingPortfolio ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fork / Edit Reason Dialog */}
      <Dialog open={showForkDialog} onOpenChange={(o) => { if (!o) { setShowForkDialog(false); setForkReason(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitFork className="h-4 w-4" /> Create New Version
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              A new editable draft will be created from the current saved version. You can modify products and save it as the new current version.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Reason for Edit <span className="text-destructive">*</span>
              </Label>
              <textarea
                className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="e.g. Client's risk appetite changed, increasing equity allocation..."
                value={forkReason}
                onChange={(e) => setForkReason(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{forkReason.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForkDialog(false); setForkReason(""); }}>Cancel</Button>
            <Button onClick={handleForkPortfolio} disabled={!forkReason.trim() || forkingPortfolio}>
              {forkingPortfolio ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={(o) => !o && setShowVersionHistory(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Portfolio Versions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {portfolios.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                  currentPortfolio?.id === p.id && "border-primary bg-primary/5"
                )}
                onClick={() => { setCurrentPortfolio(p); setFundAmountInput(String(p.fund_amount)); setShowVersionHistory(false); }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Version {p.version_number}</span>
                    {p.is_saved ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">Saved</Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">Draft</Badge>
                    )}
                    {p.is_current && <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[9px]">Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fund: {formatIndianNumber(p.fund_amount)} &middot; {new Date(p.created_at).toLocaleDateString("en-IN")}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-1">"{p.notes}"</p>
                  )}
                </div>
                {p.product_count !== undefined && (
                  <span className="text-xs text-muted-foreground">{p.product_count} products</span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Target Allocation Calculator Card */}
      {selectedMember && currentPortfolio && (
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
                  Asset Allocation Fund Amount (Rs.)
                </Label>
                <div className="relative">
                  <Input
                    id="total_portfolio_size"
                    type="number"
                    min="0"
                    placeholder="e.g. 1000000"
                    value={fundAmountInput}
                    onChange={(e) => handleFundAmountChange(e.target.value)}
                    disabled={!currentPortfolio || currentPortfolio.is_saved}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs text-muted-foreground font-semibold">
                    INR
                  </div>
                </div>
                {fundAmountInput && parseFloat(fundAmountInput) > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Value: {formatIndianNumber(parseFloat(fundAmountInput))}
                  </p>
                )}
                {currentPortfolio?.is_saved && (
                  <p className="text-xs text-amber-600 mt-1">Saved portfolio — fork to edit fund amount.</p>
                )}
              </div>

              {fundAmountInput && parseFloat(fundAmountInput) > 0 && latestAllocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await TargetPortfolioService.downloadAllocationTargetPDF(
                        clientId,
                        selectedMember.id,
                        parseFloat(fundAmountInput),
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
            ) : !fundAmountInput || parseFloat(fundAmountInput) <= 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                Enter an Asset Allocation Fund Amount above to calculate investment target amounts for each asset class.
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
                      const catAmt = (catPct / 100) * parseFloat(fundAmountInput);

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
      {selectedMember && currentPortfolio ? (
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
                key={`${selectedMember.id}-${t.key}-${currentPortfolio?.id ?? "none"}`}
                clientId={clientId}
                member={selectedMember}
                assetClass={t.key}
                totalPortfolioSize={fundAmountInput ? parseFloat(fundAmountInput) : 0}
                latestAllocation={latestAllocation}
                portfolioId={currentPortfolio?.id}
                isSaved={currentPortfolio?.is_saved}
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

