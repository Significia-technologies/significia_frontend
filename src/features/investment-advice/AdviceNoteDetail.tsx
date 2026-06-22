"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Lock, 
  Unlock,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  TrendingUp,
  User,
  ShieldCheck,
  Building2,
  FileCheck2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InvestmentAdviceService, InvestmentAdviceNote } from "@/core/services/investment-advice.service";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatAmountUnits } from "./AdviceNoteForm";

interface AdviceNoteDetailProps {
  noteId: string;
  onBack: () => void;
}

export function AdviceNoteDetail({ noteId, onBack }: AdviceNoteDetailProps) {
  const [note, setNote] = useState<InvestmentAdviceNote | null>(null);
  const [iaData, setIaData] = useState<IAMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [noteData, masterData] = await Promise.all([
        InvestmentAdviceService.get(noteId),
        IAMasterService.getLatest()
      ]);
      setNote(noteData);
      setIaData(masterData);
    } catch (error) {
      console.error("Failed to fetch advice note detail", error);
      toast.error("Failed to load advice note details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [noteId]);

  const handleDownload = async (formatType: 'pdf') => {
    if (!note) return;
    setDownloading(formatType);
    try {
      await InvestmentAdviceService.downloadPDF(note.id, note.advice_note_no);
      toast.success(`${formatType.toUpperCase()} exported successfully.`);
    } catch (error) {
      console.error("Failed to export report", error);
      toast.error(`Failed to download ${formatType.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleLock = async () => {
    if (!note) return;
    setIsLocking(true);
    try {
      await InvestmentAdviceService.lock(note.id);
      toast.success("Advice Note successfully locked and registered for compliance.");
      setShowLockDialog(false);
      fetchDetail();
    } catch (error) {
      console.error("Failed to lock advice note", error);
      toast.error("Failed to lock advice note. Verify all required details are completed.");
    } finally {
      setIsLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading compliance report...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-destructive">Advice Note Not Found</h3>
        <p className="text-muted-foreground text-sm mb-4">The requested advice note record does not exist.</p>
        <Button onClick={onBack}>Back to List</Button>
      </div>
    );
  }

  const client = note.client_snapshot || {};
  const recs = note.recommendations || [];

  const SectionHeader = ({ num, title }: { num: string; title: string }) => (
    <div className="flex items-center gap-2 border-b border-primary/10 pb-2 mb-4 mt-6">
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20 font-bold shrink-0">
        Section {num}
      </Badge>
      <h3 className="font-bold text-base text-foreground/90 uppercase tracking-tight">{title}</h3>
    </div>
  );

  const GridRow = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-primary/5 text-sm">
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="col-span-2 text-foreground font-normal">{value || "N/A"}</span>
    </div>
  );

  // Recommended asset allocation text helper
  const renderRecommendedAllocText = () => {
    const alloc = note.recommended_asset_allocation;
    if (alloc && typeof alloc === 'object') {
      return Object.entries(alloc)
        .filter(([k]) => k !== 'sub_assets')
        .map(([k, v]) => `${k}: ${v}%`)
        .join("  |  ");
    }
    return "N/A";
  };

  const renderSubAllocations = () => {
    const alloc = note.recommended_asset_allocation;
    if (!alloc || typeof alloc !== 'object' || !alloc.sub_assets) return null;
    const sub = alloc.sub_assets;
    
    const hasSubAllocations = Object.values(sub).some(val => Number(val) > 0);
    if (!hasSubAllocations) return null;

    const labelMap: Record<string, string> = {
      fixed_deposits_bonds_percentage: "Fixed Deposits / Bonds",
      mutual_fund_debt_percentage: "Debt Mutual Funds",
      ulip_debt_percentage: "Debt ULIPs",
      etf_debt_percentage: "Debt ETFs",
      
      stocks_percentage: "Direct Equity (Stocks)",
      mutual_fund_equity_percentage: "Equity Mutual Funds",
      ulip_equity_percentage: "Equity ULIPs",
      etf_equity_percentage: "Equity ETFs",
      
      gold_etf_percentage: "Gold ETFs",
      silver_etf_percentage: "Silver ETFs",
      etf_commodity_percentage: "Commodity ETFs"
    };

    return (
      <div className="col-span-1 md:col-span-2 mt-2 p-4 bg-muted/30 border border-primary/5 rounded-xl space-y-3">
        <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sub-Asset Allocation Breakdown</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
          {Object.entries(sub).map(([key, val]) => {
            const numVal = Number(val);
            if (numVal <= 0) return null;
            return (
              <div key={key} className="flex justify-between border-b border-primary/5 pb-1">
                <span className="text-muted-foreground font-medium">{labelMap[key] || key}</span>
                <span className="font-bold text-foreground">{numVal}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/10 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2 rounded-xl bg-primary/10">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                {note.advice_note_no}
              </h1>
              {note.is_locked ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] uppercase tracking-widest gap-0.5 font-black shrink-0 h-4">
                  <Lock className="w-2.5 h-2.5" /> Locked
                </Badge>
              ) : (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[8px] uppercase tracking-widest gap-0.5 font-black shrink-0 h-4">
                  <Unlock className="w-2.5 h-2.5" /> Draft
                </Badge>
              )}
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              Client: {client.client_name || "N/A"} ({client.client_code || "N/A"}) • Version {note.version_number}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-9 text-xs gap-1.5"
            onClick={() => handleDownload('pdf')}
            disabled={downloading !== null}
          >
            {downloading === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Export PDF</span>
          </Button>

          {!note.is_locked && (
            <Button 
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs gap-1.5 shadow-lg shadow-amber-600/10"
              onClick={() => setShowLockDialog(true)}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock & Deliver</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Sections A, B & C */}
        <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            
            {/* Section A */}
            <div>
              <SectionHeader num="A" title="Investment Adviser Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <GridRow label="IA / Firm Name" value={iaData?.name_of_entity || iaData?.name_of_ia} />
                <GridRow label="Advice Note No" value={note.advice_note_no} />
                <GridRow label="IA Reg No" value={iaData?.ia_registration_number} />
                <GridRow label="Date of Issue" value={format(new Date(note.date_of_issue), "dd MMMM yyyy")} />
                <GridRow label="IAASB" value={iaData?.basl_membership_id ? `BSE Limited (IAASB) - ${iaData.basl_membership_id}` : "BSE Limited (IAASB)"} />
                <GridRow label="Advice Validity" value={note.advice_validity_custom_text} />
                <GridRow label={iaData?.nature_of_entity?.toLowerCase() === "body corporate" ? "Principal Officer" : "Investment Adviser"} value={note.principal_officer_name} />
                <GridRow label={iaData?.nature_of_entity?.toLowerCase() === "body corporate" ? "PO Registration No" : "IA Registration No"} value={note.principal_officer_reg_no} />
                <GridRow label="Website" value={iaData?.website ? (
                  <a href={`https://${iaData.website.replace(/^(https?:\/\/)?(www\.)?/, "")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                    {iaData.website}
                  </a>
                ) : "N/A"} />
                <GridRow label="Advice Category" value={note.advice_category} />
              </div>
            </div>

            {/* Section B */}
            <div>
              <SectionHeader num="B" title="Client Details & Risk Profile" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <GridRow label="Client Name" value={client.client_name} />
                <GridRow label="Client Code" value={client.client_code} />
                <GridRow label="PAN Number" value={client.pan_number} />
                <GridRow label="Client DOB" value={client.date_of_birth} />
                <GridRow label="Address" value={client.address} />
                <GridRow label="Email" value={client.email} />
                <GridRow label="Mobile" value={client.phone_number} />
                <GridRow label="Risk Profile" value={client.risk_profile_score && client.risk_profile_score !== "N/A" ? `${client.risk_profile} (Score: ${client.risk_profile_score}/100)` : client.risk_profile} />
                <GridRow label="Risk Profile Date" value={client.risk_profile_date} />
                <GridRow label="Investment Horizon" value={client.investment_horizon} />
                <GridRow label="Annual Income Band" value={note.annual_income_band} />
                <GridRow label="Existing Liabilities" value={client.existing_liabilities !== undefined ? `₹${new Intl.NumberFormat('en-IN').format(client.existing_liabilities)}` : "N/A"} />
                <GridRow label="Assets Under Advice (AUA)" value={`₹${new Intl.NumberFormat('en-IN').format(note.assets_under_advice)}`} />
                <GridRow label="Primary Goal" value={note.primary_financial_goal} />
                <GridRow label="Fee Mode" value={note.fee_mode === 'FIXED_FEE' ? 'Fixed Fee & GST' : 'Percentage of Assets Under Advice'} />
                <GridRow label="Fee Amount" value={note.fee_mode === 'FIXED_FEE' ? `₹${new Intl.NumberFormat('en-IN').format(note.fee_amount)}` : `${note.fee_amount}%`} />
                <GridRow label="Recommended Asset Allocation" value={renderRecommendedAllocText()} />
                {note.date_of_allocation && <GridRow label="Date of Allocation" value={format(new Date(note.date_of_allocation), "dd MMMM yyyy")} />}
                {renderSubAllocations()}
              </div>
            </div>

            {/* Section C */}
            <div>
              <SectionHeader num="C" title="Suitability Assessment" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                  <GridRow label="Advice Suitable?" value={note.suitability_assessment} />
                  <GridRow label="Suitability Basis" value={note.suitability_basis} />
                  <GridRow label="Investor Advice" value={note.investor_advice} />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Section D: Product Recommendations */}
        <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <SectionHeader num="D" title="Investment Recommendations" />
            <div className="border border-primary/10 rounded-xl overflow-hidden mt-4">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Product / Scheme Name</TableHead>
                    <TableHead>ISIN / Code</TableHead>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Amount / Units</TableHead>
                    <TableHead>Price / NAV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground text-sm italic">
                        No product recommendations registered in this advice note.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recs.map((rec, i) => (
                      <TableRow key={rec.id || i} className="hover:bg-primary/5 transition-colors">
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{rec.product_name}</TableCell>
                        <TableCell className="text-xs font-mono">{rec.isin_code_scheme_code_uin}</TableCell>
                        <TableCell className="text-xs capitalize">{rec.product_type.replace("-", " ")}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={rec.action === 'BUY' ? 'default' : 'secondary'} className="text-[9px] font-bold">
                            {rec.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatAmountUnits(rec, rec.product_type)}</TableCell>
                        <TableCell className="text-xs font-mono">₹{rec.indicative_price_nav || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Prices and NAVs are indicative as of issue date. Actual execution price depends on execution timing.
            </p>
          </CardContent>
        </Card>

        {/* Section E: Rationale */}
        <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <SectionHeader num="E" title="Rationale for Advice " />
            <div className="space-y-4 mt-4 divide-y divide-primary/5">
              {recs.filter(r => r.rationale).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No specific product rationales available.</p>
              ) : (
                recs.map((rec, i) => (
                  <div key={rec.id || i} className={`pt-3 ${i === 0 ? 'pt-0' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{rec.product_name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono leading-none border-primary/25 text-primary bg-primary/5">
                        {rec.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground mt-1.5 leading-relaxed">{rec.rationale}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section F & G: Disclosures & Compliance */}
        <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            
            {/* Section F */}
            <div>
              <SectionHeader num="F" title="Risk Disclosures" />
              <div className="space-y-3.5 mt-4 text-xs leading-relaxed text-foreground">
                <div className="grid grid-cols-4 gap-2">
                  <span className="font-bold text-muted-foreground col-span-1">Market / Price Risk:</span>
                  <span className="col-span-3">Equity and ETF investments are subject to market fluctuations. Past performance is not indicative of future returns.</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span className="font-bold text-muted-foreground col-span-1">Mutual Fund Risk:</span>
                  <span className="col-span-3">Mutual Fund investments are subject to market risks. Please read all scheme documents carefully before investing.</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span className="font-bold text-muted-foreground col-span-1">Interest Rate Risk:</span>
                  <span className="col-span-3">Debt fund NAVs are affected by interest rate movements. Suitable only for investors with appropriate horizon.</span>
                </div>
              </div>
            </div>

            {/* Section G */}
            <div>
              <SectionHeader num="G" title="Conflict & AI Disclosure" />
              <div className="space-y-4 mt-4 text-xs leading-relaxed">
                <div>
                  <h5 className="font-bold text-muted-foreground mb-1">Conflict of Interest:</h5>
                  <p className="text-foreground bg-muted/20 p-3 rounded-lg border border-primary/5">{note.conflict_of_interest_text}</p>
                </div>
                <div>
                  <h5 className="font-bold text-muted-foreground mb-1">No Execution by IA:</h5>
                  <p className="text-foreground bg-muted/20 p-3 rounded-lg border border-primary/5">{note.no_execution_text}</p>
                </div>
                <div>
                  <h5 className="font-bold text-muted-foreground mb-1">AI Tool Disclosure:</h5>
                  <p className="text-foreground bg-muted/20 p-3 rounded-lg border border-primary/5">{note.ai_usage_text}</p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent className="max-w-md border-primary/20 bg-background/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" /> Confirm SEBI Lock & Delivery
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-foreground">
              <p>
                You are locking Advice Note <strong>{note.advice_note_no}</strong>.
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs leading-relaxed">
                <strong>CRITICAL REGULATORY COMPLIANCE:</strong> Under SEBI (Investment Advisers) Regulations, 2013, 
                once an advice note is delivered to the client, it must be locked to prevent any future modifications.
                This forms an immutable record retained for a mandatory period of 5 years.
              </div>
              <p className="text-sm font-bold text-destructive">
                This action is irreversible. You will not be able to edit this note after locking.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleLock();
              }}
              disabled={isLocking}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLocking ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locking...
                </span>
              ) : (
                "Lock Advice Note"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
