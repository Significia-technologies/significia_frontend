"use client";

import React, { useState, useEffect } from "react";
import { PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

import type { ClientValidateResponse } from "@/core/services/asset-allocation.service";
import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { ExistingAssetAllocationForm } from "@/features/existing-asset-allocation/ExistingAssetAllocationForm";
import { ExistingAssetAllocationHistory } from "@/features/existing-asset-allocation/ExistingAssetAllocationHistory";
import { ExistingAssetAllocationService, ExistingAssetAllocation } from "@/core/services/existing-asset-allocation.service";

type ViewType = "HISTORY" | "NEW_ALLOCATION";
type NewAllocStep = "VALIDATE" | "FORM";

export default function ExistingAssetAllocationPage() {
  const { user } = useAppStore();
  const router = useRouter();

  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const canRead = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Existing Asset Allocation")?.can_read;

  useEffect(() => {
    if (user && !canRead) {
      router.replace("/");
    }
  }, [user, canRead, router]);

  const [view, setView] = useState<ViewType>("HISTORY");
  const [step, setStep] = useState<NewAllocStep>("VALIDATE");
  const [clientInfo, setClientInfo] = useState<(ClientValidateResponse & { client_code: string }) | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<ExistingAssetAllocation | null>(null);

  if (!user || !canRead) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  const handleStartNew = () => {
    setStep("VALIDATE");
    setClientInfo(null);
    setEditingAllocation(null);
    setView("NEW_ALLOCATION");
  };

  const handleClientValidated = (info: ClientValidateResponse & { client_code: string }) => {
    setClientInfo(info);
    setStep("FORM");
  };

  const handleEditDraft = async (allocation: ExistingAssetAllocation) => {
    const clientCode = allocation.client_code || "";
    if (!clientCode) {
      toast.error("Client code not found on the draft allocation");
      return;
    }

    try {
      toast.loading("Loading client profile details...", { id: "edit-draft-loading" });
      const clientData = await ExistingAssetAllocationService.validateClient(clientCode);
      
      if (clientData && clientData.success) {
        setClientInfo({
          ...clientData,
          client_code: clientCode
        });
        setEditingAllocation(allocation);
        setStep("FORM");
        setView("NEW_ALLOCATION");
        toast.success("Draft holdings loaded successfully.", { id: "edit-draft-loading" });
      } else {
        toast.error("Failed to load client profile details", { id: "edit-draft-loading" });
      }
    } catch {
      toast.error("Error loading client profile details", { id: "edit-draft-loading" });
    }
  };

  const handleSaved = () => {
    setView("HISTORY");
    setStep("VALIDATE");
    setClientInfo(null);
    setEditingAllocation(null);
    toast.success("Existing holdings logged successfully.");
  };

  const handleCancel = () => {
    if (editingAllocation) {
      setView("HISTORY");
      setStep("VALIDATE");
      setClientInfo(null);
      setEditingAllocation(null);
    } else if (step === "FORM") {
      setStep("VALIDATE");
      setClientInfo(null);
    } else {
      setView("HISTORY");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      {/* ── New Allocation View Header ── */}
      {view === "NEW_ALLOCATION" && (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-4 animate-in fade-in duration-500">
           <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <PieChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                {editingAllocation ? "Edit Draft Valuation" : step === "VALIDATE" ? "Validate Client" : "Valuation Setup"}
              </h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                {editingAllocation ? "Modify draft holdings to match client profile" : step === "VALIDATE" ? "Step 1 — Identify & validate client profile" : "Step 2 — Record current sub-asset holdings"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-primary/5"
          >
            ← {(step === "FORM" && !editingAllocation) ? "Change Client" : "Back to History"}
          </Button>
        </div>
      )}

      {/* ── Stepper (Only for New Allocation) ── */}
      {view === "NEW_ALLOCATION" && !editingAllocation && (
        <div className="flex items-center gap-2 animate-in fade-in duration-300">
          {[
            { key: "VALIDATE", label: "Validate Client", num: 1 },
            { key: "FORM", label: "Set Valuation", num: 2 },
          ].map((s, i) => {
            const isActive = step === s.key;
            const isDone = step === "FORM" && s.key === "VALIDATE";
            return (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground opacity-40"}`}>
                    {isDone ? "✓" : s.num}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? "text-foreground" : "text-muted-foreground opacity-40"}`}>
                    {s.label}
                  </span>
                </div>
                {i < 1 && <div className="flex-1 h-px bg-primary/10" />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Content ── */}
      <div className="animate-in fade-in duration-400">
        {view === "HISTORY" ? (
          <ExistingAssetAllocationHistory 
            onNewAllocation={handleStartNew} 
            onEditDraft={handleEditDraft}
          />
        ) : step === "VALIDATE" ? (
          <div className="max-w-2xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <ClientValidator onValidated={handleClientValidated} />
          </div>
        ) : clientInfo ? (
          <div className="max-w-4xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <ExistingAssetAllocationForm
              clientInfo={clientInfo}
              editData={editingAllocation || undefined}
              onSaved={handleSaved}
              onCancel={handleCancel}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
