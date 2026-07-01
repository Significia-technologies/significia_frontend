"use client";

import React, { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

import { AdviceNoteForm } from "@/features/investment-advice/AdviceNoteForm";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { InvestmentAdviceService } from "@/core/services/investment-advice.service";

export default function EditTargetAdviceNotePage() {
  const router = useRouter();
  const { noteId } = useParams<{ noteId: string }>();
  
  const [clientInfo, setClientInfo] = useState<ClientCreate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDraftData = async () => {
      if (!noteId) return;
      try {
        setLoading(true);
        const note = await InvestmentAdviceService.get(noteId);
        
        // Prevent editing if it's already locked (SEBI Compliance)
        if (note.is_locked) {
          toast.error("This Advice Note is locked and cannot be edited.");
          router.replace(`/investment-advice/target/${noteId}`);
          return;
        }

        const clientCode = note.client_snapshot?.client_code || (note as any).client_code;
        if (!clientCode) {
          throw new Error("No client code found on the advice note.");
        }
        
        const fullClient = await MasterDataService.getClientByCode(clientCode);
        setClientInfo(fullClient);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load draft advice note or client profile.");
        router.push("/investment-advice/target");
      } finally {
        setLoading(false);
      }
    };

    loadDraftData();
  }, [noteId, router]);

  const handleSaved = (savedNoteId: string) => {
    router.replace(`/investment-advice/target/${savedNoteId}`);
  };

  const handleBack = () => {
    router.push(`/investment-advice/target/${noteId}`);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Edit Draft Advice Note
            </h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {loading
                ? "Loading details..."
                : `Client: ${clientInfo?.client_name ?? ""} (${clientInfo?.client_code ?? ""}) • Editing draft`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleBack}
          className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-primary/5"
        >
          ← Back to Detail
        </Button>
      </div>

      <div className="animate-in fade-in duration-400">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          clientInfo && (
            <AdviceNoteForm
              client={clientInfo}
              noteId={noteId}
              onSuccess={handleSaved}
              onCancel={handleBack}
            />
          )
        )}
      </div>
    </div>
  );
}
