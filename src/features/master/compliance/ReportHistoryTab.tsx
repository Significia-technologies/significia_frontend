"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  User,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SEBIService,
  ReportHistoryEntry,
} from "@/core/services/sebi.service";
import { toast } from "sonner";

const REPORT_TYPE_LABELS: Record<string, string> = {
  risk_assessment: "Risk Assessment",
  asset_allocation: "Asset Allocation",
  financial_analysis: "Financial Analysis",
  ia_master: "IA Master",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  risk_assessment: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  asset_allocation: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  financial_analysis: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  ia_master: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

export function ReportHistoryTab() {
  const [reports, setReports] = useState<ReportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [delivering, setDelivering] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await SEBIService.getReportHistory({
        report_type: typeFilter || undefined,
      });
      setReports(data);
    } catch {
      toast.error("Failed to load report history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [typeFilter]);

  const handleDeliver = async (reportId: string) => {
    setDelivering(reportId);
    try {
      await SEBIService.markReportDelivered(reportId);
      toast.success("Report emailed to client successfully");
      fetchReports();
    } catch {
      toast.error("Failed to mark report as delivered");
    } finally {
      setDelivering(null);
    }
  };

  const formatDateParts = (iso: string) => {
    try {
      const date = new Date(iso);
      return {
        date: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { date: iso, time: "" };
    }
  };

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Report Version History
            </CardTitle>
            <CardDescription className="mt-1">
              Every generated report is versioned automatically. Mark reports as delivered to
              enable lock recommendations.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {reports.length} reports
          </Badge>
        </div>

        <div className="flex gap-3 mt-4">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[200px] h-9">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Report Types</SelectItem>
              <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
              <SelectItem value="asset_allocation">Asset Allocation</SelectItem>
              <SelectItem value="financial_analysis">Financial Analysis</SelectItem>
              <SelectItem value="ia_master">IA Master</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <FileText className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              No reports generated yet. Report versions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <Table style={{ minWidth: '800px' }}>
                <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs w-[140px]">Date</TableHead>
                  <TableHead className="text-xs w-[100px]">Audit ID</TableHead>
                  <TableHead className="text-xs text-center">Version</TableHead>
                  <TableHead className="text-xs">Report Type</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Format</TableHead>
                  <TableHead className="text-xs">Change Summary</TableHead>
                  <TableHead className="text-xs w-[120px]">Delivery</TableHead>
                  <TableHead className="text-xs w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-muted/20">
                    <TableCell className="text-[11px] text-muted-foreground font-mono py-3">
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold uppercase tracking-tight">
                            {formatDateParts(report.created_at).date}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {formatDateParts(report.created_at).time}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px]">
                      {report.short_id ? (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/10">
                          {report.short_id}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/60">
                          {report.id.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        v{report.version_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wider ${
                          REPORT_TYPE_COLORS[report.report_type] || "bg-muted"
                        }`}
                      >
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs py-3">
                      {report.client_name ? (
                        <div className="flex items-start gap-1.5">
                          <User className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {report.client_name}
                            </span>
                            {report.client_code && (
                              <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 rounded inline-block w-fit mt-0.5">
                                {report.client_code}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {report.file_format}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {report.change_summary || "—"}
                    </TableCell>
                    <TableCell>
                      {report.is_delivered ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">Delivered</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!report.is_delivered && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1.5"
                          disabled={delivering === report.id}
                          onClick={() => {
                            if (confirm(`Send this ${report.report_type.replace('_', ' ')} report to the client via email?`)) {
                              handleDeliver(report.id);
                            }
                          }}
                        >
                          <Send className="w-3 h-3" />
                          Email Client
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
