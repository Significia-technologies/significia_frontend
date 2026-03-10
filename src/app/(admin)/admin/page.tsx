"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
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
              Active Tenants
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-2xl font-bold">
            --
          </CardDescription>
        </Card>
      </div>

      <div className="rounded-md border h-64 flex items-center justify-center text-muted-foreground bg-muted/10">
        Client list data grid will go here in Phase 2.
      </div>
    </div>
  );
}
