"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  PlusCircle,
  Database,
  Search,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskProfileHistory } from "@/features/financial-analysis/RiskProfileHistory";
import { ConnectorService, Connector } from "@/core/services/connector.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

export default function RiskProfilesPage() {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<Connector | null>(null);

  useEffect(() => {
    fetchConnector();
  }, []);

  const fetchConnector = async () => {
    setLoading(true);
    try {
      const connectors = await ConnectorService.list();
      if (connectors && connectors.length > 0) {
        setConnector(connectors[0]);
      }
    } catch (error) {
      toast.error("Failed to connect to vault.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">No Database Connector Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">Setup a vault connector to access risk profile history.</p>
        <Button onClick={() => window.location.href = "/master"}>Setup Connector</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Risk Repository</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage and retrieve historical client risk assessments.</p>
          </div>
        </div>
        
        <Link href="/financial-analysis">
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <PlusCircle className="w-4 h-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      <RiskProfileHistory connectorId={connector.id} />
    </div>
  );
}
