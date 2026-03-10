"use client";

import React, { useState, useEffect } from "react";
import { Database, LayoutGrid, List, PlusCircle, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Connector, ConnectorService } from "@/core/services/connector.service";
import { ConnectorSetup } from "@/features/master/ConnectorSetup";
import { ProvisioningView } from "@/features/master/ProvisioningView";
import { CustomerList } from "@/features/master/CustomerList";
import { Skeleton } from "@/components/ui/skeleton";

export default function MasterPage() {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<Connector | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const connectors = await ConnectorService.list();
      if (connectors && connectors.length > 0) {
        setConnector(connectors[0]);
      } else {
        setConnector(null);
      }
    } catch (error) {
      console.error("Failed to fetch connector status", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // State 0: No Connector exists
  if (!connector) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <ConnectorSetup onSuccess={fetchStatus} />
      </div>
    );
  }

  // State 1: Connector exists but not initialized
  if (connector.initialization_status !== "READY") {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <ProvisioningView connector={connector} onSuccess={fetchStatus} />
      </div>
    );
  }

  // State 2: Ready - Show Master Data Workspace
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <Database className="w-8 h-8 text-primary" />
            </span>
            Master Data Repository
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Connected to <span className="font-mono text-primary font-medium">{connector.database_name}</span> inside your private infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-primary/20" onClick={fetchStatus}>
            <RefreshCcw className="w-4 h-4" />
            Sync Status
          </Button>
          <Button className="gap-2 bg-primary/95 hover:bg-primary">
            <PlusCircle className="w-4 h-4" />
            New Entry
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Tabs defaultValue="customers" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50 border border-primary/10 p-1">
              <TabsTrigger value="customers" className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <List className="w-4 h-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 px-6" disabled>
                <LayoutGrid className="w-4 h-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2 px-6" disabled>
                <Database className="w-4 h-4" />
                Vendors
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="customers" className="focus-visible:outline-none focus-visible:ring-0">
            <CustomerList connectorId={connector.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
