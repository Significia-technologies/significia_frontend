"use client";

import React, { useState, useEffect } from "react";
import { Wrench, FileText, Download, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FinancialAnalysisService } from "@/core/services/financial-analysis.service";
import { MasterDataService } from "@/core/services/master.service";
import { RiskProfileService } from "@/core/services/risk-profile.service";
import { AssetAllocationService } from "@/core/services/asset-allocation.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/**
 * Advisor Tools Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function ToolsPage() {
  const [loading, setLoading] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<any[]>([
    { id: "sample-form", portfolio_name: "Strategic Risk Assessment (Sample)", is_system: true },
  ]);

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    setLoading(true);
    try {
      const data = await RiskProfileService.listQuestionnaires();
      const activeCustoms = data.filter((q: any) => q.status === "active");
      setQuestionnaires([
        { id: "sample-form", portfolio_name: "Strategic Risk Assessment (Sample)", is_system: true },
        ...activeCustoms,
      ]);
    } catch {
      // If questionnaires fail, show the system default only — non-fatal
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm = async () => {
    try {
      toast.info("Generating form...");
      await FinancialAnalysisService.downloadBlankForm();
      toast.success("Form downloaded successfully.");
    } catch {
      toast.error("Failed to download form.");
    }
  };

  const handleDownloadClientForm = async () => {
    try {
      toast.info("Generating form...");
      await MasterDataService.downloadBlankForm();
      toast.success("Client Registration form downloaded successfully.");
    } catch {
      toast.error("Failed to download client form.");
    }
  };

  const handleDownloadProtocol = async (qId: string, name: string) => {
    try {
      toast.info(`Generating ${name}...`);
      await RiskProfileService.downloadBlankPDF(qId, `Risk_Form_${name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Protocol downloaded successfully.");
    } catch {
      toast.error("Failed to download protocol.");
    }
  };

  const handleDownloadAssetAllocationForm = async () => {
    try {
      toast.info("Generating form...");
      await AssetAllocationService.downloadBlankPDF();
      toast.success("Asset Allocation form downloaded successfully.");
    } catch {
      toast.error("Failed to download asset allocation form.");
    }
  };

  const handleDownloadLetterhead = async () => {
    try {
      toast.info("Generating letterhead...");
      await MasterDataService.downloadLetterhead();
      toast.success("Letterhead downloaded successfully.");
    } catch {
      toast.error("Failed to download letterhead.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-primary/10">
              <Wrench className="w-8 h-8 text-primary" />
            </span>
            Advisor Tools
          </h1>
          <p className="text-muted-foreground mt-1">Access utility tools and stationary for your practice.</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchQuestionnaires} disabled={loading} className="hover:rotate-180 transition-transform duration-500">
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stationary Card */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-primary" />
                Stationary
              </CardTitle>
              <CardDescription>Download printable forms and templates for client meetings.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { label: "Client Registration Form", desc: "Complete blank KYC & registration form", handler: handleDownloadClientForm },
                  { label: "Financial Analysis Form", desc: "Blank printable PDF data entry form", handler: handleDownloadForm },
                  { label: "Asset Allocation Form", desc: "Strategic portfolio distribution template", handler: handleDownloadAssetAllocationForm },
                  { label: "Blank Letterhead Form", desc: "Advisor letterhead format with logo & credentials", handler: handleDownloadLetterhead },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-all group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={item.handler} className="hover:bg-primary/20 hover:text-primary transition-colors" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="p-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center text-xs text-muted-foreground italic">
                  Additional stationary items coming soon...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment Protocols Card */}
          <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-xl bg-card/40 backdrop-blur-sm">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-xl text-primary">
                <ShieldCheck className="w-5 h-5" />
                Strategic Protocols
              </CardTitle>
              <CardDescription>System-certified and custom risk assessment frameworks.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {questionnaires.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-background/50 hover:bg-primary/5 transition-all group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${q.is_system ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"} group-hover:scale-110 transition-transform`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[13px] uppercase tracking-tight">{q.portfolio_name}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase">{q.is_system ? "System Default" : "Custom Protocol"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadProtocol(q.id, q.portfolio_name)} className="h-9 w-9 hover:bg-primary/20 hover:text-primary transition-colors rounded-lg" title="Download Blank PDF">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {questionnaires.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground italic border-2 border-dashed border-primary/5 rounded-xl">
                    No active protocols found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholders */}
          <Card className="overflow-hidden border border-dashed opacity-60">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-lg">Calculator Toolkit</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden border border-dashed opacity-60">
            <CardHeader>
              <CardTitle className="text-muted-foreground text-lg">Marketing Assets</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
