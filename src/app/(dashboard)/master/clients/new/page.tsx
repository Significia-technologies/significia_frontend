"use client";

import React, { useEffect, useState } from "react";
import ClientRegistrationForm from "@/features/master/ClientRegistration";
import { IAMasterService } from "@/core/services/ia-master.service";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewClientPage() {
  const [connectorId, setConnectorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConnector() {
      try {
        // We need the connectorId to know which DB to write to.
        // Usually, the IA Master has one active connector.
        const connectors = await IAMasterService.listConnectors();
        if (connectors && connectors.length > 0) {
          setConnectorId(connectors[0].id);
        } else {
          toast.error("No active database connector found. Please set up a connector first.");
        }
      } catch (error) {
        toast.error("Failed to load connection settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchConnector();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Initializing Registration System...</p>
      </div>
    );
  }

  if (!connectorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">System Error</h2>
        <p className="text-muted-foreground max-w-md">
          Unable to identify your secure database connector. 
          Please ensure your IA Master profile and database connection are correctly configured.
        </p>
      </div>
    );
  }

  return <ClientRegistrationForm connectorId={connectorId} />;
}
