"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Loader2, MoreHorizontal, ToggleLeft, ToggleRight,
  AlertTriangle, TrendingUp, Check, ChevronsUpDown, Download,
  ChevronDown, ChevronUp, ChevronRight,
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
  return "Rs. " + val.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: val % 1 === 0 ? 0 : 2
  });
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
  clientId, member, assetClass, currentTotalPct, totalPortfolioSize, latestAllocation,
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

  const getSelectedSubAssetDetails = () => {
    if (!latestAllocation || !totalPortfolioSize || totalPortfolioSize <= 0) return null;
    
    let key: string | null = null;
    if (assetClass === "shares") {
      key = "stocks_percentage";
    } else if (assetClass === "mf") {
      if (productSubtype === "Equity") key = "mutual_fund_equity_percentage";
      if (productSubtype === "Debt") key = "mutual_fund_debt_percentage";
    } else if (assetClass === "etf") {
      if (productSubtype === "Gold") key = "gold_etf_percentage";
      if (productSubtype === "Silver") key = "silver_etf_percentage";
      if (productSubtype === "Other ETF") key = "etf_commodity_percentage";
    } else if (assetClass === "life_insurance" && productSubtype === "ULIP") {
      if (nature === "Equity") key = "ulip_equity_percentage";
      if (nature === "Debt") key = "ulip_debt_percentage";
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
  const isOverTarget = selectedSubAsset && enteredAmount > selectedSubAsset.targetAmt;


  useEffect(() => {
    if (productSubtype !== "ULIP") {
      setNature("");
    }
  }, [productSubtype]);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    TargetPortfolioService.listProducts(clientId, member.id, assetClass)
      .then((res) => setProducts(res.products))
      .catch(() => toast.error("Failed to load products."))
      .finally(() => setLoadingProducts(false));
  }, [open, clientId, member.id, assetClass]);

  const pct = parseFloat(percentage) || 0;
  const wouldExceed = currentTotalPct + pct > 100;

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add to {TABS.find((t) => t.key === assetClass)?.label} —{" "}
            <span className="font-mono text-sm">{member.investor_code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Product */}
          <div className="space-y-1.5">
            <Label>Product <span className="text-destructive">*</span></Label>
            {!loadingProducts && products.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
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
            <div className="space-y-1.5">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={productSubtype} onValueChange={setProductSubtype}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={productSubtype} onValueChange={setProductSubtype}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={productSubtype} onValueChange={setProductSubtype}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term">Term</SelectItem>
                    <SelectItem value="Endowment">Endowment</SelectItem>
                    <SelectItem value="ULIP">ULIP</SelectItem>
                    <SelectItem value="Annuity">Annuity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {productSubtype === "ULIP" && (
                <div className="space-y-1.5">
                  <Label>Nature <span className="text-destructive">*</span></Label>
                  <Select value={nature} onValueChange={setNature}>
                    <SelectTrigger><SelectValue placeholder="Select nature" /></SelectTrigger>
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

          {selectedSubAsset && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300 text-xs space-y-1">
              <div className="font-semibold flex items-center justify-between">
                <span>Guideline Target for {selectedSubAsset.label}:</span>
                <span className="bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  {selectedSubAsset.pct.toFixed(1)}%
                </span>
              </div>
              <p>
                Recommended target amount: <span className="font-bold font-mono">{formatIndianNumber(selectedSubAsset.targetAmt)}</span>
              </p>
            </div>
          )}

          {/* Percentage & Suggested Investment Amount in One Line */}
          <div className="grid grid-cols-2 gap-3">
            {/* Percentage */}
            <div className="space-y-1.5">
              <Label>{pctLabel} <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="e.g. 25"
              />
              {wouldExceed && pct > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Total will exceed 100% (current: {currentTotalPct.toFixed(1)}%)
                </p>
              )}
            </div>

            {/* Suggested Investment Amount */}
            <div className="space-y-1.5">
              <Label>Suggested Investment Amount <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                value={suggestedAmount}
                onChange={(e) => setSuggestedAmount(e.target.value)}
                placeholder="e.g. 50000"
              />
              {isOverTarget && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Exceeds recommended target amount ({formatIndianNumber(selectedSubAsset.targetAmt)})
                </p>
              )}
            </div>
          </div>


          {/* Objective (Shares / MF / ETF) */}
          {!isInsurance && (
            <div className="space-y-1.5">
              <Label>Investment Objective <span className="text-destructive">*</span></Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger><SelectValue placeholder="Select objective" /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Objective + Reason (Life Insurance) — side by side */}
          {assetClass === "life_insurance" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Investment Objective <span className="text-destructive">*</span></Label>
                <Select value={lifeObjective} onValueChange={setLifeObjective}>
                  <SelectTrigger><SelectValue placeholder="Select objective" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Reason for Investment <span className="text-destructive">*</span></Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Objective (Health Insurance — read-only) */}
          {assetClass === "health_insurance" && (
            <div className="space-y-1.5">
              <Label>Objective</Label>
              <Input value="Health Cover" readOnly className="bg-muted text-muted-foreground" />
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between">
              Remarks on Suitability
              <span className={cn("text-xs font-normal", remarks.length > 150 ? "text-destructive" : "text-muted-foreground")}>
                {remarks.length}/150
              </span>
            </Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 150))}
              placeholder="Optional remarks"
              maxLength={150}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingProducts}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
    setTogglingId(entry.id);
    try {
      await TargetPortfolioService.toggleEntry(clientId, member.id, entry.id);
      toast.success(`${entry.product_name} ${entry.is_active ? "deactivated" : "activated"}.`);
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
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>{pctColLabel}</TableHead>
                <TableHead>Suggested Amount</TableHead>
                <TableHead>{objectiveColLabel}</TableHead>
                <TableHead>Suitability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No products added yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id} className={!e.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="line-clamp-2">{e.product_name}</span>
                      {e.product_subtype && (
                        <span className="block mt-0.5 text-xs text-muted-foreground font-normal">
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
                    <TableCell>
                      <span className="font-semibold text-sm">
                        {formatIndianNumber(e.suggested_investment_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {assetClass === "life_insurance" ? (
                        <div>
                          <span>{e.objective || "—"}</span>
                          {e.reason_for_investment && (
                            <span className="block text-xs text-muted-foreground">{e.reason_for_investment}</span>
                          )}
                        </div>
                      ) : (
                        e.objective || "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <SuitabilityCell value={e.remarks} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.is_active ? "default" : "secondary"}>
                        {e.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={togglingId === e.id}>
                            {togglingId === e.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggle(e)}>
                            {e.is_active
                              ? <><ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate</>
                              : <><ToggleRight className="h-4 w-4 mr-2 text-green-600" /> Activate</>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                  <div>
                    <span className="text-muted-foreground">Suggested Amount</span>
                    <p className="font-semibold mt-0.5">{formatIndianNumber(e.suggested_investment_amount)}</p>
                  </div>
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
                        {e.is_active
                          ? <><ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate</>
                          : <><ToggleRight className="h-4 w-4 mr-2 text-green-600" /> Activate</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
        />
      )}
    </div>
  );
}

// ── Export Report Dialog ────────────────────────────────────────────

const ALL_OBJECTIVES = [
  "Retirement", "Child Education", "Child Marriage", "General", "HLV", "Health Cover",
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
  const [selectedObjective, setSelectedObjective] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!selectedObjective) return toast.error("Select an objective.");
    setDownloading(true);
    try {
      await TargetPortfolioService.downloadReport(
        clientId, memberId, selectedObjective, clientName, clientCode
      );
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error(`No active entries found for objective "${selectedObjective}".`);
      } else {
        toast.error("Failed to generate report.");
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Portfolio Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={downloading}>Cancel</Button>
          <Button onClick={handleDownload} disabled={downloading || !selectedObjective}>
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
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Target Allocation Calculator
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const newCollapsed = !isCalculatorCollapsed;
                setIsCalculatorCollapsed(newCollapsed);
                localStorage.setItem(
                  `target_portfolio_calculator_collapsed_${clientId}_${selectedMemberId}`,
                  String(newCollapsed)
                );
              }}
            >
              {isCalculatorCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
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

