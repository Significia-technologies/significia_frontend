"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  History,
  FileText,
  Lock,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

import { AuditTrailTab } from "@/features/master/compliance/AuditTrailTab";
import { VersionHistoryTab } from "@/features/master/compliance/VersionHistoryTab";
import { ReportHistoryTab } from "@/features/master/compliance/ReportHistoryTab";
import { LockManagementTab } from "@/features/master/compliance/LockManagementTab";
import { IAMasterService } from "@/core/services/ia-master.service";

export function SEBIComplianceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [iaData, setIaData] = useState<any>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await IAMasterService.getLatest();
        setIaData(data);
      } catch {
        // No IA record — show message
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => router.push("/master")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Audit Log
              </h1>
              {/* <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] uppercase tracking-widest">
                SAFE Design
              </Badge> */}
            </div>
            <p className="text-sm text-muted-foreground mt-2 md:mt-1 md:ml-[52px]">
              Full audit trail, version control, and regulatory transparency for
              IA Master data.
            </p>
          </div>
        </div>

        {/* Lock Status Indicator */}
        {iaData && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
              iaData.is_locked
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
            }`}
          >
            <Lock className="w-4 h-4" />
            {iaData.is_locked ? "Record Locked" : "Record Unlocked"}
            {iaData.version_number && (
              <Badge
                variant="outline"
                className="ml-2 text-[10px] text-muted-foreground"
              >
                v{iaData.version_number}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger
            value="audit"
            className="gap-2 data-[state=active]:bg-background"
          >
            <ScrollText className="w-4 h-4" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger
            value="versions"
            className="gap-2 data-[state=active]:bg-background"
          >
            <History className="w-4 h-4" />
            Version History
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="gap-2 data-[state=active]:bg-background"
          >
            <FileText className="w-4 h-4" />
            Report History
          </TabsTrigger>
          <TabsTrigger
            value="lock"
            className="gap-2 data-[state=active]:bg-background"
          >
            <Lock className="w-4 h-4" />
            Lock Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <AuditTrailTab />
        </TabsContent>

        <TabsContent value="versions">
          <VersionHistoryTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportHistoryTab />
        </TabsContent>

        <TabsContent value="lock">
          <LockManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
