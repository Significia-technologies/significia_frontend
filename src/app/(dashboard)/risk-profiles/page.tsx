"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, PlusCircle, History, Settings, Plus, LayoutGrid, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskProfileHistory } from "@/features/risk-profile/RiskProfileHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RiskProfileForm } from "@/features/risk-profile/RiskProfileForm";
import { DynamicRiskForm } from "@/features/risk-profile/CustomRiskForm/DynamicRiskForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { RiskProfileService } from "@/core/services/risk-profile.service";
import Link from "next/link";

type ViewType = "HISTORY" | "FORM" | "CUSTOM_FORM";

/**
 * Risk Profiles Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function RiskProfilesPage() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>("HISTORY");
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    setLoading(true);
    try {
      const data = await RiskProfileService.listQuestionnaires("active");
      setQuestionnaires(data);
    } catch {
      // Non-fatal — custom questionnaires are optional
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      {view === "HISTORY" ? (
        <RiskProfileHistory 
          onNewAssessment={() => setView("FORM")}
          onNewCustomAssessment={(id) => {
            setSelectedQuestionnaireId(id);
            setView("CUSTOM_FORM");
          }}
          questionnaires={questionnaires}
        />
      ) : view === "CUSTOM_FORM" && selectedQuestionnaireId ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("HISTORY")} className="gap-2 text-xs uppercase font-bold tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Button>
          <DynamicRiskForm questionnaireId={selectedQuestionnaireId} onClose={() => setView("HISTORY")} />
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setView("HISTORY")} className="gap-2 text-xs uppercase font-bold tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Button>
          <RiskProfileForm />
        </div>
      )}
    </div>
  );
}
