"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Building2, Activity, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BridgeService, BridgeOverview, BillingStats } from "@/core/services/bridge.service";

/**
 * Super Admin Dashboard
 * Uses the Bridge billing overview (not legacy connector list).
 */
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [bridges, setBridges] = useState<BridgeOverview[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bridgeList, billingStats] = await Promise.all([
          BridgeService.getAllBridges().catch(() => []),
          BridgeService.getBillingStats().catch(() => null),
        ]);
        setBridges(bridgeList);
        setStats(billingStats);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    REGISTERED: "bg-blue-100 text-blue-800",
    PENDING: "bg-amber-100 text-amber-800",
    OFFLINE: "bg-red-100 text-red-800",
    REVOKED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bridge Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor all IA tenants and their Bridge connections.
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Provision New IA Tenant
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : (stats?.total_tenants ?? bridges.length)}
          </CardDescription>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bridges</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : (stats?.active_bridges ?? bridges.filter(b => b.bridge_status === "ACTIVE").length)}
          </CardDescription>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : (stats?.total_clients_across_all_ias ?? "—")}
          </CardDescription>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Bridges</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : bridges.filter(b => b.bridge_status === "OFFLINE").length}
          </CardDescription>
        </Card>
      </div>

      {/* Bridge Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Bridge Status</TableHead>
              <TableHead>Bridge Token</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : bridges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No tenants found. Provision a new one.
                </TableCell>
              </TableRow>
            ) : (
              bridges.map((bridge) => (
                <TableRow key={bridge.tenant_id}>
                  <TableCell className="font-medium">{bridge.tenant_name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {bridge.custom_domain || (bridge.subdomain ? `${bridge.subdomain}.significia.com` : "—")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{bridge.billing_plan || "Standard"}</Badge>
                  </TableCell>
                  <TableCell>
                    {bridge.current_client_count ?? 0} / {bridge.max_client_permit ?? 10}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[bridge.bridge_status] || "bg-gray-100 text-gray-700"}`}>
                      {bridge.bridge_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {bridge.bridge_registration_token ? (
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded max-w-[120px] truncate">
                          {bridge.bridge_registration_token}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(bridge.bridge_registration_token!);
                            alert("Token copied to clipboard!");
                          }}
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Registered</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        disabled={bridge.bridge_status !== "ACTIVE"}
                        onClick={async () => {
                          if (confirm(`Initialize database for ${bridge.tenant_name}? This will create all core tables.`)) {
                            try {
                              const res = await BridgeService.initializeBridge(bridge.tenant_id);
                              alert(res.message || "Database initialized successfully!");
                            } catch (err: any) {
                              alert(`Failed to initialize: ${err.response?.data?.detail || err.message}`);
                            }
                          }
                        }}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Initialize DB
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
