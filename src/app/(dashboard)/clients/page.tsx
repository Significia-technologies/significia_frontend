"use client";

import React from "react";
import { Users, List } from "lucide-react";
import { ClientList } from "@/features/master/ClientList";

export default function ClientsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <Users className="w-8 h-8 text-primary" />
            </span>
            Clients
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
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
