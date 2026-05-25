"use client";

import React, { useState, useEffect } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataService, Client } from "@/core/services/master.service";
import { InvestorMasterPage } from "@/features/portfolio/InvestorMasterPage";
import { toast } from "sonner";

export default function InvestorMasterRoute() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    MasterDataService.listClients({ limit: 500 })
      .then((res) => setClients(res.clients))
      .catch(() => toast.error("Failed to load client list."))
      .finally(() => setLoadingClients(false));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedClient) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => setSelectedClient(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to client list
        </button>
        <InvestorMasterPage
          clientId={selectedClient.id}
          clientCode={selectedClient.client_code}
          clientName={selectedClient.client_name}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Investor Master</h1>
        <p className="text-sm text-muted-foreground">Select a client to manage their investor members.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client List */}
      {loadingClients ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Users className="h-10 w-10" />
          <p>No clients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedClient(c)}
            >
              <CardContent className="p-4">
                <p className="font-semibold truncate">{c.client_name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.client_code}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.email}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
