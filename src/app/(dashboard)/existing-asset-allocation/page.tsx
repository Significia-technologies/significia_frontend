"use client";

import React, { useState } from "react";
import { PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { ClientValidateResponse } from "@/core/services/asset-allocation.service";
import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { ExistingAssetAllocationForm } from "@/features/existing-asset-allocation/ExistingAssetAllocationForm";
import { ExistingAssetAllocationHistory } from "@/features/existing-asset-allocation/ExistingAssetAllocationHistory";

type ViewType = "HISTORY" | "NEW_ALLOCATION";
type NewAllocStep = "VALIDATE" | "FORM";

export default function ExistingAssetAllocationPage() {
  const [view, setView] = useState<ViewType>("HISTORY");
  const [step, setStep] = useState<NewAllocStep>("VALIDATE");
  const [clientInfo, setClientInfo] = useState<(ClientValidateResponse & { client_code: string }) | null>(null);

  const handleStartNew = () => {
    setStep("VALIDATE");
    setClientInfo(null);
    setView("NEW_ALLOCATION");
  };

  const handleClientValidated = (info: ClientValidateResponse & { client_code: string }) => {
    setClientInfo(info);
    setStep("FORM");
  };

  const handleSaved = () => {
    setView("HISTORY");
    setStep("VALIDATE");
    setClientInfo(null);
    toast.success("Existing holdings logged successfully.");
  };

  const handleCancel = () => {
    if (step === "FORM") {
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
                {step === "VALIDATE" ? "Validate Client" : "Valuation Setup"}
              </h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                {step === "VALIDATE" ? "Step 1 — Identify & validate client profile" : "Step 2 — Record current sub-asset holdings"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border border-primary/5"
          >
            ← {step === "FORM" ? "Change Client" : "Back to History"}
          </Button>
        </div>
      )}

      {/* ── Stepper (Only for New Allocation) ── */}
      {view === "NEW_ALLOCATION" && (
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
          <ExistingAssetAllocationHistory onNewAllocation={handleStartNew} />
        ) : step === "VALIDATE" ? (
          <div className="max-w-2xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <ClientValidator onValidated={handleClientValidated} />
          </div>
        ) : clientInfo ? (
          <div className="max-w-4xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <ExistingAssetAllocationForm
              clientInfo={clientInfo}
              onSaved={handleSaved}
              onCancel={handleCancel}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
