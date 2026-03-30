"use client";

import React, { useState, useEffect } from "react";
import { ConnectorService, Connector } from "@/core/services/connector.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { QuestionnaireManagement } from "@/features/financial-analysis/RiskFormBuilder/QuestionnaireManagement";
import { FormBuilderPage } from "@/features/financial-analysis/RiskFormBuilder/FormBuilderPage";
import { DynamicRiskForm } from "@/features/financial-analysis/CustomRiskForm/DynamicRiskForm";
import { 
  ShieldCheck, 
  History, 
  PlusCircle, 
  Settings, 
  Plus, 
  LayoutGrid,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ManagementView = "LIST" | "BUILDER" | "PREVIEW";

export default function ManageProtocolsPage() {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [view, setView] = useState<ManagementView>("LIST");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<any>(null);

  useEffect(() => {
    async function loadConnector() {
      try {
        const connectors = await ConnectorService.list();
        if (connectors.length > 0) setConnector(connectors[0]);
      } catch (error) {
        toast.error("Failed to load secure context.");
      } finally {
        setLoading(false);
      }
    }
    loadConnector();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!connector) return null;

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          {view === "LIST" ? (
            <Link href="/risk-profiles">
               <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10 border-primary/10 hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-xl transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
            </Link>
          ) : (
            <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setView("LIST");
                  setSelectedQuestionnaire(null);
                }}
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
              {view === "LIST" ? "FORM REPOSITORY" : 
               view === "BUILDER" ? "SYSTEM ARCHITECT" : 
               "PROTOCOL PREVIEW"}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {view === "LIST" ? "Managing custom risk assessment forms" : 
               view === "BUILDER" ? "Designing strategic inquiry protocols" : 
               "Reviewing architectural definition"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Right side is now empty for a cleaner UI, as back button handles all exits */}
        </div>
      </div>

      {/* Main Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === "LIST" ? (
          <QuestionnaireManagement 
            connectorId={connector.id} 
            onAddNew={() => {
              setSelectedQuestionnaire(null);
              setView("BUILDER");
            }}
            onEdit={(q) => {
              setSelectedQuestionnaire(q);
              setView("BUILDER");
            }}
            onView={(q) => {
              setSelectedQuestionnaire(q);
              setView("PREVIEW");
            }}
            onBack={() => window.location.href = "/risk-profiles"}
          />
        ) : view === "BUILDER" ? (
          <FormBuilderPage 
            connectorId={connector.id} 
            initialData={selectedQuestionnaire}
            onClose={() => {
              setView("LIST");
              setSelectedQuestionnaire(null);
            }} 
          />
        ) : (
          <DynamicRiskForm 
            connectorId={connector.id}
            questionnaire={selectedQuestionnaire}
            onClose={() => setView("LIST")}
            isPreview={true}
          />
        )}
      </div>
    </div>
  );
}
