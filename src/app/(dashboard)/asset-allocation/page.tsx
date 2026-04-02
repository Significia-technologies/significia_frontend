"use client";

import React, { useState } from "react";
import { PieChart, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { ClientValidateResponse } from "@/core/services/asset-allocation.service";
import { ClientValidator } from "@/features/asset-allocation/ClientValidator";
import { AssetAllocationForm } from "@/features/asset-allocation/AssetAllocationForm";
import { AssetAllocationHistory } from "@/features/asset-allocation/AssetAllocationHistory";

type ViewType = "HISTORY" | "NEW_ALLOCATION";
type NewAllocStep = "VALIDATE" | "FORM";

/**
 * Asset Allocation Page — Bridge Architecture
 * No connector gate needed — the Bridge handles DB access transparently.
 */
export default function AssetAllocationPage() {
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
    toast.success("Allocation recorded successfully.");
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
    <div className="max-w-7xl mx-auto py-2 px-4 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-primary/10 pb-6 gap-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <PieChart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
              {view === "HISTORY" ? "Asset Allocation" : step === "VALIDATE" ? "New Allocation" : "Allocation Setup"}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              {view === "HISTORY"
                ? "Client portfolio distribution management"
                : step === "VALIDATE"
                ? "Step 1 — Identify & validate client profile"
                : "Step 2 — Configure asset distribution"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === "NEW_ALLOCATION" && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="h-10 px-5 gap-2 hover:bg-primary/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
            >
              ← {step === "FORM" ? "Change Client" : "Back to History"}
            </Button>
          )}
          {view === "HISTORY" && (
            <Button
              id="new-allocation-btn"
              onClick={handleStartNew}
              className="gap-2 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest"
            >
              <PlusCircle className="w-4 h-4" />
              New Allocation
            </Button>
          )}
        </div>
      </div>

      {/* ── Stepper ── */}
      {view === "NEW_ALLOCATION" && (
        <div className="flex items-center gap-2 animate-in fade-in duration-300">
          {[
            { key: "VALIDATE", label: "Validate Client", num: 1 },
            { key: "FORM", label: "Set Allocation", num: 2 },
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
          <AssetAllocationHistory />
        ) : step === "VALIDATE" ? (
          <div className="max-w-2xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <ClientValidator onValidated={handleClientValidated} />
          </div>
        ) : clientInfo ? (
          <div className="max-w-3xl mx-auto rounded-xl border border-primary/10 bg-card/30 backdrop-blur-sm p-6">
            <AssetAllocationForm
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
