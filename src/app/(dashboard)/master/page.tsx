"use client";

import React, { useEffect } from "react";
import { Shield, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IAMasterView } from "@/features/master/IAMasterView";
import { BridgeStatusView } from "@/features/master/BridgeStatusView";
import { BridgeService } from "@/core/services/bridge.service";
import { useAppStore } from "@/store/useAppStore";

export default function MasterPage() {
  const { bridgeStatus, setBridgeStatus, tenantName, setTenantName } = useAppStore();

  const fetchBridgeStatus = async () => {
    try {
      const info = await BridgeService.getTenantInfo();
      setBridgeStatus(info.bridge_status);
      setTenantName(info.tenant_name);
    } catch (err) {
      // Domain not resolved as a tenant (e.g., running from localhost as Super Admin)
      // Treat as ACTIVE so Super Admins can navigate freely
      setBridgeStatus("ACTIVE");
    }
  };

  useEffect(() => {
    fetchBridgeStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchBridgeStatus, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Loading skeleton
  if (bridgeStatus === "UNKNOWN") {
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

  // Bridge not active — show status page with installation guide
  if (bridgeStatus !== "ACTIVE") {
    return (
      <BridgeStatusView
        bridgeStatus={bridgeStatus}
        tenantName={tenantName}
        onRefresh={fetchBridgeStatus}
      />
    );
  }

  // Bridge is ACTIVE — show Master Data hub
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </span>
            Master Data
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Secured by your{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Bridge
            </span>{" "}
            — data stays on your server.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-primary/20"
          onClick={fetchBridgeStatus}
        >
          <RefreshCcw className="w-4 h-4" />
          Sync Status
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <IAMasterView />
      </div>
    </div>
  );
}
