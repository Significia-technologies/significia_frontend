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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  REPORT_GENERATED: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  REPORT_DELIVERED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const PAGE_SIZE = 20;

export function AuditTrailTab() {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [tableFilter, setTableFilter] = useState<string>("");
  const [searchId, setSearchId] = useState("");

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SEBIService.getAuditTrail({
        table_name: tableFilter || undefined,
        record_id: searchId || undefined,
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
  }, [tableFilter, searchId, page]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              Audit Trail
            </CardTitle>
            <CardDescription className="mt-1">
              Field-level change history for SEBI regulatory compliance.
              Every modification is tracked with old/new values and mandatory reasons.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {total} total entries
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Record ID..."
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-9"
            />
          </div>
          <Select value={tableFilter} onValueChange={(val) => { setTableFilter(val === "all" ? "" : val); setPage(0); }}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="iamaster">IA Master</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
              <SelectItem value="report_history">Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs w-[120px]">Timestamp</TableHead>
                    <TableHead className="text-xs w-[100px]">Action</TableHead>
                    <TableHead className="text-xs w-[120px]">Changed By</TableHead>
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
                    <TableRow key={entry.id} className="group hover:bg-muted/20">
                      <TableCell className="py-2">
                        <div className="flex flex-col gap-0.5 font-mono">
                          <div className="flex items-center gap-1.5 text-[10px] text-foreground font-medium">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(entry.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-muted-foreground ml-[18px]">
                            {new Date(entry.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                          <span className="truncate max-w-[120px]" title={entry.user_name || entry.user_id}>
                            {entry.user_name || (entry.user_id?.split('-')[0] || "SYSTEM")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Database className="w-3 h-3 text-primary/50" />
                          <span className="font-mono text-[11px]">{entry.table_name}</span>
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
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.new_value ? (
                          <code className="text-[11px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-mono max-w-[150px] truncate block">
                            {entry.new_value}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.change_reason_type ? (
                          <div className="space-y-0.5">
                            <Badge variant="outline" className="text-[9px] uppercase block w-fit">
                              {CHANGE_REASON_LABELS[entry.change_reason_type as ChangeReasonType] ||
                                entry.change_reason_type}
                            </Badge>
                            {entry.change_reason_text && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {entry.change_reason_text}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.entity_version ? (
                          <Badge variant="outline" className="text-[10px] font-mono">
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
      </CardContent>
    </Card>
  );
}
