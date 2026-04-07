"use client";

import React, { useState } from "react";
import { TrendingUp, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisList } from "@/features/financial-analysis/AnalysisList";
import { AnalysisForm } from "@/features/financial-analysis/AnalysisForm";
import { AnalysisDashboard } from "@/features/financial-analysis/AnalysisDashboard";
import { FinancialAnalysisService, FinancialAnalysisResult } from "@/core/services/financial-analysis.service";
import { MasterDataService } from "@/core/services/master.service";
import { toast } from "sonner";

type ViewState = "LIST" | "FORM" | "DASHBOARD";

/**
 * Financial Goals/Analysis Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function FinancialAnalysisPage() {
  const [view, setView] = useState<ViewState>("LIST");
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<FinancialAnalysisResult | null>(null);
  const [selectedClientName, setSelectedClientName] = useState("");

  const handleSelectAnalysis = async (resultId: string) => {
    setLoading(true);
    try {
      const result = await FinancialAnalysisService.get(resultId);
      const client = await MasterDataService.getClient(result.client_id);
      setSelectedResult(result);
      setSelectedClientName(client.client_name);
      setView("DASHBOARD");
    } catch {
      toast.error("Failed to load analysis details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = async (resultId: string) => {
    await handleSelectAnalysis(resultId);
  };

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
            <Button
              variant="outline"
              onClick={() => FinancialAnalysisService.downloadBlankForm()}
              className="gap-2 whitespace-nowrap flex-1 sm:flex-none"
            >
              <FileText className="w-4 h-4" />
              Download Form
            </Button>
          )}
        </div>
      </div>

      {view === "LIST" && (
        <AnalysisList
          onSelectAnalysis={handleSelectAnalysis}
          onCreateNew={() => setView("FORM")}
        />
      )}

      {view === "FORM" && (
        <AnalysisForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setView("LIST")}
        />
      )}

      {view === "DASHBOARD" && selectedResult && (
        <AnalysisDashboard
          result={selectedResult}
          clientName={selectedClientName}
        />
      )}
    </div>
  );
}
