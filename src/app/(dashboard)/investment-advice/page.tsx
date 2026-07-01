"use client";

import React, { useState } from "react";
import { FileText, PlusCircle, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { AdviceNoteForm } from "@/features/investment-advice/AdviceNoteForm";
import { AllAdviceNotesList } from "@/features/investment-advice/AllAdviceNotesList";
import { AdviceNoteDetail } from "@/features/investment-advice/AdviceNoteDetail";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { InvestmentAdviceService } from "@/core/services/investment-advice.service";
import type { ClientValidateResponse } from "@/core/services/asset-allocation.service";

type ViewType = "LIST" | "VALIDATE_CLIENT" | "CREATE_FORM" | "EDIT_FORM" | "DETAIL";

export default function InvestmentAdviceDashboardPage() {
  const [view, setView] = useState<ViewType>("LIST");
  const [clientInfo, setClientInfo] = useState<ClientCreate | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);

  const handleStartNew = () => {
    setView("VALIDATE_CLIENT");
    setClientInfo(null);
  };

  const handleClientValidated = async (info: ClientValidateResponse & { client_code: string }) => {
    setLoadingClient(true);
    try {
      const fullClient = await MasterDataService.getClientByCode(info.client_code);
      setClientInfo(fullClient);
      setView("CREATE_FORM");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch full client profile for advice note preparation.");
    } finally {
      setLoadingClient(false);
    }
  };

  const handleSaved = (noteId: string) => {
    setSelectedNoteId(noteId);
    setView("DETAIL");
  };

  const handleCancel = () => {
    setView("LIST");
    setClientInfo(null);
  };

  const handleEditDraft = async (noteId: string) => {
    setLoadingClient(true);
    setSelectedNoteId(noteId);
    try {
      const note = await InvestmentAdviceService.get(noteId);
      const clientCode = note.client_snapshot?.client_code || (note as any).client_code;
      if (!clientCode) throw new Error("No client code on note");
      const fullClient = await MasterDataService.getClientByCode(clientCode);
      setClientInfo(fullClient);
      setView("EDIT_FORM");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load client profile for editing.");
    } finally {
      setLoadingClient(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      
      {/* Header for Creation / Validation / Edit Views */}
      {(view === "VALIDATE_CLIENT" || view === "CREATE_FORM" || view === "EDIT_FORM") && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {view === "VALIDATE_CLIENT" && "Prepare Advice Note — Step 1"}
                {view === "CREATE_FORM" && "Prepare Advice Note — Step 2"}
                {view === "EDIT_FORM" && "Edit Draft Advice Note"}
              </h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                {view === "VALIDATE_CLIENT" && "Validate and verify client identity"}
                {view === "CREATE_FORM" && `Client: ${clientInfo?.client_name ?? ""} (${clientInfo?.client_code ?? ""}) • Configure advice & products`}
                {view === "EDIT_FORM" && `Client: ${clientInfo?.client_name ?? ""} (${clientInfo?.client_code ?? ""}) • Editing draft`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-primary/5"
          >
            ← Back to Vault
          </Button>
        </div>
      )}

      {/* Main View rendering */}
      <div className="animate-in fade-in duration-400">
        {view === "LIST" && (
          <AllAdviceNotesList
            onCreateNew={handleStartNew}
            onSelectNote={(noteId) => {
              setSelectedNoteId(noteId);
              setView("DETAIL");
            }}
            onEditDraft={handleEditDraft}
          />
        )}

        {view === "VALIDATE_CLIENT" && (
          <div className="max-w-2xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6 relative">
            {loadingClient && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <ClientValidator onValidated={handleClientValidated} />
          </div>
        )}

        {view === "CREATE_FORM" && clientInfo && (
          <AdviceNoteForm
            client={clientInfo}
            onSuccess={handleSaved}
            onCancel={handleCancel}
          />
        )}

        {view === "EDIT_FORM" && clientInfo && selectedNoteId && (
          <AdviceNoteForm
            client={clientInfo}
            noteId={selectedNoteId}
            onSuccess={handleSaved}
            onCancel={() => {
              setSelectedNoteId(null);
              setView("LIST");
            }}
          />
        )}

        {view === "DETAIL" && selectedNoteId && (
          <AdviceNoteDetail
            noteId={selectedNoteId}
            onBack={handleCancel}
            onEdit={() => handleEditDraft(selectedNoteId)}
          />
        )}
      </div>

    </div>
  );
}
