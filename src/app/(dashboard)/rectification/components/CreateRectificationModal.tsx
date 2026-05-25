"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlusCircle, FileText, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

import { RectificationService } from "@/core/services/rectification.service";
import { MasterDataService, Client } from "@/core/services/master.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ── Inline Search Combobox (Excel-style font picker) ─────────────────────────
function ClientCombobox({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find((c) => c.id === value);

  // Filtered list — only shows when typing or no selection yet
  const filtered = clients.filter((c) => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return true;
    return (
      c.client_name.toLowerCase().includes(q) ||
      c.client_code.toLowerCase().includes(q) ||
      (c.pan_number || "").toLowerCase().includes(q)
    );
  });

  // When a client is selected, show their name in the field
  // When focused for searching, clear to show typed query
  const displayValue = open ? inputValue : (selectedClient?.client_name ?? "");

  const handleSelect = useCallback(
    (client: Client) => {
      onChange(client.id);
      setInputValue("");
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setInputValue("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    // Clear display value so the user can type — but don't open the list yet.
    // The list only opens once they start typing.
    setInputValue("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    // Only open dropdown when there is actual input
    setOpen(val.length > 0);
    setHighlighted(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputValue("");
      inputRef.current?.blur();
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-idx="${highlighted}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* The input IS the trigger — no separate button */}
      <div className={`flex items-center h-10 rounded-md border px-3 gap-2 transition-all
        ${open ? "border-primary ring-1 ring-primary/20" : "border-primary/20"}
        bg-background/50`}>
        <input
          ref={inputRef}
          value={displayValue}
          onFocus={handleFocus}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedClient ? selectedClient.client_name : "Search by name, code or PAN..."}
          autoComplete="off"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 min-w-0"
        />
        {selectedClient && !open && (
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            {selectedClient.client_code}
          </span>
        )}
        {open && inputValue && (
          <button type="button" onClick={() => { setInputValue(""); inputRef.current?.focus(); }}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {selectedClient && !open && (
          <button type="button" onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown results — appears directly below the input */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-primary/20 bg-card shadow-xl overflow-hidden">
          {/* Result count bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b border-primary/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {filtered.length === clients.length
                ? `${clients.length} clients`
                : `${filtered.length} of ${clients.length} match`}
            </span>
            {inputValue && filtered.length === 0 && (
              <span className="text-[9px] text-destructive font-bold">No match</span>
            )}
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground italic">
                No clients match &quot;{inputValue}&quot;
              </div>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = c.id === value;
                const isHighlighted = idx === highlighted;
                const q = inputValue.trim();

                const highlight = (text: string) => {
                  if (!q) return text;
                  const parts = text.split(new RegExp(`(${q})`, "gi"));
                  return parts.map((part, i) =>
                    part.toLowerCase() === q.toLowerCase() ? (
                      <mark key={i} className="bg-primary/30 text-foreground rounded-sm px-0.5 not-italic">
                        {part}
                      </mark>
                    ) : (
                      part
                    )
                  );
                };

                return (
                  <div
                    key={c.id}
                    data-idx={idx}
                    onMouseEnter={() => setHighlighted(idx)}
                    onMouseDown={(e) => e.preventDefault()} // prevent input blur
                    onClick={() => handleSelect(c)}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-primary/5 last:border-0
                      ${isHighlighted ? "bg-primary/10" : ""}
                      ${isSelected ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {highlight(c.client_name)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {highlight(c.client_code)}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function CreateRectificationModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [clientId, setClientId] = useState("");
  const moduleCode = "CLIENT";
  const [isInvestorRequested, setIsInvestorRequested] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && clients.length === 0) {
      MasterDataService.listClients({ limit: 1000 })
        .then((response) => {
          // Filter to only show active clients for new rectifications
          setClients(response.clients.filter((c: Client) => c.is_active));
        })
        .catch(() => toast.error("Failed to load clients"));
    }
  }, [open, clients.length]);

  useEffect(() => {
    if (!open) {
      setClientId("");
      setReason("");
      setIsInvestorRequested(false);
    }
  }, [open]);

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
        record_id: clientId,
        current_version: 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { 
          financial: false, 
          risk: false, 
          asset_allocation: false, 
          portfolio: false,
          product_basket: false,
          target_portfolio: false,
          other: false
        },
        confirmation_mode: isInvestorRequested ? "Physical Document" : "Internal Audit",
        is_investor_requested: isInvestorRequested,
        initiation_reason: reason,
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
              <ClientCombobox clients={clients} value={clientId} onChange={setClientId} />
              {clients.length === 0 && (
                <p className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Loading clients...
                </p>
              )}
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
                <Label htmlFor="investor_req" className="text-[10px] font-black uppercase cursor-pointer">
                  Requested by Investor?
                </Label>
                <p className="text-[9px] opacity-60 leading-tight">
                  If checked, physical proof of request must be uploaded in the next step.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 pt-2 border-t border-primary/5">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-xs uppercase tracking-widest bg-transparent hover:bg-white/5"
          >
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
