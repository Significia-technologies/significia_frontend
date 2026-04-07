"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetAllocationService, ClientValidateResponse } from "@/core/services/asset-allocation.service";
import { toast } from "sonner";

interface ClientValidatorProps {
  
  onValidated: (clientInfo: ClientValidateResponse & { client_code: string }) => void;
}

export function ClientValidator({ onValidated }: ClientValidatorProps) {
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(ClientValidateResponse & { client_code: string }) | null>(null);

  const validate = useCallback(async () => {
    if (!clientCode.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await AssetAllocationService.validateClient(clientCode.trim().toUpperCase());
      const enriched = { ...data, client_code: clientCode.trim().toUpperCase() };
      setResult(enriched);
      if (data.success) {
        onValidated(enriched);
      } else {
        toast.error(data.error || "Client not found");
      }
    } catch {
      toast.error("Validation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientCode, onValidated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") validate();
  };

  const getTierBadgeClass = (tier?: string) => {
    const t = tier?.toLowerCase() || "";
    if (t.includes("aggressive")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t.includes("moderate")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (t.includes("conservative")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 block mb-2">
          Enter Client Code
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
            <Input
              id="client-code-input"
              value={clientCode}
              onChange={(e) => {
                setClientCode(e.target.value.toUpperCase());
                setResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. ABC001"
              className="pl-10 h-11 bg-card/50 border-primary/15 font-mono tracking-wider uppercase text-sm focus:border-primary/40 transition-colors"
              autoComplete="off"
            />
          </div>
          <Button
            id="validate-client-btn"
            onClick={validate}
            disabled={loading || !clientCode.trim()}
            className="h-11 px-6 gap-2 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Validate
          </Button>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            result.success
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          {result.success ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">{result.client_name}</p>
                  <p className="font-mono text-[10px] tracking-widest opacity-50 uppercase">{result.client_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <Badge variant="outline" className={`uppercase font-black text-[9px] tracking-tight ${getTierBadgeClass(result.category_name)}`}>
                    {result.category_name || "Unclassified"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5 opacity-50" />
                  <span className="font-mono text-[10px] opacity-60">{result.registration_number}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-red-500">Client Not Found</p>
                <p className="text-xs text-muted-foreground mt-0.5">{result.error || "No client matches this code."}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
