"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionnaireManagement } from "@/features/risk-profile/RiskFormBuilder/QuestionnaireManagement";
import { FormBuilderPage } from "@/features/risk-profile/RiskFormBuilder/FormBuilderPage";
import { DynamicRiskForm } from "@/features/risk-profile/CustomRiskForm/DynamicRiskForm";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

type ManagementView = "LIST" | "BUILDER" | "PREVIEW";

/**
 * Manage Risk Protocols Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function ManageProtocolsPage() {
  const [view, setView] = useState<ManagementView>("LIST");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any>(null);
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "owner" && user.role !== "partner") {
      router.replace("/risk-profiles");
    }
  }, [user, router]);

  if (!user || (user.role !== "owner" && user.role !== "partner")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      {/* Main Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view !== "LIST" && (
           <Button
             variant="ghost"
             size="sm"
             onClick={() => { setView("LIST"); setSelectedQuestionnaire(null); }}
             className="mb-4 gap-2 text-xs font-bold uppercase tracking-widest"
           >
             <ChevronLeft className="w-4 h-4" /> Back to Repository
           </Button>
        )}
        {view === "LIST" ? (
          <QuestionnaireManagement
            onAddNew={() => { setSelectedQuestionnaire(null); setView("BUILDER"); }}
            onEdit={(q) => { setSelectedQuestionnaire(q); setView("BUILDER"); }}
            onView={(q) => { setSelectedQuestionnaire(q); setView("PREVIEW"); }}
            onBack={() => (window.location.href = "/risk-profiles")}
          />
        ) : view === "BUILDER" ? (
          <FormBuilderPage
            initialData={selectedQuestionnaire}
            onClose={() => { setView("LIST"); setSelectedQuestionnaire(null); }}
          />
        ) : (
          <DynamicRiskForm
            questionnaire={selectedQuestionnaire}
            onClose={() => setView("LIST")}
            isPreview={true}
          />
        )}
      </div>
    </div>
  );
}
