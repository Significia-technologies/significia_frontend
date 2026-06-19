"use client";

import React, { useState, useEffect } from "react";
import { Search, Users, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MasterDataService, Client } from "@/core/services/master.service";
import { TargetPortfolioService } from "@/core/services/target-portfolio.service";
import { toast } from "sonner";

interface AUARow { client_id: string; total_aua: number; member_count: number; }

export default function TargetPortfolioRoute() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [auaMap, setAuaMap] = useState<Record<string, AUARow>>({});
  const [loadingAua, setLoadingAua] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (c: Client) => {
    router.push(`/portfolio/target-portfolio/${c.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase truncate">Target Portfolio</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate">Select a client to manage their target portfolio</p>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
          <Input
            placeholder="Search by name or code..."
            className="pl-10 h-10 bg-card/50 border-primary/10 font-medium w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Total AUA</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingClients ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-primary/5">
                    <TableCell colSpan={5} className="h-14 bg-muted/10" />
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-30" />
                      <p className="text-xs font-medium uppercase tracking-widest">No clients found</p>
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
                        {loadingAua ? (
                          <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground/40" />
                        ) : aua ? (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black ml-auto">
                            {aua.member_count}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {loadingAua ? (
                          <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground/40" />
                        ) : aua ? (
                          <div className="flex flex-col items-end">
                            <span className="font-black text-sm text-primary">
                              ₹{aua.total_aua.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">AUA</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">No portfolio</span>
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
          Showing {filtered.length} of {clients.length} clients
        </p>
      </div>
    </div>
  );
}
