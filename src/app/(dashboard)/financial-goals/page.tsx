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
  const [editProfileId, setEditProfileId] = useState<string | undefined>(undefined);

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
    setEditProfileId(undefined); // Clear edit state after success
    await handleSelectAnalysis(resultId);
  };

  const handleEdit = (result: FinancialAnalysisResult) => {
    setEditProfileId(result.profile_id);
    setView("FORM");
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      {view === "LIST" ? (
        <AnalysisList
          onSelectAnalysis={handleSelectAnalysis}
          onCreateNew={() => setView("FORM")}
          onDownloadBlank={() => FinancialAnalysisService.downloadBlankForm()}
        />
      ) : view === "FORM" ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("LIST")} className="gap-2 text-xs uppercase font-bold tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
          <AnalysisForm
            copyFromProfileId={editProfileId}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setView("LIST");
              setEditProfileId(undefined);
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("LIST")} className="gap-2 text-xs uppercase font-bold tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
          {selectedResult && (
            <AnalysisDashboard
              result={selectedResult}
              clientName={selectedClientName}
              onEdit={handleEdit}
            />
          )}
        </div>
      )}
    </div>
  );
}
