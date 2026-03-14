"use client";

import React, { useState, useEffect } from "react";
import { Connector, ConnectorService } from "@/core/services/connector.service";
import { IAMasterForm } from "@/features/master/IAMasterForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { IAMaster, IAMasterService } from "@/core/services/ia-master.service";

export default function NewIAMasterPage() {
  const router = useRouter();
  const [connector, setConnector] = useState<Connector | null>(null);
  const [initialData, setInitialData] = useState<IAMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const connectors = await ConnectorService.list();
        if (connectors && connectors.length > 0) {
          const active = connectors[0];
          if (active.initialization_status === "READY") {
            setConnector(active);
            // Fetch existing data if any
            try {
              const latest = await IAMasterService.getLatest(active.id);
              if (latest) {
                setInitialData(latest);
              }
            } catch (e) {
              // Ignore if no data found (e.g. 404)
              console.log("No existing IA Master data found.");
            }
          } else {
            setError("Database is not initialized. Please go back to Master Repository and initialize it.");
          }
        } else {
          setError("No database connector found. Please set up a connector first.");
        }
      } catch (err) {
        setError("Failed to fetch database connection status.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !connector) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <Alert variant="destructive" className="text-left mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/master")} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Master Repository
        </Button>
      </div>
    );
  }

  return <IAMasterForm connectorId={connector.id} initialData={initialData} />;
}
