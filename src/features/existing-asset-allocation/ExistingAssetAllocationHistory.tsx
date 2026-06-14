"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  ChevronRight,
  ChevronDown,
  Loader2,
  PlusCircle,
  PieChart,
  IndianRupee,
  TrendingUp,
  Landmark,
  Gem,
  Download
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
import { ExistingAssetAllocationService, ExistingAssetAllocation } from "@/core/services/existing-asset-allocation.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface ExistingAssetAllocationHistoryProps {
  onNewAllocation: () => void;
}

export function ExistingAssetAllocationHistory({ onNewAllocation }: ExistingAssetAllocationHistoryProps) {
  const { user } = useAppStore();
  
  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const canCreate = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Existing Asset Allocation")?.can_create;

  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<ExistingAssetAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadReport = async (item: ExistingAssetAllocation) => {
    setDownloadingId(item.id);
    try {
      await ExistingAssetAllocationService.downloadPDF(
        item.id,
        `Existing_Asset_Allocation_${item.client_code || item.client_id}.pdf`
      );
      toast.success("PDF report downloaded successfully");
    } catch {
      toast.error("Failed to download PDF report");
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleRow = (clientKey: string) => {
    if (expandedClient === clientKey) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientKey);
    }
  };

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const data = await ExistingAssetAllocationService.getAll();
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
      toast.error("Failed to load existing allocation history");
    } finally {
      setLoading(false);
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getAllocBar = (item: ExistingAssetAllocation) => {
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
              title={`${b.label}: ${b.pct.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {bars.map((b, i) => (
            <span key={i} className="text-[9px] font-black tabular-nums" style={{ color: b.color }}>
              {b.pct.toFixed(1)}%
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
            <h2 className="text-2xl font-black tracking-tight text-primary uppercase">
              Existing Asset Allocation
            </h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              Client Portfolio Current Holding Valuations
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
            className="h-10 px-4 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-[10px] font-black uppercase tracking-widest hidden xl:flex text-muted-foreground"
            onClick={async () => {
              setDownloading(true);
              try {
                await ExistingAssetAllocationService.downloadBlankPDF();
                toast.success("Blank form downloaded successfully");
              } catch {
                toast.error("Failed to download blank form");
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Blank Form</span>
          </Button>

          {canCreate && (
            <Button
              id="new-existing-allocation-btn"
              onClick={onNewAllocation}
              className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest px-6"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Existing Entry</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Risk Tier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Total Valuation</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Holding Split</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-primary/5">
                    <TableCell colSpan={6} className="h-16">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">
                    No holding records found.
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
                            );
                          })()}
                        </TableCell>
                        <TableCell className="font-black text-sm text-primary/80">
                          {formatCurrency(a.total_amount)}
                        </TableCell>
                        <TableCell>{getAllocBar(a)}</TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 opacity-40" />
                            {format(new Date(a.created_at), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 gap-1.5 border border-primary/10 hover:bg-primary/5 text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReport(a);
                              }}
                              disabled={downloadingId !== null}
                            >
                              {downloadingId === a.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-red-500" />
                              )}
                              <span className="text-[9px] font-black uppercase tracking-tight text-red-500">Report</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-primary/[0.01] hover:bg-transparent border-primary/5">
                          <TableCell colSpan={6} className="p-6 bg-card/5 backdrop-blur-md border-t border-b border-primary/5">
                            <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                              <div className="flex items-center justify-between border-b border-primary/5 pb-2 mb-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                  Holding History Log — {a.client_name || "Client"}
                                </h4>
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
                                              <span className="font-black text-primary/80">{formatCurrency(historyItem.total_amount)}</span>
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
                                        <div className="flex items-center gap-1.5">
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 px-2 gap-1 border border-primary/5 hover:bg-red-500/10 text-red-500 hover:border-red-500/20 rounded-md transition-all"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadReport(historyItem);
                                            }}
                                            disabled={downloadingId !== null}
                                          >
                                            {downloadingId === historyItem.id ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                              <Download className="w-3.5 h-3.5" />
                                            )}
                                            <span className="text-[9px] font-black uppercase tracking-tight">PDF</span>
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
          Showing {filtered.length} of {allocations.length} holding logs
        </p>
      </div>
    </div>
  );
}
