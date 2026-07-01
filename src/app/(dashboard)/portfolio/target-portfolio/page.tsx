"use client";

import React, { useState, useEffect } from "react";
import { Search, Users, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MasterDataService, Client } from "@/core/services/master.service";
import { TargetPortfolioService } from "@/core/services/target-portfolio.service";
import { toast } from "sonner";

interface AUARow {
  client_id: string;
  total_aua: number;
  member_count: number;
  latest_version: number;
  has_draft: boolean;
}

export default function TargetPortfolioRoute() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [auaMap, setAuaMap] = useState<Record<string, AUARow>>({});
  const [loadingAua, setLoadingAua] = useState(false);
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newSearch, setNewSearch] = useState("");

  useEffect(() => {
    MasterDataService.listClients({ limit: 500 })
      .then((res) => {
        setClients(res.clients);
        const ids = res.clients.map((c) => c.id);
        if (ids.length) {
          setLoadingAua(true);
          TargetPortfolioService.getAUASummary(ids)
            .then((r) => {
              const map: Record<string, AUARow> = {};
              r.summary.forEach((row) => { map[row.client_id] = row; });
              setAuaMap(map);
            })
            .catch(() => {})
            .finally(() => setLoadingAua(false));
        }
      })
      .catch(() => toast.error("Failed to load client list."))
      .finally(() => setLoadingClients(false));
  }, []);

  // Clients with any portfolio (saved or draft)
  const withPortfolio = clients.filter((c) => auaMap[c.id]);

  // Clients with no portfolio at all — shown in the New Portfolio dialog
  const withoutPortfolio = clients.filter((c) => !auaMap[c.id]);

  const filtered = withPortfolio.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNew = withoutPortfolio.filter(
    (c) =>
      c.client_name.toLowerCase().includes(newSearch.toLowerCase()) ||
      c.client_code.toLowerCase().includes(newSearch.toLowerCase())
  );

  const handleSelect = (c: Client) => {
    router.push(`/portfolio/target-portfolio/${c.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Target Portfolio</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate">Select a client to manage their target portfolio</p>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input
              placeholder="Search by name or code..."
              className="pl-10 h-10 bg-card/50 border-primary/10 font-medium w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            className="h-10 gap-1.5 shrink-0"
            onClick={() => { setNewSearch(""); setShowNewDialog(true); }}
          >
            <Plus className="h-4 w-4" /> New Portfolio
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Contact</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Members</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Version</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Total AUA</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingClients || loadingAua ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-primary/5">
                    <TableCell colSpan={6} className="h-14 bg-muted/10" />
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-30" />
                      <p className="text-xs font-medium uppercase tracking-widest">No portfolios found</p>
                      <p className="text-xs text-muted-foreground/50">Use New Portfolio to create one</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const aua = auaMap[c.id];
                  return (
                    <TableRow
                      key={c.id}
                      className="group hover:bg-primary/5 border-primary/5 transition-colors cursor-pointer"
                      onClick={() => handleSelect(c)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {c.client_name}
                          </span>
                          <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase mt-0.5">
                            {c.client_code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">{c.email || "—"}</span>
                          {c.phone_number && (
                            <span className="text-[10px] text-muted-foreground/60">{c.phone_number}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {aua.member_count > 0 ? (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black ml-auto">
                            {aua.member_count}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black">
                            v{aua.latest_version}
                          </Badge>
                          {aua.has_draft && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {aua.total_aua > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-black text-sm text-primary">
                              ₹{aua.total_aua.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">AUA</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 border border-primary/10 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); handleSelect(c); }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-30">
          Showing {filtered.length} of {withPortfolio.length} clients with portfolios
        </p>
      </div>

      {/* New Portfolio Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Portfolio — Select Client
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Search by name or code..."
                className="pl-10"
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {filteredNew.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Users className="h-6 w-6 opacity-30" />
                  <p className="text-xs">
                    {withoutPortfolio.length === 0
                      ? "All clients already have a portfolio"
                      : "No clients match your search"}
                  </p>
                </div>
              ) : (
                filteredNew.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left"
                    onClick={() => { setShowNewDialog(false); handleSelect(c); }}
                  >
                    <div>
                      <p className="font-semibold text-sm">{c.client_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">{c.client_code}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
