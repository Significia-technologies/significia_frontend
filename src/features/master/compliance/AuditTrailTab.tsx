"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  ArrowUpDown,
  Clock,
  User,
  Database,
  Download,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Loader2,
  X,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SEBIService,
  AuditTrailEntry,
  CHANGE_REASON_LABELS,
  ChangeReasonType,
} from "@/core/services/sebi.service";
import { toast } from "sonner";

const ACTION_COLORS: Record<string, string> = {
  UPDATE: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  CREATE: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  DELETE: "bg-red-500/15 text-red-600 border-red-500/30",
  LOCK: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  UNLOCK: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  EXPORT: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
  REPORT_GENERATED: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  REPORT_DELIVERED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const PAGE_SIZE = 20;

export function AuditTrailTab() {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  // Filtering state
  const [tableFilter, setTableFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Date range state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SEBIService.getAuditTrail({
        table_name: tableFilter || undefined,
        action_type: actionFilter || undefined,
        change_reason_type: reasonFilter || undefined,
        user_name: userSearch || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setEntries(res.entries);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }, [tableFilter, actionFilter, reasonFilter, userSearch, page]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const clearFilters = () => {
    setTableFilter("");
    setActionFilter("");
    setReasonFilter("");
    setUserSearch("");
    setPage(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await SEBIService.exportAuditTrail({
        format: exportFormat,
        table_name: tableFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      toast.success(
        `Audit trail exported as ${exportFormat.toUpperCase()} successfully`
      );
      setIsExportModalOpen(false);
    } catch {
      toast.error(`Failed to export audit trail as ${exportFormat.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  // Quick date range presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    setToDate(fmt(today));

    switch (preset) {
      case "7d":
        setFromDate(fmt(new Date(today.getTime() - 7 * 86400000)));
        break;
      case "30d":
        setFromDate(fmt(new Date(today.getTime() - 30 * 86400000)));
        break;
      case "90d":
        setFromDate(fmt(new Date(today.getTime() - 90 * 86400000)));
        break;
      case "1y":
        setFromDate(
          fmt(
            new Date(
              today.getFullYear() - 1,
              today.getMonth(),
              today.getDate()
            )
          )
        );
        break;
      case "all":
        setFromDate("");
        setToDate("");
        break;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <ScrollText className="w-5 h-5 text-primary" />
              Audit Trail
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Field-level change history for regulatory compliance. Every
              modification is tracked with old/new values and mandatory reasons.
            </p>
          </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 px-2.5 py-0.5 font-medium whitespace-nowrap">
                {total} total entries
              </Badge>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 shadow-sm shadow-primary/20"
                    disabled={exporting}
                  >
                    {exporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Export Report
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[460px] border-primary/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Download className="w-4 h-4 text-primary" />
                    </div>
                    Export Audit Report
                  </DialogTitle>
                  <DialogDescription>
                    Configure the time period and format for your compliance audit trail export.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  {/* Date Range Selection */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Select Time Period
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="from-date" className="text-[10px] ml-1">From Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            id="from-date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="h-9 pl-8 text-xs bg-muted/30"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="to-date" className="text-[10px] ml-1">To Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            id="to-date"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="h-9 pl-8 text-xs bg-muted/30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { label: "Last 7 Days", value: "7d" },
                        { label: "Last 30 Days", value: "30d" },
                        { label: "Last 90 Days", value: "90d" },
                        { label: "Last Year", value: "1y" },
                        { label: "All Time", value: "all" },
                      ].map((preset) => (
                        <Button
                          key={preset.value}
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[10px] px-2.5 font-medium hover:bg-primary/20 hover:text-primary transition-colors"
                          onClick={() => setDatePreset(preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Export Format
                    </Label>
                    <Tabs 
                      value={exportFormat} 
                      onValueChange={(v) => setExportFormat(v as any)}
                      className="w-full"
                    >
                      <TabsList className="grid grid-cols-2 w-full h-14 p-1 bg-muted/50 border border-primary/10">
                        <TabsTrigger 
                          value="csv" 
                          className="flex items-center gap-3 px-4 h-full data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all"
                        >
                          <FileSpreadsheet className="w-5 h-5 shrink-0" />
                          <div className="text-left">
                            <p className="text-[11px] font-bold leading-none">CSV (Excel)</p>
                            <p className="text-[9px] font-normal text-muted-foreground mt-1.5 opacity-80">
                              Tabular spreadsheets
                            </p>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="json" 
                          className="flex items-center gap-3 px-4 h-full data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
                        >
                          <FileJson className="w-5 h-5 shrink-0" />
                          <div className="text-left">
                            <p className="text-[11px] font-bold leading-none">JSON</p>
                            <p className="text-[9px] font-normal text-muted-foreground mt-1.5 opacity-80">
                              Structured data
                            </p>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExportModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={exporting}
                    className="gap-2 min-w-[140px]"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters Section Header */}
        <div className="mt-6 flex flex-col space-y-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 group w-fit transition-all hover:opacity-80 appearance-none bg-transparent border-none p-0 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Filter className={`w-3 h-3 transition-colors ${showFilters ? 'text-primary' : 'text-muted-foreground'}`} />
              Quick Filters
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="p-4 rounded-xl border border-primary/10 bg-muted/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                {/* Changed By Search */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] ml-1 text-muted-foreground">Changed By</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                    <Input
                      placeholder="Person name..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setPage(0);
                      }}
                      className="pl-9 h-9 text-xs bg-background/50 border-primary/5 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Table Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] ml-1 text-muted-foreground">Category</Label>
                  <Select
                    value={tableFilter || "all"}
                    onValueChange={(val) => {
                      setTableFilter(val === "all" ? "" : val);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background/50 border-primary/5 focus-visible:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <SelectValue placeholder="All Tables" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tables</SelectItem>
                      <SelectItem value="iamaster">IA Master</SelectItem>
                      <SelectItem value="clients">Clients</SelectItem>
                      <SelectItem value="report_history">Reports</SelectItem>
                      <SelectItem value="audit_trail">Audit Trail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] ml-1 text-muted-foreground">Action Type</Label>
                  <Select
                    value={actionFilter || "all"}
                    onValueChange={(val) => {
                      setActionFilter(val === "all" ? "" : val);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background/50 border-primary/5 focus-visible:ring-primary/20">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline" className="w-3.5 h-3.5 p-0 rounded-full border-muted-foreground/30" />
                        <SelectValue placeholder="Any Action" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Action</SelectItem>
                      {Object.keys(ACTION_COLORS).map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason Selector */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] ml-1 text-muted-foreground">Change Reason</Label>
                  <Select
                    value={reasonFilter || "all"}
                    onValueChange={(val) => {
                      setReasonFilter(val === "all" ? "" : val);
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background/50 border-primary/5 focus-visible:ring-primary/20">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <SelectValue placeholder="Any Reason" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Reason</SelectItem>
                      {Object.entries(CHANGE_REASON_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                <div className="pb-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-3 text-[11px] gap-2 text-muted-foreground hover:text-primary transition-all rounded-lg whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>


      </div>

      <div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <ScrollText className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              No audit entries found.
              {tableFilter && " Try clearing your filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table style={{ minWidth: '800px' }}>
                  <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs w-[120px]">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-xs w-[100px]">Action</TableHead>
                    <TableHead className="text-xs w-[120px]">
                      Changed By
                    </TableHead>
                    <TableHead className="text-xs w-[100px]">Table</TableHead>
                    <TableHead className="text-xs">Field Changed</TableHead>
                    <TableHead className="text-xs">Old Value</TableHead>
                    <TableHead className="text-xs">New Value</TableHead>
                    <TableHead className="text-xs w-[140px]">Reason</TableHead>
                    <TableHead className="text-xs w-[50px]">Ver</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="group hover:bg-muted/20"
                    >
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5 font-mono">
                          <div className="flex items-center gap-1.5 text-[10px] text-foreground font-medium">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(entry.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground ml-[18px]">
                            {new Date(entry.created_at).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase tracking-wider ${
                            ACTION_COLORS[entry.action_type] || "bg-muted"
                          }`}
                        >
                          {entry.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span
                            className="truncate max-w-[120px]"
                            title={entry.user_name || entry.user_id}
                          >
                            {entry.user_name ||
                              entry.user_id?.split("-")[0] ||
                              "SYSTEM"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Database className="w-3 h-3 text-primary/50" />
                          <span className="font-mono text-[11px]">
                            {entry.table_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground/80">
                        {entry.field_changed || "—"}
                      </TableCell>
                      <TableCell>
                        {entry.old_value ? (
                          <code className="text-[11px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded font-mono max-w-[150px] truncate block">
                            {entry.old_value}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.new_value ? (
                          <code className="text-[11px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-mono max-w-[150px] truncate block">
                            {entry.new_value}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.change_reason_type ? (
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase block w-fit"
                            >
                              {CHANGE_REASON_LABELS[
                                entry.change_reason_type as ChangeReasonType
                              ] || entry.change_reason_type}
                            </Badge>
                            {entry.change_reason_text && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {entry.change_reason_text}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.entity_version ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            v{entry.entity_version}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages} ({total} entries)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
