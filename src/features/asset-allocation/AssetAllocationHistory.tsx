"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Landmark,
  Gem,
  ChevronRight,
  ChevronDown,
  Loader2,
  Send,
  PlusCircle,
  RefreshCcw,
  PieChart,
  MoreHorizontal,
  FolderInput,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssetAllocationService, AssetAllocation } from "@/core/services/asset-allocation.service";
import { saveReportToDrawer } from "@/lib/save-to-drawer";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import { RectificationService } from "@/core/services/rectification.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface AssetAllocationHistoryProps {
  onNewAllocation: () => void;
}

export function AssetAllocationHistory({ onNewAllocation }: AssetAllocationHistoryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [emailing, setEmailing] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const toggleRow = (clientKey: string) => {
    if (expandedClient === clientKey) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientKey);
    }
  };

  const handleInitiateRectification = async (item: AssetAllocation) => {
    setInitiating(item.id);
    try {
      const draft = await RectificationService.initiate({
        client_id: item.client_id,
        module: "ASSET",
        record_id: item.id,
        current_version: 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { 
          financial: false, 
          risk: false,
          asset_allocation: false,
          portfolio: false,
          product_basket: false,
          target_portfolio: false,
          other: false
        },
        confirmation_mode: "Data Correction",
        is_investor_requested: false,
        initiation_reason: "Internal rectification initiated from Asset Allocation vault"
      });

      toast.success("Rectification Draft Created (E-Serial No Assigned)");
      router.push(`/rectification/${draft.id}`);
    } catch (error) {
      toast.error("Failed to initiate rectification protocol");
    } finally {
      setInitiating(null);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const data = await AssetAllocationService.getAll();
      const sorted = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      const latestSeen = new Set<string>();
      const allocationsWithLatest = sorted.map(item => {
        const clientKey = item.client_code || item.client_id;
        let isLatest = false;
        if (clientKey && !latestSeen.has(clientKey)) {
          latestSeen.add(clientKey);
          isLatest = true;
        }
        return { ...item, isLatest };
      });

      setAllocations(allocationsWithLatest);
    } catch {
      toast.error("Failed to load allocation history");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (item: AssetAllocation, type: "PDF" | "DOCX") => {
    setDownloading(`${item.id}-${type}`);
    try {
      if (type === "PDF") {
        await AssetAllocationService.downloadPDF(
          item.id,
          `Asset_Allocation_${item.client_code || item.id}.pdf`
        );
      } else {
        await AssetAllocationService.downloadDOCX(
          item.id,
          `Asset_Allocation_${item.client_code || item.id}.docx`
        );
      }
      toast.success(`${type} downloaded successfully`);
    } catch {
      toast.error(`Failed to download ${type}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleEmail = async (item: AssetAllocation) => {
    setEmailing(item.id);
    try {
      await AssetAllocationService.emailAllocation(item.id);
      toast.success("Allocation emailed to client successfully");
    } catch {
      toast.error("Failed to email allocation");
    } finally {
      setEmailing(null);
    }
  };

  const handleSaveToDrawer = async (item: AssetAllocation) => {
    if (savedIds.has(item.id)) return;
    setSaving(item.id);
    try {
      const dateLabel = format(new Date(item.created_at), "dd MMM yyyy");
      await saveReportToDrawer({
        clientId: item.client_id,
        endpoint: API_ENDPOINTS.ASSET_ALLOCATION.PDF(item.id),
        fileName: `Asset_Allocation_${item.client_code || item.id}_${dateLabel.replace(/ /g, "_")}.pdf`,
        documentType: `Asset Allocation - ${(item as any).assigned_risk_tier || "Report"} · ${dateLabel}`,
        category: "Asset Allocation",
        sourceId: item.id,
      });
      setSavedIds((prev) => new Set(prev).add(item.id));
      toast.success("Report saved to client drawer.");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSavedIds((prev) => new Set(prev).add(item.id));
        toast.info("Already saved to drawer.");
      } else {
        toast.error("Failed to save report to drawer.");
      }
    } finally {
      setSaving(null);
    }
  };

  const filtered = allocations.filter(
    (a) =>
      (a.client_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_risk_tier?.toLowerCase().includes(search.toLowerCase())) &&
      (a as any).isLatest
  );

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

  const getAllocBar = (item: AssetAllocation) => {
    const bars = [
      { pct: item.equities_percentage, color: "#ef4444", icon: TrendingUp, label: "Eq" },
      { pct: item.debt_securities_percentage, color: "#3b82f6", icon: Landmark, label: "Dt" },
      { pct: item.commodities_percentage, color: "#f59e0b", icon: Gem, label: "Cm" },
    ].filter((b) => b.pct > 0);

    return (
      <div className="flex items-center gap-2">
        <div className="flex h-2 w-28 rounded-full overflow-hidden bg-muted/20">
          {bars.map((b, i) => (
            <div
              key={i}
              style={{ width: `${b.pct}%`, backgroundColor: b.color }}
              title={`${b.label}: ${b.pct}%`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {bars.map((b, i) => (
            <span key={i} className="text-[9px] font-black tabular-nums" style={{ color: b.color }}>
              {b.pct}%
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <PieChart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              Asset Allocation
            </h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Client Portfolio Distribution Management
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 w-full lg:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input
              placeholder="Search by Code or Name..."
              className="pl-10 h-10 bg-card/50 border-primary/10 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            id="download-blank-form-btn"
            variant="outline"
            className="h-10 px-4 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-[10px] font-black uppercase tracking-widest hidden xl:flex"
            onClick={async () => {
              setDownloading("BLANK");
              try {
                await AssetAllocationService.downloadBlankPDF();
                toast.success("Blank form downloaded successfully");
              } catch {
                toast.error("Failed to download blank form");
              } finally {
                setDownloading(null);
              }
            }}
            disabled={!!downloading}
          >
            {downloading === "BLANK" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Blank Form
          </Button>

          <Button
            id="new-allocation-btn-history"
            onClick={onNewAllocation}
            className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-6"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Allocation</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Risk Tier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Portfolio Split</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Reports</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    <TableCell colSpan={5} className="h-16">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium italic">
                    No asset allocation records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => {
                  const clientKey = a.client_code || a.client_id;
                  const isExpanded = expandedClient === clientKey;
                  return (
                    <React.Fragment key={a.id}>
                      <TableRow className={`group hover:bg-primary/5 border-primary/5 transition-colors ${isExpanded ? "bg-primary/[0.02]" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => toggleRow(clientKey)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-bold text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                  onClick={() => toggleRow(clientKey)}
                                >
                                  {a.client_name || "Unknown Client"}
                                </span>
                                {(a as any).isLatest && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] uppercase font-black px-1.5 py-0 h-4 tracking-widest leading-none shrink-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                                {a.client_code || "N/A"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const styles = getTierStyles(a.assigned_risk_tier);
                            return (
                              <>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "gap-1.5 py-0.5 px-2.5 border uppercase font-black text-[8px] tracking-widest rounded-full shadow-sm transition-all group-hover:shadow-md",
                                    styles.bg,
                                    styles.text,
                                    styles.border
                                  )}
                                >
                                  <span className={cn("w-1 h-1 rounded-full animate-pulse", styles.dot)} />
                                  {a.assigned_risk_tier || "N/A"}
                                </Badge>
                                {a.form_name && (
                                  <span className="text-[8px] text-muted-foreground opacity-40 font-bold ml-1 uppercase whitespace-nowrap">
                                    via {a.form_name}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{getAllocBar(a)}</TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 opacity-40" />
                            {format(new Date(a.created_at), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 gap-1 border rounded-md transition-all ${savedIds.has(a.id) ? "border-teal-500/30 text-teal-500 bg-teal-500/5" : "border-primary/5 hover:bg-teal-500/10 text-teal-500 hover:border-teal-500/20"}`}
                              onClick={() => handleSaveToDrawer(a)}
                              disabled={saving === a.id || savedIds.has(a.id)}
                            >
                              {saving === a.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <FolderInput className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[9px] font-black uppercase tracking-tight">{savedIds.has(a.id) ? "Saved ✓" : "Drawer"}</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border border-primary/10 hover:bg-primary/5 text-muted-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 border-primary/10">
                                <DropdownMenuItem
                                  onClick={() => downloadFile(a, "PDF")}
                                  disabled={!!downloading}
                                  className="gap-2 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-500/10"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="font-bold text-[10px] uppercase tracking-wider">Download PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => downloadFile(a, "DOCX")}
                                  disabled={!!downloading}
                                  className="gap-2 cursor-pointer text-blue-500 hover:text-blue-600 focus:text-blue-600 focus:bg-blue-500/10"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span className="font-bold text-[10px] uppercase tracking-wider">Download Word</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEmail(a)}
                                  disabled={!!emailing || !!downloading}
                                  className="gap-2 cursor-pointer text-emerald-500 hover:text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10"
                                >
                                  {emailing === a.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                  <span className="font-bold text-[10px] uppercase tracking-wider">Email Client</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-primary/[0.01] hover:bg-transparent border-primary/5">
                          <TableCell colSpan={5} className="p-6 bg-card/5 backdrop-blur-md border-t border-b border-primary/5">
                            <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                              <div className="flex items-center justify-between border-b border-primary/5 pb-2 mb-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                  Asset Allocation History Log — {a.client_name || "Client"} ({allocations.filter(item => (item.client_code && item.client_code === a.client_code) || (item.client_id && item.client_id === a.client_id)).length} Records)
                                </h4>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Click actions on any row to manage past allocations</span>
                              </div>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {allocations
                                  .filter(item => (item.client_code && item.client_code === a.client_code) || (item.client_id && item.client_id === a.client_id))
                                  .map((historyItem, idx) => {
                                    const styles = getTierStyles(historyItem.assigned_risk_tier);
                                    return (
                                      <div 
                                        key={historyItem.id} 
                                        className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                                          historyItem.id === a.id 
                                            ? "bg-primary/10 border-primary/20 shadow-sm" 
                                            : "bg-card/20 border-primary/5 hover:bg-card/40"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] ${
                                            historyItem.id === a.id 
                                              ? "bg-primary text-primary-foreground" 
                                              : "bg-muted text-muted-foreground"
                                          }`}>
                                            {idx + 1}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold">{format(new Date(historyItem.created_at), "MMMM dd, yyyy • HH:mm")}</span>
                                              <span className="text-[10px] opacity-40">•</span>
                                              {historyItem.form_name && (
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">via {historyItem.form_name}</span>
                                              )}
                                              {historyItem.id === a.id && (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] uppercase font-black px-1.5 py-0 h-4 leading-none tracking-widest shrink-0">
                                                  Active
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                              <Badge
                                                variant="outline"
                                                className={cn(
                                                  "gap-1.5 py-0.5 px-2.5 border uppercase font-black text-[8px] tracking-tight rounded-full",
                                                  styles.bg,
                                                  styles.text,
                                                  styles.border
                                                )}
                                              >
                                                <span className={cn("w-1 h-1 rounded-full", styles.dot)} />
                                                {historyItem.assigned_risk_tier || "N/A"}
                                              </Badge>
                                              {getAllocBar(historyItem)}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Action buttons inside timeline */}
                                        <div className="flex items-center gap-1.5">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2 gap-1 border border-primary/5 hover:bg-red-500/10 text-red-500 hover:border-red-500/20 rounded-md transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(historyItem, 'PDF');
                                            }}
                                            disabled={!!downloading}
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-tight">PDF</span>
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2 gap-1 border border-primary/5 hover:bg-blue-500/10 text-blue-500 hover:border-blue-500/20 rounded-md transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(historyItem, 'DOCX');
                                            }}
                                            disabled={!!downloading}
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-tight">Word</span>
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 gap-1 border border-primary/5 hover:bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/20 rounded-md transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEmail(historyItem);
                                            }}
                                            disabled={!!emailing || !!downloading}
                                          >
                                            {emailing === historyItem.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Send className="w-3.5 h-3.5" />
                                            )}
                                            <span className="text-[9px] font-black uppercase tracking-tight">Email</span>
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-8 px-2 gap-1 border rounded-md transition-all ${savedIds.has(historyItem.id) ? "border-teal-500/30 text-teal-500 bg-teal-500/5" : "border-primary/5 hover:bg-teal-500/10 text-teal-500 hover:border-teal-500/20"}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSaveToDrawer(historyItem);
                                            }}
                                            disabled={saving === historyItem.id || savedIds.has(historyItem.id)}
                                          >
                                            {saving === historyItem.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <FolderInput className="w-3.5 h-3.5" />
                                            )}
                                            <span className="text-[9px] font-black uppercase tracking-tight">{savedIds.has(historyItem.id) ? "Saved ✓" : "Drawer"}</span>
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-30">
          Showing {filtered.length} of {allocations.length} Allocation Records
        </p>
      </div>
    </div>
  );
}
