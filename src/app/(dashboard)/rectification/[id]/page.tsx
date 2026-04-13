"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  FileDown, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Calendar,
  User,
  Fingerprint,
  Info,
  ShieldAlert,
  Save,
  Loader2,
  Trash2,
  Plus,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CustomCheckbox as Checkbox } from "@/components/ui/CustomCheckbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { RectificationService, RectificationResponse, ProposedChange } from "@/core/services/rectification.service";
import { MasterDataService } from "@/core/services/master.service";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";

const ProgressPie = ({ percentage }: { percentage: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          className="text-emerald-100"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
        <circle
          className="text-emerald-600 transition-all duration-300 ease-in-out"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
        />
      </svg>
      <span className="absolute text-[9px] font-black text-emerald-900">{percentage}%</span>
    </div>
  );
};

export default function RectificationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rectification, setRectification] = useState<RectificationResponse | null>(null);
  const [client, setClient] = useState<any>(null);

  // Form State for Section 4
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([]);
  const [justification, setJustification] = useState({ q1: "", q2: "", q3: "" });
  const [impact, setImpact] = useState({ financial: false, risk: false, asset_allocation: false, portfolio: false, remarks: "" });
  const [confirmationMode, setConfirmationMode] = useState<string[]>([]);
  const [currentModuleValues, setCurrentModuleValues] = useState<Record<string, any>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async (silent = false) => {
    if (!silent && !rectification) setLoading(true);
    try {
      const r = await RectificationService.getById(id);
      setRectification(r);
      setProposedChanges(r.proposed_changes || []);
      setJustification(r.justification_details || { q1: "", q2: "", q3: "" });
      setImpact({
        financial: r.impact_declaration?.financial || false,
        risk: r.impact_declaration?.risk || false,
        asset_allocation: r.impact_declaration?.asset_allocation || false,
        portfolio: r.impact_declaration?.portfolio || false,
        remarks: r.impact_declaration?.remarks || ""
      });
      setConfirmationMode(r.confirmation_mode ? r.confirmation_mode.split(',') : []);
      
      if (r.client_id) {
        const c = await MasterDataService.getClient(r.client_id);
        setClient(c);
      }

      const values = await RectificationService.getCurrentValues(r.module, r.record_id);
      setCurrentModuleValues(values);

    } catch (error) {
      toast.error("Failed to load rectification data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setProposedChanges([...proposedChanges, { field: "", current: "", proposed: "", reason: "" }]);
  };

  const handleRemoveField = (index: number) => {
    const next = [...proposedChanges];
    next.splice(index, 1);
    setProposedChanges(next);
  };

  const updateField = (index: number, key: keyof ProposedChange, value: any) => {
    const next = [...proposedChanges];
    next[index][key] = value;
    
    if (key === 'field' && currentModuleValues[value] !== undefined) {
      next[index]['current'] = currentModuleValues[value];
    }
    
    setProposedChanges(next);
  };

  const handleDownload = async () => {
    if (!rectification) return;
    setDownloadingPdf(true);
    try {
      await RectificationService.downloadPdf(id, rectification.serial_no);
      toast.success("Authorization form downloaded successfully.");
    } catch (error) {
      toast.error("Failed to generate PDF form.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "investor_request" | "signed_form" = "signed_form") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setActiveUploadType(docType);
    try {
      await RectificationService.uploadSignedForm(id, file, docType, (progress) => {
        setUploadProgress(progress);
      });
      toast.success(docType === "investor_request" ? "Investor request copy saved!" : "IA Authorization saved!");
      loadData(true);
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setActiveUploadType(null);
    }
  };

  const handleDeleteDoc = async (docType: "investor_request" | "signed_form") => {
    if (!window.confirm(`Are you sure you want to remove this ${docType.replace('_', ' ')}?`)) return;
    try {
      await RectificationService.deleteDocument(id, docType);
      toast.success("Document removed successfully.");
      loadData(true);
    } catch (error) {
      toast.error("Failed to remove document.");
    }
  };

  const handleDocDownload = async (docType: "investor_request" | "signed_form", path: string) => {
    try {
      const filename = path.split('/').pop()?.split('_').slice(3).join('_') || "document.pdf";
      await RectificationService.downloadDocument(id, docType, filename);
    } catch (error) {
      toast.error("Failed to download document.");
    }
  };

  const handleApprove = async () => {
    if (!rectification) return;

    // 1. Local Compliance Check for immediate feedback
    if (rectification.is_investor_requested && !rectification.investor_request_path) {
      toast.error("Compliance Error: Investor Request Copy is missing. Please upload evidence first.");
      return;
    }
    if (!rectification.signed_form_path) {
      toast.error("Compliance Error: IA Signed Authorization is missing. Please upload the signed form first.");
      return;
    }

    setApproving(true);
    try {
      await RectificationService.approve(id);
      toast.success("Rectification Authorized and Completed!");
      loadData(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Approval failed. Ensure you have IA permissions.";
      toast.error(errorMessage);
    } finally {
      setApproving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await RectificationService.update(id, { 
        proposed_changes: proposedChanges,
        justification_details: justification,
        impact_declaration: impact,
        confirmation_mode: confirmationMode.join(',')
      });
      toast.success("Rectification progress saved locally and in vault.");
      loadData(true);
    } catch (error) {
      toast.error("Persistence failure. Check Bridge status.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !rectification) return <div className="p-8 text-center animate-pulse uppercase font-black tracking-widest opacity-40">Loading Data Rectification Protocol...</div>;
  if (!rectification) return <div className="p-8 text-center">Record not discovered</div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Workflow Stepper */}
      <div className="grid grid-cols-3 gap-1 mb-4 print:hidden">
        {[
          { 
            label: "Initialization", 
            status: "DRAFT", 
            icon: FileText, 
            description: "Choosing fields & justification" 
          },
          { 
            label: "Verification", 
            status: "UPDATED", 
            icon: Upload, 
            description: "Processing documents",
            hidden: false
          },
          { 
            label: "Authorization", 
            status: "APPROVED", 
            icon: ShieldAlert, 
            description: "IA Master sign-off" 
          }
        ].filter(step => !step.hidden).map((step, idx, arr) => {
          const isCompleted = arr.findIndex(s => s.status === rectification.status) >= idx;
          const isActive = rectification.status === step.status;
          
          return (
            <div key={step.label} className="relative group">
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive 
                  ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                  : isCompleted 
                    ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                    : "bg-muted/30 border-primary/10 opacity-30 grayscale"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-primary text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">{step.label}</h4>
                    <p className="text-[9px] font-bold opacity-50">{step.description}</p>
                  </div>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className={`absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full z-10 ${
                  isCompleted ? "bg-emerald-500/20" : "bg-primary/10"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" className="gap-2 font-black uppercase text-[10px] tracking-widest" onClick={() => router.push('/rectification')}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <div className="flex gap-3">
          {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && (
            <Button 
                variant="outline" 
                className="gap-2 border-primary/20 bg-card hover:bg-primary/5 text-primary" 
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                Save Progress
            </Button>
          )}

          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 bg-card hover:bg-primary/5" 
            onClick={handleDownload}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
            Download Form
          </Button>
          
          {/* Action: Upload (Mandatory for all before approval) */}
          {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && !rectification.signed_form_path && (
            <div className="relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => handleFileUpload(e, "signed_form")}
                disabled={uploading}
              />
              <Button className="gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Signed Authorization
              </Button>
            </div>
          )}

          {/* Action: Authorize (Available in DRAFT/UPDATED if not approved) */}
          {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && !rectification.approved_by_id && (
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={handleApprove} disabled={approving}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Authorize & Apply Change
            </Button>
          )}
        </div>
      </div>

      {/* Main Form Content - Styled for both UI and Print */}
      <div id="print-area" ref={printRef} className="bg-white text-black p-8 shadow-2xl rounded-sm border border-black/5 print:shadow-none print:p-0 print:border-none">
        
        {/* PRINT HEADER - ONLY VISIBLE ON PRINT */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-6 text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight">Data Correction Authorization Form</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Pre-Edit Approval for Version Creation</p>
        </div>

        <div className="space-y-10">
          
          {/* SECTION 1: BASIC IDENTIFICATION */}
          <section>
            <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">1</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Basic Identification</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 px-4">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Client Name</Label>
                <div className="font-bold border-b border-black/10 pb-1">{client?.client_name || "N/A"}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Client Code</Label>
                <div className="font-bold border-b border-black/10 pb-1">{client?.client_code || "N/A"}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Module / Program</Label>
                <div className="font-bold border-b border-black/10 pb-1">{rectification.module}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Record ID (Original)</Label>
                <div className="font-mono text-[9px] border-b border-black/10 pb-1">{rectification.record_id}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Current Version</Label>
                <div className="font-bold border-b border-black/10 pb-1">v{rectification.current_version}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Edit Serial No.</Label>
                <div className="font-black text-primary border-b border-black/10 pb-1">{rectification.serial_no}</div>
              </div>
              <div className="col-span-full space-y-1 mt-4">
                <Label className="text-[9px] font-black uppercase opacity-40">Initiation Reason</Label>
                <div className="p-3 bg-primary/5 border border-primary/10 rounded font-medium text-xs italic">
                  &quot;{rectification.initiation_reason}&quot;
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: EDIT REQUEST DETAILS */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">2</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Request Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-8 px-4">
               <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Requested By</Label>
                <div className="font-bold border-b border-black/10 pb-1 flex items-center gap-2">
                  {rectification.requested_by_name || "Staff / IA Employee"} 
                  {rectification.requested_by_role && (
                    <span className="text-[10px] font-black uppercase opacity-40 px-2 py-0.5 bg-black/5 rounded">
                      {rectification.requested_by_role}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase opacity-40">Timestamp</Label>
                <div className="font-bold border-b border-black/10 pb-1">{format(new Date(rectification.created_at), "PPP p")}</div>
              </div>
            </div>
          </section>

          {/* NEW SECTION: COMPLIANCE DOCUMENTATION */}
          <section className="print:hidden">
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-emerald-500 mb-6">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-900">Compliance Documentation</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
               {/* 1. Investor Request Copy */}
               {rectification.is_investor_requested && (
                 <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-none overflow-hidden h-full">
                    <CardHeader className="p-4 bg-emerald-500/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-900">
                        <User className="w-4 h-4" /> Investor Request Evidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {rectification.investor_request_path ? (
                        <div className="flex items-center justify-between p-3 bg-white/50 border border-emerald-500/20 rounded-lg">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                             <span className="text-[10px] font-bold truncate text-emerald-900">
                               {rectification.investor_request_path.split('/').pop()?.split('_').slice(3).join('_') || "Investor_Request.pdf"}
                             </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-500/10" onClick={() => handleDocDownload("investor_request", rectification.investor_request_path!)}>
                               <FileDown className="w-3.5 h-3.5" />
                            </Button>
                            {rectification?.status !== "APPROVED" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500" onClick={() => handleDeleteDoc("investor_request")}>
                                 <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 border-2 border-dashed border-emerald-500/20 rounded-lg bg-emerald-500/5 flex flex-col items-center gap-2 text-center min-h-[80px] justify-center relative">
                           {uploading && activeUploadType === "investor_request" ? (
                             <ProgressPie percentage={uploadProgress} />
                           ) : (
                             <>
                               <AlertCircle className="w-5 h-5 text-emerald-700" />
                               <p className="text-[9px] font-black uppercase text-emerald-800">Missing Request Copy</p>
                               <div className="relative w-full">
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => handleFileUpload(e, "investor_request")}
                                    disabled={uploading}
                                  />
                                  <Button variant="outline" size="sm" className="w-full text-[9px] font-black uppercase h-7 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-900">
                                    Upload Copy
                                  </Button>
                               </div>
                             </>
                           )}
                        </div>
                      )}
                    </CardContent>
                 </Card>
               )}

               {/* 2. IA Signed Authorization */}
               <Card className={`border-emerald-500/20 bg-emerald-500/5 shadow-none overflow-hidden h-full ${!rectification.is_investor_requested ? 'md:col-span-2' : ''}`}>
                  <CardHeader className="p-4 bg-emerald-500/20">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-900">
                      <ShieldAlert className="w-4 h-4" /> IA Signed Authorization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {rectification.signed_form_path ? (
                        <div className="flex items-center justify-between p-3 bg-white/50 border border-emerald-500/20 rounded-lg">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                             <span className="text-[10px] font-bold truncate text-emerald-900">
                               {rectification.signed_form_path.split('/').pop()?.split('_').slice(3).join('_') || "Final_Authorization.pdf"}
                             </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-500/10" onClick={() => handleDocDownload("signed_form", rectification.signed_form_path!)}>
                               <FileDown className="w-3.5 h-3.5" />
                            </Button>
                            {rectification?.status !== "APPROVED" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500" onClick={() => handleDeleteDoc("signed_form")}>
                                 <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                    ) : (
                      <div className="p-3 border-2 border-dashed border-emerald-500/20 rounded-lg bg-emerald-500/5 flex flex-col items-center gap-2 text-center min-h-[80px] justify-center relative">
                         {uploading && activeUploadType === "signed_form" ? (
                             <ProgressPie percentage={uploadProgress} />
                         ) : (
                           <>
                             <AlertCircle className="w-5 h-5 text-emerald-700" />
                             <p className="text-[9px] font-black uppercase text-emerald-800">Missing Internal Sign-off</p>
                             <p className="text-[8px] font-bold text-emerald-700/60 uppercase tracking-tighter">Download form, get signature, and upload.</p>
                             <div className="relative w-full">
                                <input 
                                  type="file" 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={(e) => handleFileUpload(e, "signed_form")}
                                  disabled={uploading}
                                />
                                <Button variant="outline" size="sm" className="w-full text-[9px] font-black uppercase h-7 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-900">
                                  Upload Signed Form
                                </Button>
                             </div>
                           </>
                         )}
                      </div>
                    )}
                  </CardContent>
               </Card>


            </div>
          </section>

          {/* SECTION 3: PURPOSE OF EDIT */}
           <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">3</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Purpose of Edit</h2>
            </div>
            <div className="px-4">
                <div className="flex gap-6 flex-wrap">
                    {["Data Correction", "Client Update", "Assumption Change", "Input Error", "Other"].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                           <Checkbox 
                              checked={confirmationMode.includes(opt)} 
                              onCheckedChange={(checked) => {
                                if (checked) setConfirmationMode([...confirmationMode, opt]);
                                else setConfirmationMode(confirmationMode.filter(m => m !== opt));
                              }}
                              disabled={rectification?.status === "APPROVED"} 
                              className="w-5 h-5 border-black" 
                           />
                           <span className="text-xs font-bold uppercase">{opt}</span>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* SECTION 4: DETAILS OF PROPOSED CHANGE */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">4</div>
                <h2 className="text-sm font-black uppercase tracking-widest">Proposed Changes</h2>
              </div>
              {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && (
                <Button variant="ghost" size="sm" onClick={handleAddField} className="print:hidden h-7 gap-1 font-black text-[9px]">
                    <Plus className="w-3 h-3" /> Add Field
                </Button>
              )}
            </div>
            <div className="px-4">
                <Table className="border border-black/10">
                    <TableHeader className="bg-black/5">
                        <TableRow className="border-black/10">
                            <TableHead className="text-[9px] font-black text-black">Field Name</TableHead>
                            <TableHead className="text-[9px] font-black text-black">Current Value</TableHead>
                            <TableHead className="text-[9px] font-black text-black">Proposed Value</TableHead>
                            <TableHead className="text-[9px] font-black text-black">Reason</TableHead>
                            {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && <TableHead className="print:hidden"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {proposedChanges.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={(rectification.status === "DRAFT" || rectification.status === "UPDATED") ? 5 : 4} className="text-center py-6 text-xs italic opacity-40">
                                    No fields selected for correction
                                </TableCell>
                            </TableRow>
                        ) : (
                            proposedChanges.map((item, idx) => (
                                <TableRow key={idx} className="border-black/5">
                                    <TableCell className="p-2">
                                        {(rectification.status === "DRAFT" || rectification.status === "UPDATED") ? (
                                            <select 
                                                className="w-full bg-transparent border-none text-xs font-bold font-mono focus:ring-0"
                                                value={item.field}
                                                onChange={(e) => updateField(idx, 'field', e.target.value)}
                                            >
                                                <option value="">Select Field...</option>
                                                {Object.keys(currentModuleValues)
                                                    .filter(f => !['id', 'client_id', 'created_at', 'updated_at', 'root_profile_id', 'parent_profile_id', 'version_number', 'record_id', 'custom_id', 'tenant_id', 'is_custom', 'base_custom_id'].includes(f))
                                                    .filter(f => rectification.module !== 'CLIENT' || !['client_name', 'pan_number', 'aadhar_number', 'date_of_birth', 'name'].includes(f))
                                                    .map(f => (
                                                    <option key={f} value={f}>{f.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-xs font-black font-mono">{item.field.toUpperCase()}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <div className="text-[10px] bg-black/5 px-2 py-1 rounded min-h-[1.5rem] italic whitespace-pre-wrap max-w-xs leading-relaxed">
                                            {(() => {
                                                const formatValue = (val: any): string => {
                                                    if (val === null || val === undefined) return "---";
                                                    if (Array.isArray(val)) {
                                                        return val.map((item, i) => `${i + 1}. ${formatValue(item)}`).join("\n");
                                                    }
                                                    if (typeof val === 'object') {
                                                        return Object.entries(val)
                                                            .map(([k, v]) => {
                                                                const label = k.replace(/_/g, ' ').toUpperCase();
                                                                const displayValue = typeof v === 'object' ? JSON.stringify(v) : String(v);
                                                                return `${label}: ${displayValue}`;
                                                            })
                                                            .join(", ");
                                                    }
                                                    return String(val);
                                                };
                                                return formatValue(item.current);
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="p-2">
                                        {(rectification.status === "DRAFT" || rectification.status === "UPDATED") ? (
                                            <Input 
                                                className="h-8 border-black/20 font-bold text-[10px]" 
                                                value={typeof item.proposed === 'object' ? JSON.stringify(item.proposed) : item.proposed} 
                                                onChange={(e) => updateField(idx, 'proposed', e.target.value)}
                                            />
                                        ) : (
                                            <div className="text-[10px] font-black whitespace-pre-wrap max-w-xs leading-relaxed">
                                                {(() => {
                                                    const formatValue = (val: any): string => {
                                                        if (val === null || val === undefined) return "---";
                                                        if (Array.isArray(val)) {
                                                            return val.map((item, i) => `${i + 1}. ${formatValue(item)}`).join("\n");
                                                        }
                                                        if (typeof val === 'object') {
                                                            return Object.entries(val)
                                                                .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                                                                .join(", ");
                                                        }
                                                        return String(val);
                                                    };
                                                    return formatValue(item.proposed);
                                                })()}
                                            </div>
                                        )}
                                    </TableCell>


                                    <TableCell className="p-2">
                                         {(rectification.status === "DRAFT" || rectification.status === "UPDATED") ? (
                                            <Input 
                                                className="h-8 border-black/20 text-xs" 
                                                value={item.reason}
                                                placeholder="Brief reason..."
                                                onChange={(e) => updateField(idx, 'reason', e.target.value)}
                                            />
                                        ) : (
                                            <span className="text-xs">{item.reason}</span>
                                        )}
                                    </TableCell>
                                    {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && (
                                        <TableCell className="print:hidden p-2 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveField(idx)}>
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
          </section>

          {/* SECTION 5: DETAILED JUSTIFICATION */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">5</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Detailed Justification</h2>
            </div>
            <div className="px-4 space-y-6">
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">1. What is incorrect in current data?</Label>
                   <Textarea 
                      value={justification.q1} 
                      onChange={(e) => setJustification({...justification, q1: e.target.value})}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Detail the discovered inaccuracy..."
                   />
                </div>
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">2. Why is change required?</Label>
                   <Textarea 
                      value={justification.q2} 
                      onChange={(e) => setJustification({...justification, q2: e.target.value})}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Explain why this correction is necessary (Compliance, Client Request, etc.)"
                   />
                </div>
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">3. Source of revised data?</Label>
                   <Textarea 
                      value={justification.q3} 
                      onChange={(e) => setJustification({...justification, q3: e.target.value})}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Mention the physical document or source used for verification..."
                   />
                </div>
            </div>
          </section>

          {/* SECTION 7: IMPACT DECLARATION */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">7</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Impact Declaration</h2>
            </div>
            <div className="px-4 grid grid-cols-2 gap-8">
                <div className="space-y-3">
                   <div className="flex items-center gap-3">
                       <Checkbox 
                          checked={impact.financial} 
                          onCheckedChange={(val) => setImpact({...impact, financial: !!val})}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black" 
                        />
                       <span className="text-xs font-bold uppercase">Impacts Financial Analysis</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <Checkbox 
                          checked={impact.risk} 
                          onCheckedChange={(val) => setImpact({...impact, risk: !!val})}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black" 
                        />
                       <span className="text-xs font-bold uppercase">Impacts Risk Profile</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <Checkbox 
                          checked={impact.asset_allocation} 
                          onCheckedChange={(val) => setImpact({...impact, asset_allocation: !!val})}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black" 
                        />
                       <span className="text-xs font-bold uppercase">Impacts Asset Allocation</span>
                   </div>
                   <div className="flex items-center gap-3">
                       <Checkbox 
                          checked={impact.portfolio} 
                          onCheckedChange={(val) => setImpact({...impact, portfolio: !!val})}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black" 
                        />
                       <span className="text-xs font-bold uppercase">Impacts Portfolio / Holdings</span>
                   </div>
                </div>
                <div>
                    <Label className="text-[9px] font-black uppercase opacity-40">Remarks / Mitigation</Label>
                    <Textarea 
                        value={impact.remarks || ""} 
                        onChange={(e) => setImpact({...impact, remarks: e.target.value})}
                        disabled={rectification?.status === "APPROVED"}
                        className="text-[11px] font-medium leading-relaxed italic border-0 border-b border-black/10 shadow-none focus-visible:ring-0 rounded-none bg-transparent p-0 min-h-[60px]"
                        placeholder="Add mitigation steps if any..."
                    />
                </div>
            </div>
          </section>

          {/* SECTION 8: DECLARATION (BY REQUESTOR) */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">8</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Declaration (By Requestor)</h2>
            </div>
            <div className="px-4">
                <div className="flex gap-4 p-4 border-2 border-dashed border-black/10 rounded-lg">
                    <ShieldAlert className="w-8 h-8 text-black opacity-20 shrink-0" />
                    <p className="text-[10px] font-medium italic leading-relaxed">
                        &quot;I confirm that the proposed edit info is accurate and verified relative to the client&apos;s request or original source document. This edit was not performed prior to this authorization.&quot;
                    </p>
                </div>
                <div className="mt-12 flex justify-between items-end">
                    <div className="w-48 border-t border-black pt-2 text-center">
                        <span className="text-[9px] font-black uppercase">Staff Signature</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black uppercase block opacity-30">Requested On</span>
                        <span className="text-xs font-bold">{format(new Date(rectification.created_at), "dd/MM/yyyy")}</span>
                    </div>
                </div>
            </div>
          </section>

          {/* SECTION 9: AUTHORIZATION (BY INVESTMENT ADVISER) */}
          <section className="bg-black/[0.02] p-6 border-2 border-black rounded-lg">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">9</div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">IA Authorization Case</h2>
            </div>
            <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-white p-4 border border-black/10 shadow-sm">
                    <Checkbox checked={!!rectification.signed_form_path} disabled className="w-6 h-6 border-black" />
                    <p className="text-[11px] font-black uppercase leading-tight">
                        I, THE INVESTMENT ADVISER, HAVE REVIEWED THE JUSTIFICATION AND UPLOADED EVIDENCE (IA SIGNED FORM), AND HEREBY AUTHORIZE THIS DATA RECTIFICATION.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-12 pt-8">
                     <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase opacity-40">Authorized By (Digital)</Label>
                        <div className="font-black text-lg underline decoration-double flex items-center gap-2">
                           <Fingerprint className="w-5 h-5 opacity-40" />
                           {rectification.approved_by_id ? "IA SIGNED" : "PENDING..."}
                        </div>
                    </div>
                    <div className="text-right space-y-4">
                       <div className="w-48 ml-auto border-t border-black pt-2 text-center">
                           <span className="text-[9px] font-black uppercase">IA Physical Signature</span>
                       </div>
                    </div>
                </div>
            </div>
          </section>

        </div>

        {/* PRINT FOOTER */}
        <div className="hidden print:flex justify-between items-center mt-20 pt-4 border-t border-black/10 opacity-30">
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Significia Compliance Protocol v6.0</span>
            <span className="text-[8px] font-bold">SERIAL AUTH: {rectification.serial_no}</span>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: white !important;
          }
          body * {
            visibility: hidden;
          }
          .print\:hidden {
            display: none !important;
          }
          #print-area {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm !important;
            margin: 0 !important;
            background-color: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          #print-area * {
            visibility: visible;
          }
          /* Fix for layout containers */
          main, section, div, .dashboard-layout {
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
