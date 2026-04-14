"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CustomCheckbox as Checkbox } from "@/components/ui/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RectificationService } from "@/core/services/rectification.service";
import { MasterDataService, Client } from "@/core/services/master.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateRectificationModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [clientId, setClientId] = useState("");
  const [moduleCode, setModuleCode] = useState<"CLIENT" | "RISK" | "FINANCIAL" | "ASSET">("CLIENT");
  const [isInvestorRequested, setIsInvestorRequested] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && clients.length === 0) {
      MasterDataService.listClients({ limit: 1000 })
        .then((response) => setClients(response.clients))
        .catch(() => toast.error("Failed to load clients"));
    }
  }, [open, clients.length]);

  const handleCreate = async () => {
    if (!clientId) {
      toast.error("Please select a client to rectify.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the rectification.");
      return;
    }

    setLoading(true);
    try {
      const draft = await RectificationService.initiate({
        client_id: clientId,
        module: moduleCode,
        record_id: clientId, // Defaulting pointer to client ID; for finer grain, handle specifically.
        current_version: 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { financial: false, risk: false, asset_allocation: false, portfolio: false },
        confirmation_mode: isInvestorRequested ? "Physical Document" : "Internal Audit",
        is_investor_requested: isInvestorRequested,
        initiation_reason: reason
      });

      toast.success("E-Serial Number Assigned. Draft Created.");
      setOpen(false);
      router.push(`/rectification/${draft.id}`);
    } catch (error) {
      toast.error("Failed to initiate data rectification protocol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-tight shadow-md shadow-primary/20">
          <PlusCircle className="w-4 h-4" />
          <span className="uppercase text-[9px] tracking-widest hidden sm:inline">Initiate Request</span>
          <span className="sm:hidden">Initiate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl sm:max-w-[450px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              New Rectification Draft
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest opacity-60">
              Generate a secure E-Serial number for data changes
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-widest opacity-50">Select Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="border-primary/20 bg-background/50 h-10 font-medium">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="border-primary/20 bg-card min-w-[200px] max-h-60">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                      {c.client_name} <span className="opacity-50 text-[10px]">({c.client_code})</span>
                    </SelectItem>
                  ))}
                  {clients.length === 0 && (
                    <div className="p-2 text-xs opacity-50 italic text-center">Loading or no clients...</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-widest opacity-50">Module Scope</Label>
              <Select value={moduleCode} onValueChange={(val: any) => setModuleCode(val)}>
                <SelectTrigger className="border-primary/20 bg-background/50 h-10 font-bold text-xs uppercase tracking-tight">
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent className="border-primary/20 bg-card">
                  <SelectItem value="CLIENT" className="font-bold text-[10px] uppercase cursor-pointer">Client Master Data</SelectItem>
                  <SelectItem value="RISK" className="font-bold text-[10px] uppercase cursor-pointer">Risk Profiling</SelectItem>
                  <SelectItem value="FINANCIAL" className="font-bold text-[10px] uppercase cursor-pointer">Financial Analysis</SelectItem>
                  <SelectItem value="ASSET" className="font-bold text-[10px] uppercase cursor-pointer">Asset Allocation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[9px] font-bold tracking-widest opacity-50">Reason for Rectification</Label>
              <Textarea 
                placeholder="Explain why this data needs correction..." 
                className="border-primary/20 bg-background/50 text-xs min-h-[80px]"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Checkbox 
                checked={isInvestorRequested} 
                onCheckedChange={(checked) => setIsInvestorRequested(!!checked)}
                id="investor_req"
                className="w-5 h-5 border-primary/30"
              />
              <div className="space-y-0.5">
                <Label htmlFor="investor_req" className="text-[10px] font-black uppercase cursor-pointer">Requested by Investor?</Label>
                <p className="text-[9px] opacity-60 leading-tight">If checked, physical proof of request must be uploaded in the next step.</p>
              </div>
            </div>

          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2 border-t border-primary/5">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-xs uppercase tracking-widest bg-transparent hover:bg-white/5">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={loading || !clientId}
            className="text-xs uppercase tracking-widest gap-2 min-w-[120px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Serial"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
