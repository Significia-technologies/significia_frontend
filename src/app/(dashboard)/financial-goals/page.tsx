"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ArrowLeft, 
  RefreshCcw,
  PlusCircle,
  Database,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisList } from "@/features/financial-analysis/AnalysisList";
import { AnalysisForm } from "@/features/financial-analysis/AnalysisForm";
import { AnalysisDashboard } from "@/features/financial-analysis/AnalysisDashboard";
import { ConnectorService, Connector } from "@/core/services/connector.service";
import { FinancialAnalysisService, FinancialAnalysisResult } from "@/core/services/financial-analysis.service";
import { MasterDataService, Client } from "@/core/services/master.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";



type ViewState = "LIST" | "FORM" | "DASHBOARD";

export default function FinancialAnalysisPage() {
  const [view, setView] = useState<ViewState>("LIST");
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [selectedResult, setSelectedResult] = useState<FinancialAnalysisResult | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");

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
      console.error("Failed to fetch connector", error);
      toast.error("Cloud connection failed. Please check master settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnalysis = async (resultId: string) => {
    setLoading(true);
    try {
      if (!connector) return;
      const result = await FinancialAnalysisService.get(connector.id, resultId);
      const client = await MasterDataService.getClient(connector.id, result.client_id);
      setSelectedResult(result);
      setSelectedClientName(client.client_name);
      setView("DASHBOARD");
    } catch (error) {
      toast.error("Failed to load analysis details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = async (resultId: string) => {
    await handleSelectAnalysis(resultId);
  };

  if (loading && view === "LIST") {
    return (
      <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!connector) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">No Database Connector Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">You need an active vault connector to store financial analyses.</p>
        <Button onClick={() => window.location.href = "/master"}>Setup Connector</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6">
        <div className="flex items-start sm:items-center gap-4">
          {view !== "LIST" && (
            <Button variant="ghost" size="icon" onClick={() => setView("LIST")} className="rounded-full shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <span className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </span>
              <span className="truncate">Financial Goal Setting</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base leading-relaxed">
              {view === "LIST" && "Analyze client portfolios and generate professional roadmap reports."}
              {view === "FORM" && "Run precise HLV and retirement calculations."}
              {view === "DASHBOARD" && `Detailed analysis for ${selectedClientName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {view === "LIST" && (
            <>
              <Button 
                variant="outline" 
                onClick={() => connector && FinancialAnalysisService.downloadBlankForm(connector.id)} 
                className="gap-2 whitespace-nowrap flex-1 sm:flex-none"
              >
                <FileText className="w-4 h-4" />
                Download Form
              </Button>
            </>
          )}
        </div>
      </div>

      {view === "LIST" && (
        <AnalysisList 
          connectorId={connector.id} 
          onSelectAnalysis={handleSelectAnalysis}
          onCreateNew={() => setView("FORM")}
        />
      )}

      {view === "FORM" && (
        <AnalysisForm 
          connectorId={connector.id} 
          onSuccess={handleCreateSuccess}
          onCancel={() => setView("LIST")}
        />
      )}

      {view === "DASHBOARD" && selectedResult && (
        <AnalysisDashboard 
          connectorId={connector.id} 
          result={selectedResult}
          clientName={selectedClientName}
        />
      )}

    </div>
  );
}
