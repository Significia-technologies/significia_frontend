"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdviceNoteDetail } from "@/features/investment-advice/AdviceNoteDetail";

export default function TargetAdviceNoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const router = useRouter();

  const handleBack = () => router.push("/investment-advice/target");

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
              View Investment Advice Note
            </h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              SEBI compliance audit document
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

      <AdviceNoteDetail noteId={noteId} onBack={handleBack} />
    </div>
  );
}
