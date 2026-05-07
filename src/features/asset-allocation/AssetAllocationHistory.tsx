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
  Loader2,
  Send,
  PlusCircle,
  RefreshCcw,
  PieChart
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
import { AssetAllocationService, AssetAllocation } from "@/core/services/asset-allocation.service";
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
  const [emailing, setEmailing] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);

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
      setAllocations(data);
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

  const filtered = allocations.filter(
    (a) =>
      a.client_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_risk_tier?.toLowerCase().includes(search.toLowerCase())
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
            <h2 className="text-2xl font-black tracking-tight text-primary uppercase">
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
                filtered.map((a) => (
                  <TableRow key={a.id} className="group hover:bg-primary/5 border-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {a.client_name || "Unknown Client"}
                        </span>
                        <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                          {a.client_code || "N/A"}
                        </span>
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                          onClick={() => downloadFile(a, "PDF")}
                          disabled={!!downloading}
                          id={`dl-pdf-${a.id}`}
                        >
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[9px] font-black uppercase">PDF</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                          onClick={() => downloadFile(a, "DOCX")}
                          disabled={!!downloading}
                          id={`dl-docx-${a.id}`}
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[9px] font-black uppercase">Word</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                          onClick={() => handleEmail(a)}
                          disabled={!!emailing || !!downloading}
                          id={`email-${a.id}`}
                        >
                          {emailing === a.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-[9px] font-black uppercase">Email</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 gap-1.5 border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all text-amber-500"
                          onClick={() => handleInitiateRectification(a)}
                          disabled={!!initiating}
                        >
                          {initiating === a.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[9px] font-black uppercase">Correct</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
