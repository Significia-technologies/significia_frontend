"use client";

import React, { useState } from "react";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionnaireManagement } from "@/features/financial-analysis/RiskFormBuilder/QuestionnaireManagement";
import { FormBuilderPage } from "@/features/financial-analysis/RiskFormBuilder/FormBuilderPage";
import { DynamicRiskForm } from "@/features/financial-analysis/CustomRiskForm/DynamicRiskForm";
import Link from "next/link";

type ManagementView = "LIST" | "BUILDER" | "PREVIEW";

/**
 * Manage Risk Protocols Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function ManageProtocolsPage() {
  const [view, setView] = useState<ManagementView>("LIST");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any>(null);

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          {view === "LIST" ? (
            <Link href="/risk-profiles">
              <Button variant="outline" size="icon" className="h-10 w-10 border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl transition-all shadow-sm">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setView("LIST"); setSelectedQuestionnaire(null); }}
              className="h-10 w-10 border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="p-2 rounded-xl bg-primary/10 ml-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase text-primary/80">
              {view === "LIST" ? "FORM REPOSITORY" : view === "BUILDER" ? "SYSTEM ARCHITECT" : "PROTOCOL PREVIEW"}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {view === "LIST" ? "Managing custom risk assessment forms" : view === "BUILDER" ? "Designing strategic inquiry protocols" : "Reviewing architectural definition"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
