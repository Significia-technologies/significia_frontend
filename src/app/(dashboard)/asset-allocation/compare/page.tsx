"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  Loader2,
  Download,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Search,
  Plus,
  History,
  Calendar,
  CheckCircle2,
  FolderInput,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { ExistingAssetAllocationService, ExistingAssetAllocation } from "@/core/services/existing-asset-allocation.service";
import { AssetAllocationService, AssetAllocation, ClientValidateResponse } from "@/core/services/asset-allocation.service";
import { saveReportToDrawer } from "@/lib/save-to-drawer";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

type StepType = "HISTORY" | "VALIDATE" | "COMPARE";

export default function AllocationComparisonPage() {
  const { user } = useAppStore();
  const router = useRouter();

  // Enforce read permission for BOTH modules
  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  
  const hasExistingPerm = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Existing Asset Allocation")?.can_read;
  
  const hasTargetPerm = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Asset Allocation")?.can_read;

  useEffect(() => {
    if (user && (!hasExistingPerm || !hasTargetPerm)) {
      toast.error("Access Restricted: You need permissions for both Existing and Target Asset Allocation modules.");
      router.replace("/");
    }
  }, [user, hasExistingPerm, hasTargetPerm, router]);

  const [step, setStep] = useState<StepType>("HISTORY");
  const [clientInfo, setClientInfo] = useState<(ClientValidateResponse & { client_code: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingAlloc, setExistingAlloc] = useState<ExistingAssetAllocation | null>(null);
  const [targetAlloc, setTargetAlloc] = useState<AssetAllocation | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Comparison History States
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSavingComparison, setIsSavingComparison] = useState(false);
  const [savedComparisonIds, setSavedComparisonIds] = useState<Set<string>>(new Set());
  const [savingToDrawer, setSavingToDrawer] = useState<string | null>(null);
  const [drawerSavedIds, setDrawerSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && hasExistingPerm && hasTargetPerm) {
      loadHistory();
    }
  }, [user, hasExistingPerm, hasTargetPerm]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await ExistingAssetAllocationService.getComparisons();
      setHistory(data);
    } catch {
      toast.error("Failed to load past comparisons history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClientValidated = async (info: ClientValidateResponse & { client_code: string }) => {
    setClientInfo(info);
    if (!info.client_id) {
      toast.error("Internal client identifier missing in validation response");
      return;
    }
    
    setLoading(true);
    try {
      // Fetch both allocations in parallel
      const [existingList, targetList] = await Promise.all([
        ExistingAssetAllocationService.getAll(info.client_id),
        AssetAllocationService.getAll(info.client_id)
      ]);
      
      setExistingAlloc(existingList[0] || null);
      setTargetAlloc(targetList[0] || null);
      setStep("COMPARE");
    } catch {
      toast.error("Failed to load client allocation histories");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = async (item: any) => {
    setLoading(true);
    setClientInfo({
      success: true,
      client_name: item.client_name,
      client_id: item.client_id,
      client_code: item.client_code,
      registration_number: "",
      category_name: item.target_risk_tier,
      form_name: ""
    });
    try {
      const [existingAllocData, targetAllocData] = await Promise.all([
        ExistingAssetAllocationService.getById(item.existing_allocation_id),
        AssetAllocationService.getById(item.target_allocation_id)
      ]);
      setExistingAlloc(existingAllocData);
      setTargetAlloc(targetAllocData);
      setStep("COMPARE");
      setSavedComparisonIds(prev => {
        const next = new Set(prev);
        next.add(`${item.existing_allocation_id}-${item.target_allocation_id}`);
        return next;
      });
    } catch {
      toast.error("Failed to load past comparison details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComparison = async () => {
    if (!existingAlloc || !targetAlloc || !clientInfo?.client_id) return;
    setIsSavingComparison(true);
    try {
      await ExistingAssetAllocationService.saveComparison({
        client_id: clientInfo.client_id,
        existing_allocation_id: existingAlloc.id,
        target_allocation_id: targetAlloc.id
      });
      toast.success("Comparison saved to history successfully.");
      const pairKey = `${existingAlloc.id}-${targetAlloc.id}`;
      setSavedComparisonIds(prev => {
        const next = new Set(prev);
        next.add(pairKey);
        return next;
      });
      loadHistory();
    } catch {
      toast.error("Failed to save comparison to history.");
    } finally {
      setIsSavingComparison(false);
    }
  };

  const handleReset = () => {
    setClientInfo(null);
    setExistingAlloc(null);
    setTargetAlloc(null);
    setStep("HISTORY");
  };

  const handleDownloadPDF = async () => {
    if (!existingAlloc || !targetAlloc || !clientInfo) return;
    setDownloading(true);
    try {
      const filename = `Allocation_Comparison_${clientInfo.client_code}.pdf`;
      await ExistingAssetAllocationService.downloadComparisonPDF(
        existingAlloc.id,
        targetAlloc.id,
        filename
      );
      toast.success("PDF report downloaded successfully.");
    } catch {
      toast.error("Failed to compile comparison report PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveCompareToDrawer = async () => {
    if (!existingAlloc || !targetAlloc || !clientInfo?.client_id) return;
    const sourceId = `compare-${existingAlloc.id}-${targetAlloc.id}`;
    if (drawerSavedIds.has(sourceId)) return;
    setSavingToDrawer(sourceId);
    try {
      const dateLabel = format(new Date(), "dd MMM yyyy");
      await saveReportToDrawer({
        clientId: clientInfo.client_id,
        endpoint: API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.COMPARE_PDF(existingAlloc.id, targetAlloc.id),
        fileName: `Allocation_Comparison_${clientInfo.client_code}_${dateLabel.replace(/ /g, "_")}.pdf`,
        documentType: `Allocation Comparison · ${dateLabel}`,
        category: "Asset Allocation",
        sourceId,
      });
      setDrawerSavedIds((prev) => new Set(prev).add(sourceId));
      toast.success("Comparison report saved to client drawer.");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setDrawerSavedIds((prev) => new Set(prev).add(sourceId));
        toast.info("Already saved to drawer.");
      } else {
        toast.error("Failed to save report to drawer.");
      }
    } finally {
      setSavingToDrawer(null);
    }
  };

  const handleSaveHistoryToDrawer = async (item: any) => {
    const sourceId = `compare-${item.existing_allocation_id}-${item.target_allocation_id}`;
    if (drawerSavedIds.has(sourceId)) return;
    setSavingToDrawer(sourceId);
    try {
      const dateLabel = format(new Date(item.created_at), "dd MMM yyyy");
      await saveReportToDrawer({
        clientId: item.client_id,
        endpoint: API_ENDPOINTS.EXISTING_ASSET_ALLOCATION.COMPARE_PDF(item.existing_allocation_id, item.target_allocation_id),
        fileName: `Allocation_Comparison_${item.client_code}_${dateLabel.replace(/ /g, "_")}.pdf`,
        documentType: `Allocation Comparison · ${dateLabel}`,
        category: "Asset Allocation",
        sourceId,
      });
      setDrawerSavedIds((prev) => new Set(prev).add(sourceId));
      toast.success("Comparison report saved to client drawer.");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setDrawerSavedIds((prev) => new Set(prev).add(sourceId));
        toast.info("Already saved to drawer.");
      } else {
        toast.error("Failed to save report to drawer.");
      }
    } finally {
      setSavingToDrawer(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getTierStyles = (tier: string) => {
    const t = tier?.toLowerCase() || "";
    if (t.includes("aggressive")) return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      dot: "bg-red-500"
    };
    if (t.includes("moderate")) return {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/20",
      dot: "bg-amber-500"
    };
    if (t.includes("conservative")) return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      dot: "bg-emerald-500"
    };
    return {
      bg: "bg-primary/10",
      text: "text-primary/80",
      border: "border-primary/20",
      dot: "bg-primary"
    };
  };

  if (!user || !hasExistingPerm || !hasTargetPerm) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Define breakdown segments
  const rowItems = [
    { cat: "Equities", label: "Direct Equity (Stocks)", extPctKey: "stocks_percentage", tgtPctKey: "stocks_percentage" },
    { cat: "Equities", label: "Mutual Funds (Equity)", extPctKey: "mutual_fund_equity_percentage", tgtPctKey: "mutual_fund_equity_percentage" },
    { cat: "Equities", label: "ULIPs (Equity)", extPctKey: "ulip_equity_percentage", tgtPctKey: "ulip_equity_percentage" },
    { cat: "Equities", label: "ETFs (Equity)", extPctKey: "etf_equity_percentage", tgtPctKey: "etf_equity_percentage" },
    { cat: "Equities", label: "EQUITIES TOTAL", extPctKey: "equities_percentage", tgtPctKey: "equities_percentage", isCategoryTotal: true },

    { cat: "Debt Securities", label: "Fixed Deposits & Bonds", extPctKey: "fixed_deposits_bonds_percentage", tgtPctKey: "fixed_deposits_bonds_percentage" },
    { cat: "Debt Securities", label: "Mutual Funds (Debt)", extPctKey: "mutual_fund_debt_percentage", tgtPctKey: "mutual_fund_debt_percentage" },
    { cat: "Debt Securities", label: "ULIPs (Debt)", extPctKey: "ulip_debt_percentage", tgtPctKey: "ulip_debt_percentage" },
    { cat: "Debt Securities", label: "ETFs (Debt)", extPctKey: "etf_debt_percentage", tgtPctKey: "etf_debt_percentage" },
    { cat: "Debt Securities", label: "DEBT SECURITIES TOTAL", extPctKey: "debt_securities_percentage", tgtPctKey: "debt_securities_percentage", isCategoryTotal: true },

    { cat: "Commodities", label: "Gold ETFs", extPctKey: "gold_etf_percentage", tgtPctKey: "gold_etf_percentage" },
    { cat: "Commodities", label: "Silver ETFs", extPctKey: "silver_etf_percentage", tgtPctKey: "silver_etf_percentage" },
    { cat: "Commodities", label: "Other ETFs (Commodity)", extPctKey: "etf_commodity_percentage", tgtPctKey: "etf_commodity_percentage" },
    { cat: "Commodities", label: "COMMODITIES TOTAL", extPctKey: "commodities_percentage", tgtPctKey: "commodities_percentage", isCategoryTotal: true },
  ];

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-5">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between border-b border-primary/10 pb-3 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground leading-none">Allocation Comparison</h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 mt-0.5">Existing vs Target allocation — percentage only</p>
          </div>
        </div>
        {step === "COMPARE" && (
          <div className="flex items-center gap-3">
            {/* Client badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Client:</span>
              <span className="text-xs font-black text-primary">{clientInfo?.client_name}</span>
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase">{clientInfo?.client_code}</span>
            </div>

            {/* Save to History Button */}
            {existingAlloc && targetAlloc && (
              <Button
                onClick={handleSaveComparison}
                disabled={isSavingComparison || savedComparisonIds.has(`${existingAlloc.id}-${targetAlloc.id}`)}
                variant={savedComparisonIds.has(`${existingAlloc.id}-${targetAlloc.id}`) ? "outline" : "default"}
                size="sm"
                className={cn(
                  "gap-1.5 font-black uppercase text-[9px] tracking-widest h-8 px-3 transition-all",
                  savedComparisonIds.has(`${existingAlloc.id}-${targetAlloc.id}`) 
                    ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" 
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
              >
                {isSavingComparison ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : savedComparisonIds.has(`${existingAlloc.id}-${targetAlloc.id}`) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <History className="w-3 h-3" />
                )}
                <span>{savedComparisonIds.has(`${existingAlloc.id}-${targetAlloc.id}`) ? "Saved" : "Save Comparison"}</span>
              </Button>
            )}

            {/* Save to Drawer */}
            {existingAlloc && targetAlloc && (() => {
              const sourceId = `compare-${existingAlloc.id}-${targetAlloc.id}`;
              const isSaved = drawerSavedIds.has(sourceId);
              return (
                <Button
                  onClick={handleSaveCompareToDrawer}
                  disabled={savingToDrawer === sourceId || isSaved}
                  size="sm"
                  variant="outline"
                  className={cn(
                    "gap-1.5 font-black uppercase text-[9px] tracking-widest h-8 px-3 transition-all",
                    isSaved ? "border-teal-500/30 text-teal-500 bg-teal-500/5" : "border-teal-500/30 text-teal-500 hover:bg-teal-500/10"
                  )}
                >
                  {savingToDrawer === sourceId ? <Loader2 className="w-3 h-3 animate-spin" /> : <FolderInput className="w-3 h-3" />}
                  {isSaved ? "Saved ✓" : "Drawer"}
                </Button>
              );
            })()}

            {/* Report PDF */}
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90 font-black uppercase text-[9px] tracking-widest h-8 px-3"
            >
              {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              PDF
            </Button>
            {/* Change Client */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 h-8 px-3 font-black uppercase text-[9px] tracking-widest border-primary/20 hover:bg-primary/5 text-muted-foreground"
            >
              <ChevronLeft className="w-3 h-3" />
              Back
            </Button>
          </div>
        )}
      </div>

      {step === "HISTORY" && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Search past comparisons..."
                className="pl-10 h-9 bg-card/50 border-primary/10 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setStep("VALIDATE")}
              className="w-full sm:w-auto h-9 gap-1.5 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-4"
            >
              <Plus className="w-4 h-4" />
              Compare New Client
            </Button>
          </div>

          <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="hover:bg-transparent border-primary/10">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Client</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Existing Portfolio</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Target Profile</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Comparison Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-primary/5">
                        <TableCell colSpan={5} className="h-16">
                          <Skeleton className="h-8 w-full rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : history.filter(item => 
                    item.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.client_code?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium italic">
                        No past comparisons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history
                      .filter(item => 
                        item.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.client_code?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => {
                        const existingStyles = getTierStyles(item.existing_risk_tier);
                        const targetStyles = getTierStyles(item.target_risk_tier);
                        return (
                          <TableRow key={item.id} className="group hover:bg-primary/5 border-primary/5 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                  {item.client_name || "Unknown Client"}
                                </span>
                                <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                                  {item.client_code || "N/A"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <span className="font-black text-xs text-primary/80">
                                  {formatCurrency(item.existing_total)}
                                </span>
                                <Badge variant="outline" className={cn("gap-1 py-0.5 px-2 border uppercase font-black text-[7.5px] tracking-widest rounded-full w-fit", existingStyles.bg, existingStyles.text, existingStyles.border)}>
                                  <span className={cn("w-1 h-1 rounded-full", existingStyles.dot)} />
                                  {item.existing_risk_tier || "N/A"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1 py-0.5 px-2 border uppercase font-black text-[7.5px] tracking-widest rounded-full w-fit", targetStyles.bg, targetStyles.text, targetStyles.border)}>
                                <span className={cn("w-1 h-1 rounded-full", targetStyles.dot)} />
                                {item.target_risk_tier || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 opacity-40" />
                                {format(new Date(item.created_at), "MMM dd, yyyy • HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectHistory(item)}
                                  className="h-8 px-2.5 gap-1.5 border border-primary/10 hover:bg-primary/5 text-muted-foreground"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-tight">View</span>
                                </Button>
                                {(() => {
                                  const sourceId = `compare-${item.existing_allocation_id}-${item.target_allocation_id}`;
                                  const isSaved = drawerSavedIds.has(sourceId);
                                  return (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-primary/10 hover:bg-primary/5 text-muted-foreground">
                                          <MoreHorizontal className="w-4 h-4" />
                                          <span className="sr-only">Open menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 border-primary/20 bg-background/95 backdrop-blur-md">
                                        <DropdownMenuItem
                                          className="gap-2 cursor-pointer"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            setDownloading(true);
                                            try {
                                              await ExistingAssetAllocationService.downloadComparisonPDF(
                                                item.existing_allocation_id,
                                                item.target_allocation_id,
                                                `Allocation_Comparison_${item.client_code}.pdf`
                                              );
                                              toast.success("PDF downloaded successfully.");
                                            } catch {
                                              toast.error("Failed to download PDF.");
                                            } finally {
                                              setDownloading(false);
                                            }
                                          }}
                                          disabled={downloading}
                                        >
                                          {downloading ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                          ) : (
                                            <Download className="w-4 h-4 text-red-500" />
                                          )}
                                          <span className="font-bold text-[10px] uppercase tracking-wider">Download PDF</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="gap-2 cursor-pointer text-teal-600 focus:text-teal-600 focus:bg-teal-50"
                                          onClick={(e) => { e.stopPropagation(); handleSaveHistoryToDrawer(item); }}
                                          disabled={savingToDrawer === sourceId || isSaved}
                                        >
                                          {savingToDrawer === sourceId ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <FolderInput className="w-4 h-4" />
                                          )}
                                          <span className="font-bold text-[10px] uppercase tracking-wider">{isSaved ? "Saved ✓" : "Save to Drawer"}</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  );
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "VALIDATE" && (
        <div className="max-w-2xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6 relative space-y-4">
          <div className="flex items-center justify-between border-b border-primary/5 pb-2">
            <h3 className="text-sm font-bold tracking-wider text-primary">Validate Client for Comparison</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("HISTORY")}
              className="gap-1.5 h-8 px-2 font-black uppercase text-[9px] tracking-widest text-muted-foreground"
            >
              <ChevronLeft className="w-3 h-3" />
              Back to History
            </Button>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center rounded-xl z-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <ClientValidator onValidated={handleClientValidated} />
        </div>
      )}

      {step === "COMPARE" && (
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Missing Allocations Warning */}
          {(!existingAlloc || !targetAlloc) && (
            <Card className="border-amber-500/20 bg-amber-500/5 rounded-xl">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Incomplete Allocations Registered</h3>
                    <p className="text-xs text-muted-foreground mt-1">Both target and existing allocations are required for comparison.</p>
                    <div className="flex gap-4 mt-2">
                      {!existingAlloc && (
                        <Button variant="link" onClick={() => router.push("/existing-asset-allocation")} className="p-0 h-auto text-xs font-bold text-amber-500 hover:text-amber-400 gap-1">
                          Create Existing Holdings <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                      {!targetAlloc && (
                        <Button variant="link" onClick={() => router.push("/asset-allocation")} className="p-0 h-auto text-xs font-bold text-amber-500 hover:text-amber-400 gap-1">
                          Create Target Allocation <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {existingAlloc && targetAlloc && (
            <>
              {/* Main Comparison Matrix Card */}
              <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-primary/5 bg-primary/5 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Asset Allocation Comparison Matrix</CardTitle>
                  <CardDescription>Comparative breakdown of current values vs target values and percentage deviations</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-primary/5">
                      <TableRow className="hover:bg-transparent border-primary/10">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Asset Category</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Sub-Asset Class</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Existing %</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Target %</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Variance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowItems.map((item, idx) => {
                        const extPct = existingAlloc[item.extPctKey as keyof ExistingAssetAllocation] as number || 0;
                        const tgtPct = targetAlloc[item.tgtPctKey as keyof AssetAllocation] as number || 0;
                        const variance = extPct - tgtPct;
                        const varSign = variance > 0 ? "+" : "";

                        return (
                          <TableRow
                            key={idx}
                            className={cn(
                              "transition-colors",
                              item.isCategoryTotal
                                ? "bg-primary/15 border-t border-b border-primary/20 hover:bg-primary/20"
                                : "border-primary/5 hover:bg-primary/5"
                            )}
                          >
                            <TableCell className={cn("text-xs font-semibold", item.isCategoryTotal ? "text-primary font-black" : "text-muted-foreground/60")}>
                              {idx % 5 === 0 && item.cat}
                            </TableCell>
                            <TableCell className={cn("text-xs", item.isCategoryTotal ? "font-black text-foreground tracking-wide uppercase text-[11px]" : "font-medium")}>
                              {item.label}
                            </TableCell>
                            <TableCell className={cn("text-xs text-right", item.isCategoryTotal ? "font-black text-foreground" : "font-medium")}>
                              {extPct.toFixed(1)}%
                            </TableCell>
                            <TableCell className={cn("text-xs text-right", item.isCategoryTotal ? "font-black text-foreground" : "font-medium")}>
                              {tgtPct.toFixed(1)}%
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-xs text-right font-black",
                                variance > 1 ? "text-red-500" : variance < -1 ? "text-emerald-500" : "text-muted-foreground/55"
                              )}
                            >
                              {varSign}{variance.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Grand Total */}
                      <TableRow className="bg-primary/10 border-primary/10 font-bold hover:bg-primary/15 transition-colors">
                        <TableCell className="text-xs text-primary font-black"></TableCell>
                        <TableCell className="text-xs font-black">GRAND TOTAL</TableCell>
                        <TableCell className="text-xs text-right font-black">100.0%</TableCell>
                        <TableCell className="text-xs text-right font-black">100.0%</TableCell>
                        <TableCell className="text-xs text-right font-black text-muted-foreground/50">0.0%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 4-Chart Grid: Asset-wise & Sub-asset Comparisons */}
              {(() => {
                const renderChart = (
                  title: string,
                  description: string,
                  data: { label: string; ext: number; tgt: number; color: string }[]
                ) => {
                  const maxVal = Math.max(...data.flatMap(d => [d.ext, d.tgt]), 10);
                  const chartH = 180;
                  const barW = 20;
                  const gap = 8;
                  const groupGap = 28;
                  const groupW = barW * 2 + gap;
                  const totalW = data.length * (groupW + groupGap);
                  const paddingLeft = 44;
                  const paddingBottom = 56;
                  const paddingTop = 20;
                  const svgW = Math.max(totalW + paddingLeft + 16, 280);
                  const yLines = [0, 25, 50, 75, 100].filter(v => v <= Math.ceil(maxVal / 10) * 10 + 5);

                  return (
                    <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-3 border-b border-primary/5">
                        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary">{title}</CardTitle>
                        <CardDescription className="text-[10px]">{description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6 pb-4 px-4">
                        <div className="w-full flex justify-center">
                          <svg
                            viewBox={`0 0 ${svgW} ${chartH + paddingBottom + paddingTop}`}
                            width={svgW}
                            height={chartH + paddingBottom + paddingTop}
                            style={{ maxWidth: "100%", display: "block" }}
                            className="overflow-visible"
                          >
                            {/* Y-axis grid */}
                            {yLines.map(v => {
                              const y = paddingTop + chartH - (v / maxVal) * chartH;
                              return (
                                <g key={v}>
                                  <line x1={paddingLeft} x2={svgW} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
                                  <text x={paddingLeft - 6} y={y + 3} textAnchor="end" fontSize={8} fill="currentColor" opacity={0.4} fontWeight="700" fontFamily="inherit">{v}%</text>
                                </g>
                              );
                            })}

                            {/* Bars */}
                            {data.map((item, i) => {
                              const x = paddingLeft + i * (groupW + groupGap);
                              const extH = (item.ext / maxVal) * chartH;
                              const tgtH = (item.tgt / maxVal) * chartH;
                              const variance = item.ext - item.tgt;
                              const varSign = variance > 0 ? "+" : "";
                              const varCol = variance > 1 ? "#ef4444" : variance < -1 ? "#10b981" : "#6b7280";

                              return (
                                <g key={item.label}>
                                  {/* Existing bar */}
                                  <rect x={x} y={paddingTop + chartH - extH} width={barW} height={extH} rx={4} fill={item.color} opacity={0.85} />
                                  {item.ext > 0 && (
                                    <text x={x + barW / 2} y={paddingTop + chartH - extH - 4} textAnchor="middle" fontSize={7.5} fill={item.color} fontWeight="800" fontFamily="inherit">
                                      {item.ext.toFixed(1)}%
                                    </text>
                                  )}

                                  {/* Target bar */}
                                  <rect x={x + barW + gap} y={paddingTop + chartH - tgtH} width={barW} height={tgtH} rx={4} fill={item.color} opacity={0.2} stroke={item.color} strokeWidth={1.5} strokeDasharray="4 2" />
                                  {item.tgt > 0 && (
                                    <text x={x + barW + gap + barW / 2} y={paddingTop + chartH - tgtH - 4} textAnchor="middle" fontSize={7.5} fill={item.color} fontWeight="800" fontFamily="inherit" opacity={0.7}>
                                      {item.tgt.toFixed(1)}%
                                    </text>
                                  )}

                                  {/* X label */}
                                  <text x={x + groupW / 2} y={paddingTop + chartH + 16} textAnchor="middle" fontSize={8} fill="currentColor" opacity={0.45} fontWeight="700" fontFamily="inherit">
                                    {item.label.length > 9 ? item.label.slice(0, 9) + "…" : item.label}
                                  </text>

                                  {/* Variance */}
                                  <text x={x + groupW / 2} y={paddingTop + chartH + 29} textAnchor="middle" fontSize={7.5} fill={varCol} fontWeight="900" fontFamily="inherit">
                                    {varSign}{variance.toFixed(1)}%
                                  </text>
                                </g>
                              );
                            })}

                            {/* Baseline */}
                            <line x1={paddingLeft} x2={svgW} y1={paddingTop + chartH} y2={paddingTop + chartH} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
                          </svg>
                        </div>
                      </CardContent>
                    </Card>
                  );
                };

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Chart 1: Overall Asset Classes */}
                      {renderChart(
                        "Asset Class Comparison",
                        "Top-level: Equities vs Debt vs Commodities",
                        [
                          { label: "Equities", ext: existingAlloc.equities_percentage, tgt: targetAlloc.equities_percentage, color: "#a855f7" },
                          { label: "Debt", ext: existingAlloc.debt_securities_percentage, tgt: targetAlloc.debt_securities_percentage, color: "#3b82f6" },
                          { label: "Commodities", ext: existingAlloc.commodities_percentage, tgt: targetAlloc.commodities_percentage, color: "#f59e0b" },
                        ]
                      )}

                      {/* Chart 2: Equities sub-assets */}
                      {renderChart(
                        "Equities — Sub-Asset Breakdown",
                        "Direct Stocks, Mutual Funds, ULIPs & ETFs (Equity)",
                        [
                          { label: "Stocks", ext: existingAlloc.stocks_percentage, tgt: targetAlloc.stocks_percentage ?? 0, color: "#ec4899" },
                          { label: "MF Equity", ext: existingAlloc.mutual_fund_equity_percentage, tgt: targetAlloc.mutual_fund_equity_percentage, color: "#a855f7" },
                          { label: "ULIP Eq.", ext: existingAlloc.ulip_equity_percentage, tgt: targetAlloc.ulip_equity_percentage, color: "#8b5cf6" },
                          { label: "ETF Eq.", ext: existingAlloc.etf_equity_percentage, tgt: targetAlloc.etf_equity_percentage, color: "#c084fc" },
                        ]
                      )}

                      {/* Chart 3: Debt sub-assets */}
                      {renderChart(
                        "Debt Securities — Sub-Asset Breakdown",
                        "FD & Bonds, Mutual Funds, ULIPs & ETFs (Debt)",
                        [
                          { label: "FD & Bonds", ext: existingAlloc.fixed_deposits_bonds_percentage, tgt: targetAlloc.fixed_deposits_bonds_percentage, color: "#06b6d4" },
                          { label: "MF Debt", ext: existingAlloc.mutual_fund_debt_percentage, tgt: targetAlloc.mutual_fund_debt_percentage, color: "#3b82f6" },
                          { label: "ULIP Debt", ext: existingAlloc.ulip_debt_percentage, tgt: targetAlloc.ulip_debt_percentage, color: "#60a5fa" },
                          { label: "ETF Debt", ext: existingAlloc.etf_debt_percentage, tgt: targetAlloc.etf_debt_percentage, color: "#7dd3fc" },
                        ]
                      )}

                      {/* Chart 4: Commodities sub-assets */}
                      {renderChart(
                        "Commodities — Sub-Asset Breakdown",
                        "Gold ETF, Silver ETF & Other Commodity ETFs",
                        [
                          { label: "Gold ETF", ext: existingAlloc.gold_etf_percentage, tgt: targetAlloc.gold_etf_percentage, color: "#f59e0b" },
                          { label: "Silver ETF", ext: existingAlloc.silver_etf_percentage, tgt: targetAlloc.silver_etf_percentage, color: "#d1d5db" },
                          { label: "Other ETF", ext: existingAlloc.etf_commodity_percentage, tgt: targetAlloc.etf_commodity_percentage, color: "#f97316" },
                        ]
                      )}
                    </div>

                    {/* Shared Legend */}
                    <div className="flex gap-6 justify-center text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-primary opacity-80" />
                        <span>Existing (Solid)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm border border-dashed border-primary opacity-50" />
                        <span>Target (Dashed)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-red-500" />
                        <span className="text-red-400">Over-allocated</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400">Under-allocated</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
