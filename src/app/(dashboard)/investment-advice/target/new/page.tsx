"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { AdviceNoteForm } from "@/features/investment-advice/AdviceNoteForm";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import type { ClientValidateResponse } from "@/core/services/asset-allocation.service";

type ViewType = "VALIDATE_CLIENT" | "CREATE_FORM";

export default function NewTargetAdviceNotePage() {
  const router = useRouter();
  const [view, setView] = useState<ViewType>("VALIDATE_CLIENT");
  const [clientInfo, setClientInfo] = useState<ClientCreate | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);

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
    router.replace(`/investment-advice/target/${noteId}`);
  };

  const handleBack = () => {
    router.push("/investment-advice/target");
  };

  const headerTitle = view === "VALIDATE_CLIENT"
    ? "Prepare Advice Note — Step 1"
    : "Prepare Advice Note — Step 2";

  const headerSub = view === "VALIDATE_CLIENT"
    ? "Validate and verify client identity"
    : `Client: ${clientInfo?.client_name ?? ""} (${clientInfo?.client_code ?? ""}) • Configure advice & products`;

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      {(view === "VALIDATE_CLIENT" || view === "CREATE_FORM") && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-4 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                {headerTitle}
              </h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                {headerSub}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleBack}
            className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-primary/5"
          >
            ← Back to Vault
          </Button>
        </div>
      )}

      <div className="animate-in fade-in duration-400">
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
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  );
}
