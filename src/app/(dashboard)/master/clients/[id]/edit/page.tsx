"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import ClientRegistrationForm from "@/features/master/ClientRegistration";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientCreate | null>(null);
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const connectors = await IAMasterService.listConnectors();
        if (!connectors || connectors.length === 0) {
          toast.error("No database connection found.");
          setLoading(false);
          return;
        }
        const connId = connectors[0].id;
        setConnectorId(connId);

        const data = await MasterDataService.getClient(connId, id as string);
        setClient(data);
      } catch (error) {
        toast.error("Failed to load client data for editing.");
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
        <p className="text-muted-foreground animate-pulse">Loading Client Data...</p>
      </div>
    );
  }

  if (!client || !connectorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground max-w-md">
          Could not load the client details for editing.
        </p>
      </div>
    );
  }

  return (
    <ClientRegistrationForm 
      connectorId={connectorId} 
      initialData={client} 
      clientId={id as string} 
      isEdit={true} 
    />
  );
}
