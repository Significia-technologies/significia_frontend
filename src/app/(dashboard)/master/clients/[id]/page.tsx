"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import ClientDetail from "@/features/master/ClientDetail";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientCreate | null>(null);
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Get connector
        const connectors = await IAMasterService.listConnectors();
        if (!connectors || connectors.length === 0) {
          toast.error("No database connection found.");
          setLoading(false);
          return;
        }
        const connId = connectors[0].id;
        setConnectorId(connId);

        // 2. Get client data
        const data = await MasterDataService.getClient(connId, id as string);
        setClient(data);
      } catch (error) {
        toast.error("Failed to load client profile.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Fetching Secure Profile...</p>
      </div>
    );
  }

  if (!client || !connectorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          We couldn't retrieve the details for this client. 
          Please ensure the client exists in your private database.
        </p>
      </div>
    );
  }

  return <ClientDetail client={client} connectorId={connectorId} />;
}
