"use client";

import React from "react";
import { ClientList } from "@/features/master/ClientList";

export default function ClientsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">
            Manage your investor clients and their private database records.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <ClientList />
      </div>
    </div>
  );
}
