"use client";

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  FileText, 
  Download,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConnectorService, Connector } from "@/core/services/connector.service";
import { FinancialAnalysisService } from "@/core/services/financial-analysis.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ToolsPage() {
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
      } else {
        toast.error("No active connection found. Please check master settings.");
      }
    } catch (error) {
      console.error("Failed to fetch connector", error);
      toast.error("Cloud connection failed. Please check master settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadForm = async () => {
    if (!connector) {
      toast.error("No active connection found.");
      return;
    }
    try {
      toast.info("Generating form...");
      await FinancialAnalysisService.downloadBlankForm(connector.id);
      toast.success("Form downloaded successfully.");
    } catch (error) {
      toast.error("Failed to download form.");
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
          <p className="text-muted-foreground mt-1">
            Access utility tools and stationary for your practice.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchConnector} disabled={loading} className="hover:rotate-180 transition-transform duration-500">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
              <CardDescription>
                Download printable forms and templates for client meetings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-all group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Financial Analysis Form</p>
                      <p className="text-xs text-muted-foreground">Blank printable PDF data entry form</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleDownloadForm}
                    className="hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="p-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center text-xs text-muted-foreground italic">
                  Additional stationary items coming soon...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholders for future tools */}
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
