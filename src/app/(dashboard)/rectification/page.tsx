"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  Search, 
  FileText, 
  PlusCircle, 
  AlertCircle,
  ArrowRight,
  Clock,
  History,
  FileSignature,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RectificationService, RectificationResponse } from "@/core/services/rectification.service";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { CreateRectificationModal } from "./components/CreateRectificationModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DataRectificationPage() {
  const [loading, setLoading] = useState(true);
  const [rectifications, setRectifications] = useState<RectificationResponse[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadRectifications();
  }, [page, debouncedSearch, pageSize]);

  const loadRectifications = async () => {
    setLoading(true);
    try {
      const response = await RectificationService.list({
        page,
        limit: pageSize,
        search: debouncedSearch
      });
      setRectifications(response.records);
      setTotal(response.total);
    } catch (error) {
      toast.error("Failed to load rectification records");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED" || status === "COMPLETED") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold tracking-tighter uppercase text-[9px]">
          Authorized
        </Badge>
      );
    }
    if (status === "UPDATED") {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold tracking-tighter uppercase text-[9px]">
          Awaiting Auth
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold tracking-tighter uppercase text-[9px]">
        Draft
      </Badge>
    );
  };

  const getModuleBadge = (module: string) => {
    const colors: Record<string, string> = {
      RISK: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      FINANCIAL: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      CLIENT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      ASSET: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
    };
    return (
      <Badge variant="outline" className={`font-bold tracking-tighter uppercase text-[9px] ${colors[module] || ""}`}>
        {module}
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <ClipboardCheck className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
              Data Rectification
            </h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
              <History className="w-3 h-3" /> E-Serial No Authorization Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground opacity-50 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by Serial, Module or Client..." 
              className="pl-9 h-9 bg-card/50 border-primary/10 rounded-lg font-bold uppercase text-[9px] tracking-widest focus-visible:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CreateRectificationModal />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <Card className="border-primary/10 bg-card/30 backdrop-blur-xl border shadow-2xl overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow className="hover:bg-transparent border-primary/10 border-b">
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60">Serial Number</TableHead>
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60">Module Scope</TableHead>
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60">Record Pointer</TableHead>
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60">State</TableHead>
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60">Initiated On</TableHead>
                  <TableHead className="py-3 px-4 text-[9px] font-bold uppercase tracking-widest text-primary/60 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse border-primary/5">
                      <TableCell colSpan={6} className="h-12 bg-muted/5 px-4" />
                    </TableRow>
                  ))
                ) : rectifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center bg-muted/5">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <AlertCircle className="w-12 h-12" />
                        <p className="font-bold uppercase tracking-[0.2em] text-[10px]">No rectification records discovered</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rectifications.map((r) => (
                    <TableRow key={r.id} className="group hover:bg-primary/5 border-primary/5 transition-all duration-300">
                      <TableCell className="px-4 py-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span className="font-semibold text-xs tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {r.serial_no}
                            </span>
                          </div>
                          {r.client_name && (
                            <span className="text-[8px] font-bold uppercase opacity-40 ml-3.5 mt-0.5 tracking-tighter">
                              {r.client_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {getModuleBadge(r.module)}
                      </TableCell>
                      <TableCell className="px-4 py-2 font-mono text-[9px] opacity-60">
                        {r.record_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        {getStatusBadge(r.status)}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-[10px] font-semibold text-muted-foreground tabular-nums">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 opacity-40" />
                          {format(new Date(r.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-right pr-6">
                        <Link href={`/rectification/${r.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3 gap-2 border border-transparent hover:border-primary/20 hover:bg-primary/5 group"
                          >
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              {r.status === "DRAFT" ? "Resume" : "View"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between bg-card/20 border border-primary/5 rounded-xl px-4 py-3">
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
              Showing <span className="text-foreground">{rectifications.length}</span> of <span className="text-foreground">{total}</span> records
            </p>
            
            <div className="h-4 w-px bg-primary/10" />
            
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Per Page:</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(val) => {
                  setPageSize(parseInt(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[70px] text-[10px] font-bold border-primary/10 bg-card/50 focus:ring-primary/20">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/10 min-w-[70px]">
                  <SelectItem value="10" className="text-[10px] font-bold uppercase cursor-pointer">10</SelectItem>
                  <SelectItem value="25" className="text-[10px] font-bold uppercase cursor-pointer">25</SelectItem>
                  <SelectItem value="50" className="text-[10px] font-bold uppercase cursor-pointer">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-primary/10 bg-card/50 hover:bg-primary/5 disabled:opacity-20 transition-all shadow-sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </Button>
            
            <div className="flex items-center gap-1.5 px-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Page</span>
              <span className="text-[10px] font-black tabular-nums text-primary">{page}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">of {totalPages || 1}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-primary/10 bg-card/50 hover:bg-primary/5 disabled:opacity-20 transition-all"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="flex items-center justify-between px-2 opacity-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Draft: Pending Authorization / Proof</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Completed: Data Correction Authorized</span>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em]">
          Secured SEBI-Compliant Audit Log
        </p>
      </div>
    </div>
  );
}
