"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  PlusCircle,
  Database,
  Search,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RiskProfileHistory } from "@/features/financial-analysis/RiskProfileHistory";
import { ConnectorService, Connector } from "@/core/services/connector.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { RiskProfileForm } from "@/features/financial-analysis/RiskProfileForm";
import { FormBuilderPage } from "@/features/financial-analysis/RiskFormBuilder/FormBuilderPage";
import { DynamicRiskForm } from "@/features/financial-analysis/CustomRiskForm/DynamicRiskForm";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { RiskProfileService } from "@/core/services/risk-profile.service";

type ViewState = "HISTORY" | "FORM" | "BUILDER" | "CUSTOM_FORM";

export default function RiskProfilesPage() {
  const [loading, setLoading] = useState(true);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [view, setView] = useState<ViewState>("HISTORY");
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnector();
  }, []);

  useEffect(() => {
    if (connector) {
        loadQuestionnaires();
    }
  }, [connector]);

  const loadQuestionnaires = async () => {
    if (!connector) return;
    try {
        const data = await RiskProfileService.listQuestionnaires(connector.id, "active");
        setQuestionnaires(data);
    } catch (error) {
        console.error("Failed to load questionnaires");
    }
  };

  const fetchConnector = async () => {
    setLoading(true);
    try {
      const connectors = await ConnectorService.list();
      if (connectors && connectors.length > 0) {
        setConnector(connectors[0]);
      }
    } catch (error) {
      toast.error("Failed to connect to vault.");
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

  if (!connector) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">No Database Connector Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">Setup a vault connector to access risk profile history.</p>
        <Button onClick={() => window.location.href = "/master"}>Setup Connector</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 space-y-4">
      {(view === "HISTORY" || view === "FORM") && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            {view === "FORM" && (
              <Button variant="ghost" size="icon" onClick={() => setView("HISTORY")} className="rounded-full shrink-0">
                <History className="w-5 h-5" />
              </Button>
            )}
            <div className="p-2 rounded-xl bg-primary/10">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                {view === "HISTORY" ? "Risk Repository" : "New Assessment"}
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                {view === "HISTORY" ? "Manage and retrieve historical client risk assessments." : "Complete 16 metrics to determine client risk appetite."}
              </p>
            </div>
          </div>
          
          {view === "HISTORY" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView("BUILDER")} className="gap-2 border-primary/20 text-primary">
                  <PlusCircle className="w-4 h-4" />
                  Build Custom Form
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 shadow-lg shadow-primary/20">
                      <PlusCircle className="w-4 h-4" />
                      New Assessment
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border-primary/20">
                  <DropdownMenuItem onClick={() => setView("FORM")} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-3">
                    System "Sample" Form
                  </DropdownMenuItem>
                  {questionnaires.length > 0 && <DropdownMenuSeparator className="bg-primary/10" />}
                  {questionnaires.map(q => (
                    <DropdownMenuItem 
                      key={q.id} 
                      onClick={() => {
                          setSelectedQuestionnaireId(q.id);
                          setView("CUSTOM_FORM");
                      }} 
                      className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-3"
                    >
                      {q.portfolio_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      {view === "HISTORY" ? (
        <RiskProfileHistory connectorId={connector.id} />
      ) : view === "FORM" ? (
        <RiskProfileForm connectorId={connector.id} />
      ) : view === "BUILDER" ? (
        <FormBuilderPage connectorId={connector.id} onClose={() => {
            setView("HISTORY");
            loadQuestionnaires();
        }} />
      ) : view === "CUSTOM_FORM" && selectedQuestionnaireId ? (
        <DynamicRiskForm 
            connectorId={connector.id} 
            questionnaireId={selectedQuestionnaireId} 
            onClose={() => setView("HISTORY")} 
        />
      ) : null}
    </div>
  );
}
