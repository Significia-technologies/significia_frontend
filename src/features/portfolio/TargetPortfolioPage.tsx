"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, MoreHorizontal, ToggleLeft, ToggleRight,
  AlertTriangle, TrendingUp,
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

// ── Constants ──────────────────────────────────────────────────────

const TABS: { key: AssetClass; label: string }[] = [
  { key: "shares", label: "Shares" },
  { key: "mf", label: "Mutual Funds" },
  { key: "etf", label: "ETF" },
  { key: "life_insurance", label: "Life Insurance" },
  { key: "health_insurance", label: "Health Insurance" },
];

const OBJECTIVES = ["Retirement", "Child Marriage", "Child Education", "General"];
const LIFE_REASONS = ["HLV", "HLV + Savings", "Retirement", "HLV + Investment"];

// ── Add Entry Dialog ────────────────────────────────────────────────

function AddEntryDialog({
  open, onClose, onAdded,
  clientId, member, assetClass, currentTotalPct,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  clientId: string;
  member: InvestorMember;
  assetClass: AssetClass;
  currentTotalPct: number;
}) {
  const [products, setProducts] = useState<AvailableProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [objective, setObjective] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

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

    if (assetClass !== "life_insurance" && assetClass !== "health_insurance" && !objective)
      return toast.error("Select an investment objective.");
    if (assetClass === "life_insurance" && !reason)
      return toast.error("Select reason for investment.");

    const payload: TargetPortfolioCreate = {
      asset_class: assetClass,
      product_id: productId,
      percentage: pct,
      objective: assetClass === "health_insurance" ? "Health Cover" : objective || undefined,
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
            {loadingProducts ? (
              <Skeleton className="h-10 w-full" />
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                No active products in this basket.
              </p>
            ) : (
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{productLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

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

          {/* Reason (Life Insurance) */}
          {assetClass === "life_insurance" && (
            <div className="space-y-1.5">
              <Label>Reason for Investment <span className="text-destructive">*</span></Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {LIFE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <Label>Remarks on Suitability</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks"
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
  clientId, member, assetClass,
}: {
  clientId: string;
  member: InvestorMember;
  assetClass: AssetClass;
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
  const objectiveColLabel = assetClass === "life_insurance" ? "Reason" : "Objective";

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
                <TableHead>{objectiveColLabel}</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No products added yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id} className={!e.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="line-clamp-2">{e.product_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-semibold",
                        totalPct > 100 && e.is_active && "text-amber-600"
                      )}>
                        {e.percentage.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.reason_for_investment || e.objective || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px]">
                      <span className="line-clamp-2">{e.remarks || "—"}</span>
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
                  <p className="font-semibold text-sm leading-snug flex-1">{e.product_name}</p>
                  <Badge variant={e.is_active ? "default" : "secondary"} className="shrink-0 text-xs">
                    {e.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">{pctColLabel}</span>
                    <p className="font-semibold mt-0.5">{e.percentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{objectiveColLabel}</span>
                    <p className="mt-0.5">{e.reason_for_investment || e.objective || "—"}</p>
                  </div>
                  {e.remarks && (
                    <div className="col-span-2 mt-1">
                      <span className="text-muted-foreground">Remarks</span>
                      <p className="mt-0.5">{e.remarks}</p>
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
        />
      )}
    </div>
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

  const selectedMember = activeMembers.find((m) => m.id === selectedMemberId) ?? null;

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
      </div>

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

      {/* Tabs */}
      {selectedMember ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetClass)}>
          <TabsList className="w-full sm:w-auto flex overflow-x-auto">
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
