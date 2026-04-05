"use client";

import { use } from "react";
import ClientDetail from "@/features/master/ClientDetail";
import { MasterDataService } from "@/core/services/master.service";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { ClientCreate } from "@/core/services/master.service";

/**
 * Client Detail Page — Bridge Architecture
 * Fetches client data server-side (via Bridge) and renders ClientDetail.
 */
export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientCreate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    MasterDataService.getClient(id)
      .then(setClient)
      .catch(() => setError("Failed to load client data."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Client Not Found</h2>
        <p className="text-muted-foreground">{error || "This client record could not be found."}</p>
      </div>
    );
  }

  return <ClientDetail client={client} />;
}
