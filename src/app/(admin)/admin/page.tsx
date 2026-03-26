"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import apiClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [iaMasters, setIaMasters] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all active tenants (connectors)
        const { data: connectorsList } = await apiClient.get<any[]>(API_ENDPOINTS.CONNECTORS.LIST);
        setConnectors(connectorsList || []);
        
        // For each connector, fetch its IA Master details
        const iaMasterPromises = (connectorsList || []).map(async (connector: any) => {
          try {
            const endpoint = API_ENDPOINTS.MASTER.IA_MASTER.LATEST
              ? API_ENDPOINTS.MASTER.IA_MASTER.LATEST(connector.id)
              : `/ia-master/latest?connector_id=${connector.id}`; // fallback
            const { data: latestIa } = await apiClient.get(endpoint);
            return { id: connector.id, data: latestIa };
          } catch (err) {
            console.error(`Failed to fetch IA master for connector ${connector.id}`, err);
            return { id: connector.id, data: null };
          }
        });
        
        const iaMasterResults = await Promise.all(iaMasterPromises);
        const iaMasterMap = iaMasterResults.reduce((acc: Record<string, any>, result: any) => {
          acc[result.id] = result.data;
          return acc;
        }, {} as Record<string, any>);
        
        setIaMasters(iaMasterMap);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients & Tenants</h1>
          <p className="text-muted-foreground mt-2">
            Manage your onboarded companies and their operational workspaces.
          </p>
        </div>
        
        <Link href="/admin/clients/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Provision New Client
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Placeholder Stat Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tenants (Connectors)
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : connectors.length}
          </CardDescription>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registered IA Masters
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-16" /> : Object.values(iaMasters).filter(Boolean).length}
          </CardDescription>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant/Connector</TableHead>
              <TableHead>IA Master Name</TableHead>
              <TableHead>Registration Number</TableHead>
              <TableHead>Client Count / Max</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : connectors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No clients/tenants found. Provision a new one.
                </TableCell>
              </TableRow>
            ) : (
              connectors.map((connector: any) => {
                const iaMaster = iaMasters[connector.id];
                return (
                  <TableRow key={connector.id}>
                    <TableCell className="font-medium">{connector.name}</TableCell>
                    <TableCell>{iaMaster?.name_of_ia || <span className="text-muted-foreground italic">Not configured</span>}</TableCell>
                    <TableCell>{iaMaster?.ia_registration_number || "-"}</TableCell>
                    <TableCell>
                      {iaMaster ? (
                        <span>{iaMaster.current_client_count || 0} / {iaMaster.max_client_permit || 10}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${connector.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {connector.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
