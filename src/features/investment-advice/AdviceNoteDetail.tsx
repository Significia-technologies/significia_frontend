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
  FileCheck2,
  Pencil
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { InvestmentAdviceService, InvestmentAdviceNote, InvestmentAdviceRecommendation } from "@/core/services/investment-advice.service";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatAmountUnits } from "./AdviceNoteForm";

export function calculateValidity(dateOfIssue: string, validityText: string): "Valid" | "Expired" {
  try {
    const issueDate = new Date(dateOfIssue);
    issueDate.setHours(0, 0, 0, 0);
    
    let days = 60; // default fallback
    const match = validityText.match(/(\d+)\s*Day/i);
    if (match) {
      days = parseInt(match[1]);
    } else if (validityText.toLowerCase().includes("immediate")) {
      days = 1;
    }
    
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expiryDate >= today ? "Valid" : "Expired";
  } catch (error) {
    return "Valid";
  }
}


interface AdviceNoteDetailProps {
  noteId: string;
  onBack: () => void;
  onEdit?: () => void;
}

export function AdviceNoteDetail({ noteId, onBack, onEdit }: AdviceNoteDetailProps) {
  const [note, setNote] = useState<InvestmentAdviceNote | null>(null);
  const [iaData, setIaData] = useState<IAMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [showRecordActionsPage, setShowRecordActionsPage] = useState(false);
  const [actionTakenUpdates, setActionTakenUpdates] = useState<Record<string, 'Yes' | 'Partial' | 'No'>>({});
  const [savingActions, setSavingActions] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const [noteData, masterData] = await Promise.all([
        InvestmentAdviceService.get(noteId),
        IAMasterService.getLatest()
      ]);
      setNote(noteData);
      setIaData(masterData);

      // Initialize action taken updates
      const initialUpdates: Record<string, 'Yes' | 'Partial' | 'No'> = {};
      (noteData.recommendations || []).forEach(rec => {
        if (rec.id) {
          initialUpdates[rec.id] = rec.action_taken || 'No';
        }
      });
      setActionTakenUpdates(initialUpdates);
    } catch (error) {
      console.error("Failed to fetch advice note detail", error);
      toast.error("Failed to load advice note details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActions = async () => {
    if (!note) return;
    setSavingActions(true);
    try {
      const updates = Object.entries(actionTakenUpdates).map(([id, val]) => ({
        id,
        action_taken: val,
      }));
      await InvestmentAdviceService.updateRecommendationsAction(note.id, updates);
      toast.success("Execution actions updated successfully.");
      await fetchDetail();
      setShowRecordActionsPage(false);
    } catch (error) {
      console.error("Failed to update actions", error);
      toast.error("Failed to update execution actions.");
    } finally {
      setSavingActions(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [noteId]);

  const handleDownload = async (
    formatType: 'pdf', 
    validityType: 'all' | 'valid' | 'expired' = 'all',
    exportType: 'full' | 'execution_log' = 'full'
  ) => {
    if (!note) return;
    setDownloading(validityType);
    try {
      await InvestmentAdviceService.downloadPDF(note.id, note.advice_note_no, validityType, exportType);
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

  if (showRecordActionsPage) {
    const handleCancel = () => {
      const resetUpdates: Record<string, 'Yes' | 'Partial' | 'No'> = {};
      (note.recommendations || []).forEach(rec => {
        if (rec.id) {
          resetUpdates[rec.id] = rec.action_taken || 'No';
        }
      });
      setActionTakenUpdates(resetUpdates);
      setShowRecordActionsPage(false);
    };

    return (
      <div className="space-y-4 max-w-4xl mx-auto py-1 animate-in fade-in duration-200">
        {/* Top Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel} 
              className="rounded-full shrink-0 w-8 h-8 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground uppercase">
                  Record Execution Actions
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-bold shrink-0 py-0 px-1.5 h-4">
                  Logging
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-60">
                Note: {note.advice_note_no} • Client: {client.client_name || "N/A"}
              </p>
            </div>
          </div>          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-8 text-xs gap-1.5 cursor-pointer"
                  disabled={downloading !== null}
                >
                  {downloading !== null ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Export Logs</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-md border-primary/10">
                <DropdownMenuItem onClick={() => handleDownload('pdf', 'all', 'execution_log')} className="text-xs font-semibold cursor-pointer">
                  All Execution
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('pdf', 'valid', 'execution_log')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer">
                  Valid Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('pdf', 'expired', 'execution_log')} className="text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer">
                  Expired Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="h-8 text-xs px-3"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveActions} 
              disabled={savingActions}
              className="bg-primary text-background font-bold h-8 text-xs shadow-lg shadow-primary/10 px-4"
            >
              {savingActions ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Execution Logs"
              )}
            </Button>
          </div>
        </div>

        {/* Recording Table Panel */}
        <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="border border-primary/10 rounded-xl overflow-x-auto">
              <Table className="w-full min-w-[700px]">
                <TableHeader className="bg-primary/5">
                  <TableRow>
                    <TableHead className="w-8 py-2">#</TableHead>
                    <TableHead className="w-[45%] py-2">Product / Scheme Name</TableHead>
                    <TableHead className="w-[10%] py-2">Action</TableHead>
                    <TableHead className="w-[20%] py-2">Amount / Units</TableHead>
                    <TableHead className="w-[12%] py-2">Validity Status</TableHead>
                    <TableHead className="w-[13%] py-2">Action Taken</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-20 text-center text-muted-foreground text-sm italic">
                        No product recommendations registered in this advice note.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recs.map((rec, i) => {
                      const validity = calculateValidity(note.date_of_issue, rec.advice_validity_text || `${note.advice_validity_days} Days`);
                      const currentVal = actionTakenUpdates[rec.id || ""] || rec.action_taken || "No";
                      return (
                        <TableRow key={rec.id || i} className="hover:bg-primary/5 transition-colors">
                          <TableCell className="text-xs py-2">{i + 1}</TableCell>
                          <TableCell className="text-xs font-bold text-foreground py-2">
                            <div>{rec.product_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5 font-normal">{rec.isin_code_scheme_code_uin}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <Badge variant={rec.action === 'BUY' ? 'default' : 'secondary'} className="text-[9px] font-bold px-1.5 py-0">
                              {rec.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs py-2">{formatAmountUnits(rec, rec.product_type)}</TableCell>
                          <TableCell className="text-xs py-2">
                            <Badge className={cn(
                              "text-[9px] font-bold px-1.5 py-0 border",
                              validity === "Valid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                              {validity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            <Select 
                              value={currentVal} 
                              onValueChange={(val: 'Yes' | 'Partial' | 'No') => {
                                setActionTakenUpdates(prev => ({
                                  ...prev,
                                  [rec.id || ""]: val
                                }));
                              }}
                            >
                              <SelectTrigger className="h-8 py-0 w-24 text-xs font-semibold border-primary/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="Partial">Partial</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              * Record the implementation status for compliance verification and audit logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-9 text-xs gap-1.5 cursor-pointer"
            onClick={() => handleDownload('pdf', 'all', 'full')}
            disabled={downloading !== null}
          >
            {downloading !== null ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Export PDF</span>
          </Button>

          {!note.is_locked && onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10 h-9 text-xs gap-1.5"
              onClick={onEdit}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Draft</span>
            </Button>
          )}

          {note.is_locked && (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 h-9 text-xs gap-1.5"
              onClick={() => {
                // Sync updates state with latest recommendations values
                const currentUpdates: Record<string, 'Yes' | 'Partial' | 'No'> = {};
                (note.recommendations || []).forEach(rec => {
                  if (rec.id) {
                    currentUpdates[rec.id] = rec.action_taken || 'No';
                  }
                });
                setActionTakenUpdates(currentUpdates);
                setShowRecordActionsPage(true);
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Actions</span>
            </Button>
          )}

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
                    <TableHead>Validity</TableHead>
                    <TableHead>Action Taken</TableHead>
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
                        <TableCell className="text-xs">
                          {(() => {
                            const valText = rec.advice_validity_text || `${note.advice_validity_days} Days`;
                            const validity = calculateValidity(note.date_of_issue, valText);
                            return (
                              <Badge className={validity === "Valid" ? "bg-green-500/10 text-green-500 border-green-500/20 text-[9px] px-1.5 py-0 font-bold" : "bg-red-500/10 text-red-500 border-red-500/20 text-[9px] px-1.5 py-0 font-bold"}>
                                {validity}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold px-1.5 py-0",
                            rec.action_taken === "Yes" && "border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/10",
                            rec.action_taken === "Partial" && "border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/10",
                            (!rec.action_taken || rec.action_taken === "No") && "border-gray-500/30 bg-gray-500/10 text-gray-500 hover:bg-gray-500/10"
                          )}>
                            {rec.action_taken || "No"}
                          </Badge>
                        </TableCell>
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
