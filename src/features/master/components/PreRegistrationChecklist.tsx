"use client";

import React from "react";
import { 
  CheckCircle2, 
  Download
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MasterDataService } from "@/core/services/master.service";
import { toast } from "sonner";

interface PreRegistrationChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function PreRegistrationChecklist({ 
  isOpen, 
  onClose, 
  onProceed 
}: PreRegistrationChecklistProps) {
  const [acknowledged, setAcknowledged] = React.useState({
    ckyc: false,
    docs: false,
    ipv: false
  });

  const allAcknowledged = acknowledged.ckyc && acknowledged.docs && acknowledged.ipv;

  const handleToggle = (id: keyof typeof acknowledged) => {
    setAcknowledged(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadBlankForm = async () => {
    try {
      await MasterDataService.downloadBlankForm();
      toast.success("Blank Registration Form downloaded!");
    } catch (error) {
      toast.error("Failed to download blank form");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2.5 mb-1.5 text-primary">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ClipboardCheckIcon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Onboarding Prerequisites</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Complete the checklist below to proceed with the registration.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {/* CKYC Requirement */}
            <div 
              onClick={() => handleToggle('ckyc')}
              className={`flex gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                acknowledged.ckyc 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-emerald-500/5 border-emerald-500/10 grayscale hover:grayscale-0'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                  acknowledged.ckyc ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-500/30'
                }`}>
                  {acknowledged.ckyc && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-sm font-bold transition-colors ${acknowledged.ckyc ? 'text-emerald-500' : 'text-foreground'}`}>
                  CKYC Verification
                </h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Confirm client has a 14-digit CKYC number with <span className="font-bold text-emerald-500/80">Verified Status</span>.
                </p>
              </div>
            </div>

            {/* Documents Requirement */}
            <div 
              onClick={() => handleToggle('docs')}
              className={`flex gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                acknowledged.docs 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-primary/5 border-primary/10 grayscale hover:grayscale-0'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                  acknowledged.docs ? 'bg-primary border-primary text-white' : 'border-primary/30'
                }`}>
                  {acknowledged.docs && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-sm font-bold transition-colors ${acknowledged.docs ? 'text-primary' : 'text-foreground'}`}>
                  Mandatory Documents
                </h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Ensure <span className="text-foreground">PAN, Aadhaar, Proofs</span>, and <span className="text-primary font-bold">Signed Agreement</span> are ready for upload.
                </p>
              </div>
            </div>

            {/* IPV Requirement */}
            <div 
              onClick={() => handleToggle('ipv')}
              className={`flex gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                acknowledged.ipv 
                  ? 'bg-amber-500/10 border-amber-500/20' 
                  : 'bg-amber-500/5 border-amber-500/10 grayscale hover:grayscale-0'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                  acknowledged.ipv ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-500/30'
                }`}>
                  {acknowledged.ipv && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className={`text-sm font-bold transition-colors ${acknowledged.ipv ? 'text-amber-500' : 'text-foreground'}`}>
                  In-Person Verification
                </h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  IPV must be completed by <span className="text-amber-500 font-bold">staff</span>. Need staff name and completion date.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/30 border border-primary/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-background/50 text-muted-foreground shrink-0">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-foreground uppercase tracking-widest opacity-70">Helpful Resource</span>
                <span className="text-[10px] text-muted-foreground truncate">Download blank form PDF</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] sm:px-3 border-primary/20 hover:bg-primary/10 text-primary font-bold uppercase transition-all"
              onClick={(e) => { e.stopPropagation(); handleDownloadBlankForm(); }}
            >
              Get PDF
            </Button>
          </div>
        </div>

        <DialogFooter className="bg-primary/5 p-4 flex flex-row gap-2 border-t border-primary/5">
          <Button variant="ghost" onClick={onClose} className="h-10 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 flex-1">
            Cancel
          </Button>
          <Button 
            disabled={!allAcknowledged}
            onClick={onProceed} 
            className={`h-10 px-8 font-bold uppercase tracking-widest text-xs shadow-lg transition-all flex-[2] ${
              allAcknowledged 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20' 
                : 'bg-muted text-muted-foreground shadow-none'
            }`}
          >
            Start Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClipboardCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
