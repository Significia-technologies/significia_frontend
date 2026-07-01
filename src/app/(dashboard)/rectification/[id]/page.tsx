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
  XCircle,
  Mic,
  Music,
  Video
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
import { RectificationService, RectificationResponse, ProposedChange, ImpactDeclaration } from "@/core/services/rectification.service";
import { MasterDataService } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";

// Configuration for rectifiable fields to provide appropriate UI controls
const FIELD_CONFIG: Record<string, { type: 'select' | 'number' | 'date' | 'text' | 'textarea' | 'file', options?: string[] }> = {
  // Choice Fields (Dropdowns)
  gender: { type: 'select', options: ['Male', 'Female', 'Other'] },
  marital_status: { type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  residential_status: { type: 'select', options: ['Resident Individual', 'Non-Resident Indian', 'Person of Indian Origin', 'Foreign National'] },
  income_source: { type: 'select', options: ['Salaried', 'Business', 'Professional', 'Agriculture', 'Investments', 'Other'] },
  pep_status: { type: 'select', options: ['Not a PEP', 'PEP', 'Family Member of PEP', 'Close Associate of PEP'] },
  fatca_compliance: { type: 'select', options: ['FATCA Compliant', 'Non-Compliant', 'Not Applicable'] },
  referral_source: { type: 'select', options: ['Existing Client', 'Friend/Family', 'Online Search', 'Advertisement', 'Other'] },
  
  // Numeric Fields
  annual_income: { type: 'number' },
  net_worth: { type: 'number' },
  existing_portfolio_value: { type: 'number' },
  
  // Date Fields
  date_of_birth: { type: 'date' },
  client_date: { type: 'date' },
  agreement_date: { type: 'date' },
  ipv_date: { type: 'date' },
  
  // Long Text
  address: { type: 'textarea' },
  existing_portfolio_composition: { type: 'textarea' },
  investment_objectives: { type: 'textarea' },

  // Document Paths
  pan_card_copy: { type: 'file' },
  aadhar_card_copy: { type: 'file' },
  passport_copy: { type: 'file' },
  cancelled_cheque_copy: { type: 'file' },
  profile_photo: { type:  'file' },
  certificate_path: { type: 'file' },
  income_proof_path: { type: 'file' },
  address_proof_path: { type: 'file' },
  client_signature_path: { type: 'file' },
  advisor_signature_path: { type: 'file' },
  agreement_copy_path: { type: 'file' },
  financial_analysis_path: { type: 'file' },
  other_document_path: { type: 'file' },
  is_active: { type: 'select', options: ['true', 'false'] },
};

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
  const [impact, setImpact] = useState<ImpactDeclaration>({ 
    financial: false, 
    risk: false, 
    asset_allocation: false, 
    portfolio: false, 
    product_basket: false,
    target_portfolio: false,
    other: false,
    other_details: "",
    remarks: "" 
  });
  const [purposeOfEdit, setPurposeOfEdit] = useState<string[]>([]);
  const [confirmationMode, setConfirmationMode] = useState<string[]>([]);
  const [confirmationReference, setConfirmationReference] = useState("");
  const [currentModuleValues, setCurrentModuleValues] = useState<Record<string, any>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const allEmployees = await IAMasterService.listEmployees();
        if (allEmployees) {
          // Filter valid employees and map to consistent format if needed
          setEmployees((allEmployees as any[]).filter(emp => emp && typeof emp === "object" && (emp.id || (emp as any)._id)));
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

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
        product_basket: r.impact_declaration?.product_basket || false,
        target_portfolio: r.impact_declaration?.target_portfolio || false,
        other: r.impact_declaration?.other || false,
        other_details: r.impact_declaration?.other_details || "",
        remarks: r.impact_declaration?.remarks || ""
      });
      setPurposeOfEdit(r.purpose_of_edit ? r.purpose_of_edit.split(',') : []);
      setConfirmationMode(r.confirmation_mode ? r.confirmation_mode.split(',') : []);
      setConfirmationReference(r.confirmation_reference || "");
      
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
      setIsDirty(false);
    }
  };

  const handleAddField = () => {
    setProposedChanges([...proposedChanges, { field: "", current: "", proposed: "", reason: "" }]);
    setIsDirty(true);
  };

  const handleRemoveField = (index: number) => {
    const next = [...proposedChanges];
    next.splice(index, 1);
    setProposedChanges(next);
    setIsDirty(true);
  };

  const updateField = (index: number, key: keyof ProposedChange, value: any) => {
    const next = [...proposedChanges];
    let finalValue = value;

    if (key === 'proposed') {
      const fieldName = next[index].field || "";
      const config = FIELD_CONFIG[fieldName];
      const isDate = fieldName.toLowerCase().includes("dob") || fieldName.toLowerCase().includes("date");
      
      if (isDate && config?.type !== 'date' && typeof value === 'string') {
        const digits = value.replace(/\D/g, "").slice(0, 8);
        
        let dayStr = digits.substring(0, 2);
        let monthStr = digits.substring(2, 4);
        let yearStr = digits.substring(4, 8);

        if (monthStr.length === 2) {
          const mVal = parseInt(monthStr, 10);
          if (mVal > 12) {
            monthStr = "12";
          }
        }

        if (dayStr.length === 2) {
          const dVal = parseInt(dayStr, 10);
          let maxDays = 31;
          
          if (monthStr.length === 2) {
            const mVal = parseInt(monthStr, 10);
            if (mVal === 2) {
              maxDays = 29;
              if (yearStr.length === 4) {
                const yVal = parseInt(yearStr, 10);
                const isLeap = (yVal % 4 === 0 && yVal % 100 !== 0) || (yVal % 400 === 0);
                maxDays = isLeap ? 29 : 28;
              }
            } else if ([4, 6, 9, 11].includes(mVal)) {
              maxDays = 30;
            }
          }
          
          if (dVal > maxDays) {
            dayStr = String(maxDays).padStart(2, '0');
          }
        }

        let formatted = dayStr;
        if (digits.length > 2) {
          formatted += "-" + monthStr;
        }
        if (digits.length > 4) {
          formatted += "-" + yearStr;
        }
        finalValue = formatted;
      }
    }

    next[index][key] = finalValue;
    
    if (key === 'field' && currentModuleValues[value] !== undefined) {
      next[index]['current'] = currentModuleValues[value];
    }
    
    setProposedChanges(next);
    setIsDirty(true);
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
      const parts = path.split('.');
      const extension = parts.length > 1 ? parts[parts.length - 1] : "pdf";
      const filename = path.split('/').pop()?.split('_').slice(3).join('_') || `document.${extension}`;
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
    // Validation: Check if every proposed change has a reason
    const missingReasons = proposedChanges.filter(cp => !cp.field || !cp.reason || cp.reason.trim() === "");
    if (proposedChanges.length > 0 && missingReasons.length > 0) {
      toast.error("Validation Error: Please provide a reason for every changed field.");
      return;
    }

    // Validation: Check for invalid or incomplete date formats in proposed changes
    for (const cp of proposedChanges) {
      const fieldName = cp.field || "";
      const isDate = fieldName.toLowerCase().includes("dob") || fieldName.toLowerCase().includes("date");
      const config = FIELD_CONFIG[fieldName];
      
      if (isDate && config?.type !== 'date' && typeof cp.proposed === 'string' && cp.proposed.length > 0) {
        // Expected format is DD-MM-YYYY (exactly 10 characters)
        const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[0-9]{4}$/;
        if (!dateRegex.test(cp.proposed)) {
          toast.error(`Validation Error: Please enter a valid date in DD-MM-YYYY format for ${fieldName.toUpperCase()}.`);
          return;
        }

        const parts = cp.proposed.split('-');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Verify month max days calendar rules
        let maxDays = 31;
        if (month === 2) {
          const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
          maxDays = isLeap ? 29 : 28;
        } else if ([4, 6, 9, 11].includes(month)) {
          maxDays = 30;
        }

        const monthNames = [
          "", "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];

        if (day > maxDays) {
          toast.error(`Validation Error: ${fieldName.toUpperCase()} is invalid. ${monthNames[month]} has only ${maxDays} days for year ${year}.`);
          return;
        }

        // Spouse Age Validation: Must be 18+
        if (fieldName.toLowerCase() === 'spouse_dob') {
          const parts = cp.proposed.split('-');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
          const year = parseInt(parts[2], 10);
          
          const birthDate = new Date(year, month, day);
          const today = new Date();
          
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age < 18) {
            toast.error("Validation Error: Spouse must be 18 years or older.");
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      await RectificationService.update(id, { 
        proposed_changes: proposedChanges,
        justification_details: justification,
        impact_declaration: impact,
        purpose_of_edit: purposeOfEdit.join(','),
        confirmation_mode: confirmationMode.join(','),
        confirmation_reference: confirmationReference
      });
      toast.success("Rectification progress saved locally and in vault.");
      await loadData(true);
      setIsDirty(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-1 mb-8 print:hidden">
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
              {step.label === "Verification" && (rectification.status === "DRAFT" || rectification.status === "UPDATED") && !rectification.signed_form_path && !isDirty && (rectification.proposed_changes?.length > 0) ? (
                <label className="cursor-pointer block">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => { handleFileUpload(e, "signed_form"); setIsDirty(true); }}
                    disabled={uploading}
                  />
                  <div className={`p-4 rounded-xl border transition-all duration-300 hover:ring-2 hover:ring-emerald-500/50 ${
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
                        {uploading && activeUploadType === "signed_form" ? <Loader2 className="w-4 h-4 animate-spin" /> : <step.icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">{step.label}</h4>
                        <p className="text-[9px] font-bold opacity-50">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </label>
              ) : (
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
              )}
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" className="gap-2 font-black uppercase text-[10px] tracking-widest w-full md:w-auto justify-start" onClick={() => router.push('/rectification')}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
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
            disabled={downloadingPdf || isDirty || (rectification.proposed_changes?.length === 0)}
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
            Download Form
          </Button>
          
          {/* Action: Upload (Mandatory for all before approval) */}
          {(rectification.status === "DRAFT" || rectification.status === "UPDATED") && !rectification.signed_form_path && !isDirty && (rectification.proposed_changes?.length > 0) && (
            <div className="relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => { handleFileUpload(e, "signed_form"); setIsDirty(true); }}
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
            <h1 className="text-2xl font-bold tracking-tight">
              {rectification.module === 'DEACTIVATION' ? "Client Deactivation Authorization Form" : "Data Correction Authorization Form"}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              {rectification.module === 'DEACTIVATION' ? "Permanent Termination of Service Authorization" : "Pre-Edit Approval for Version Creation"}
            </p>
        </div>

        <div className="space-y-10">
          
          {/* SECTION 1: BASIC IDENTIFICATION */}
          <section>
            <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">1</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Basic Identification</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 sm:px-4">
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
              {rectification.module !== 'CLIENT' && rectification.module !== 'DEACTIVATION' && (
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase opacity-40">Current Version</Label>
                  <div className="font-bold border-b border-black/10 pb-1">v{rectification.current_version}</div>
                </div>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 sm:px-4">
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
                              checked={purposeOfEdit.includes(opt)} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPurposeOfEdit([...purposeOfEdit, opt]);
                                  setIsDirty(true);
                                }
                                else {
                                  setPurposeOfEdit(purposeOfEdit.filter(m => m !== opt));
                                  setIsDirty(true);
                                }
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
                            <TableHead className="text-[9px] font-black text-black flex items-center gap-1">
                              Reason <span className="text-red-500">*</span>
                            </TableHead>
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
                                                    .filter(f => {
                                                      // Single source-of-truth filter for all non-rectifiable CLIENT fields
                                                      const NON_RECTIFIABLE = new Set([
                                                        // System / Auth
                                                        'id', 'user_id', 'role', 'password', 'tenant_id',
                                                        'created_at', 'updated_at', 'deleted_at', 'is_active', 'status',
                                                        'client_id', 'root_profile_id', 'parent_profile_id',
                                                        'version_number', 'record_id', 'custom_id', 'is_custom', 'base_custom_id',
                                                        // Document / File paths (system-managed)
                                                        'documents', 
                                                        // Note: We are now allowing rectification of these paths
                                                        // but they will go through the versioned upload process
                                                        'certificate_path', 
                                                        // Core Identity — immutable after onboarding
                                                        'client_name', 'name', 'client_code',
                                                        'pan_number', 'aadhar_number', 'passport_number', 'date_of_birth',
                                                        // KYC / Compliance audit
                                                        'kyc_verified', 'ckyc_number',
                                                        // IPV
                                                        'ipv_done_by_id', 'ipv_date',
                                                        // Advisor / IA
                                                        'advisor_name', 'advisor_registration_number',
                                                        // Dates — system-generated
                                                        'client_date', 'agreement_date',
                                                        // Audit trail
                                                        'rectification_serial_no',
                                                        // Assessment outcomes — managed via own modules
                                                        'risk_profile', 'investment_experience',
                                                        'investment_horizon', 'liquidity_needs', 'investment_objectives',
                                                      ]);
                                                      return !NON_RECTIFIABLE.has(f) || (rectification.module === 'DEACTIVATION' && f === 'is_active');
                                                    })
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
                                                    if (item.field === 'assigned_employee_id') {
                                                      const emp = employees.find(e => (e.id === val || (e as any)._id === val));
                                                      return emp ? (emp.name || (emp as any).full_name || String(val)) : String(val);
                                                    }
                                                    if (Array.isArray(val)) {
                                                        return val.map((v, i) => `${i + 1}. ${formatValue(v)}`).join("\n");
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
                                            (() => {
                                                const config = FIELD_CONFIG[item.field];
                                                const val = typeof item.proposed === 'object' ? JSON.stringify(item.proposed) : String(item.proposed || "");
                                                
                                                // Special case for database-driven dropdowns (Assigned Employee)
                                                if (item.field === 'assigned_employee_id') {
                                                    return (
                                                        <Select value={val} onValueChange={(v) => updateField(idx, 'proposed', v)}>
                                                            <SelectTrigger className="h-8 border-black/20 font-bold text-[10px] bg-white text-black">
                                                                <SelectValue placeholder="Select Employee..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white">
                                                                {employees.map(emp => (
                                                                    <SelectItem key={emp.id || (emp as any)._id} value={emp.id || (emp as any)._id} className="text-[10px] text-black focus:bg-slate-100 focus:text-black">
                                                                        {emp.name || (emp as any).full_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }

                                                if (config?.type === 'select') {
                                                    return (
                                                        <Select value={val} onValueChange={(v) => updateField(idx, 'proposed', v)}>
                                                            <SelectTrigger className="h-8 border-black/20 font-bold text-[10px] bg-white text-black">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white">
                                                                {config.options?.map(opt => (
                                                                    <SelectItem key={opt} value={opt} className="text-[10px] text-black focus:bg-slate-100 focus:text-black">
                                                                        {opt}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }
                                                
                                                if (config?.type === 'file') {
                                                    const isTemp = typeof val === 'string' && val.includes('/proposed/');
                                                    return (
                                                        <div className="flex flex-col gap-2">
                                                            {val && (
                                                                <div className="flex items-center gap-2 mb-1 p-1.5 bg-primary/5 rounded border border-primary/10">
                                                                    <FileText className="w-3 h-3 text-primary" />
                                                                    <span className="text-[9px] font-mono truncate max-w-[120px]">
                                                                        {val.split('/').pop()}
                                                                    </span>
                                                                    {isTemp && <Badge className="text-[8px] h-3 px-1 bg-amber-500 hover:bg-amber-600">PENDING</Badge>}
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-4 w-4 ml-auto"
                                                                        onClick={() => {
                                                                            // Handle viewing the file
                                                                            window.open(RectificationService.getStorageUrl(id, 'proposed_change', val), '_blank');
                                                                        }}
                                                                    >
                                                                        <FileDown className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            <div className="relative">
                                                                <input 
                                                                    type="file" 
                                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        setUploading(true);
                                                                        try {
                                                                            const res = await RectificationService.uploadSignedForm(id, file, "proposed_change");
                                                                            updateField(idx, 'proposed', res.document_path);
                                                                            toast.success("Document uploaded for rectification");
                                                                        } catch (error) {
                                                                            toast.error("Failed to upload proposed document");
                                                                        } finally {
                                                                            setUploading(false);
                                                                        }
                                                                    }}
                                                                />
                                                                <Button variant="outline" size="sm" className="w-full h-8 gap-2 text-[9px] border-dashed border-primary/30 text-primary">
                                                                    <Upload className="w-3 h-3" />
                                                                    {val ? "Replace File" : "Upload Proposed File"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const isDateText = (item.field || "").toLowerCase().includes("dob") || (item.field || "").toLowerCase().includes("date");
                                                
                                                // Calculate if spouse age is < 18 for inline error feedback
                                                let isSpouseUnderage = false;
                                                if ((item.field || "").toLowerCase() === 'spouse_dob' && typeof val === 'string' && val.length === 10) {
                                                    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[0-9]{4}$/;
                                                    if (dateRegex.test(val)) {
                                                        const parts = val.split('-');
                                                        const day = parseInt(parts[0], 10);
                                                        const month = parseInt(parts[1], 10) - 1;
                                                        const year = parseInt(parts[2], 10);
                                                        const birthDate = new Date(year, month, day);
                                                        const today = new Date();
                                                        let age = today.getFullYear() - birthDate.getFullYear();
                                                        const m = today.getMonth() - birthDate.getMonth();
                                                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                            age--;
                                                        }
                                                        if (age < 18) {
                                                            isSpouseUnderage = true;
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div className="space-y-1">
                                                        <Input 
                                                            type={config?.type || 'text'}
                                                            className={`h-8 font-bold text-[10px] ${isSpouseUnderage ? 'border-red-500 bg-red-50/10 text-red-500 focus-visible:ring-red-500' : 'border-black/20'}`} 
                                                            value={val} 
                                                            placeholder={isDateText && config?.type !== 'date' ? "DD-MM-YYYY" : undefined}
                                                            onChange={(e) => updateField(idx, 'proposed', e.target.value)}
                                                        />
                                                        {isSpouseUnderage && (
                                                            <p className="text-[8px] font-bold text-red-500 uppercase tracking-tighter">
                                                                Spouse must be 18+ years old
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div className="text-[10px] font-black whitespace-pre-wrap max-w-xs leading-relaxed">
                                                {(() => {
                                                    const formatValue = (val: any): string => {
                                                        if (val === null || val === undefined) return "---";
                                                        
                                                        // If it's a file path, show a friendly name or icon
                                                        if (typeof val === 'string' && (val.includes('/') || val.includes('\\'))) {
                                                            const config = FIELD_CONFIG[item.field];
                                                            if (config?.type === 'file') {
                                                                return `📄 ${val.split('/').pop()}`;
                                                            }
                                                        }

                                                        if (item.field === 'assigned_employee_id') {
                                                          const emp = employees.find(e => (e.id === val || (e as any)._id === val));
                                                          return emp ? (emp.name || (emp as any).full_name || String(val)) : String(val);
                                                        }
                                                        if (Array.isArray(val)) {
                                                            return val.map((v, i) => `${i + 1}. ${formatValue(v)}`).join("\n");
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
                                            <div className="relative">
                                                <Input 
                                                    className={`h-8 border-black/20 text-xs ${!item.reason ? 'border-red-500/50 bg-red-50/10' : ''}`} 
                                                    value={item.reason}
                                                    placeholder="Mandatory reason..."
                                                    onChange={(e) => updateField(idx, 'reason', e.target.value)}
                                                />
                                                {!item.reason && <div className="absolute right-2 top-2.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
                                            </div>
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
                      onChange={(e) => {
                         setJustification({...justification, q1: e.target.value});
                         setIsDirty(true);
                       }}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Detail the discovered inaccuracy..."
                   />
                </div>
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">2. Why is change required?</Label>
                   <Textarea 
                      value={justification.q2} 
                      onChange={(e) => {
                         setJustification({...justification, q2: e.target.value});
                         setIsDirty(true);
                       }}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Explain why this correction is necessary (Compliance, Client Request, etc.)"
                   />
                </div>
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">3. Source of revised data?</Label>
                   <Textarea 
                      value={justification.q3} 
                      onChange={(e) => {
                         setJustification({...justification, q3: e.target.value});
                         setIsDirty(true);
                       }}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent min-h-[60px]"
                      placeholder="Mention the physical document or source used for verification..."
                   />
                </div>
            </div>
          </section>

          {/* SECTION 6: CLIENT CONFIRMATION */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">6</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Client Confirmation (If Available)</h2>
            </div>
            <div className="px-4 space-y-4">
                <div className="flex gap-6 flex-wrap">
                    {["Written/Email", "Verbal", "Video Call", "Not applicable"].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                           <Checkbox 
                              checked={confirmationMode.includes(opt)} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setConfirmationMode([...confirmationMode, opt]);
                                  setIsDirty(true);
                                }
                                else {
                                  setConfirmationMode(confirmationMode.filter(m => m !== opt));
                                  setIsDirty(true);
                                }
                              }}
                              disabled={rectification?.status === "APPROVED"} 
                              className="w-5 h-5 border-black" 
                           />
                           <span className="text-xs font-bold uppercase">{opt}</span>
                        </div>
                    ))}
                </div>
                <div>
                   <Label className="text-[10px] font-black uppercase opacity-60">Reference</Label>
                   <Input 
                      value={confirmationReference} 
                      onChange={(e) => {
                         setConfirmationReference(e.target.value);
                         setIsDirty(true);
                       }}
                      disabled={rectification?.status === "APPROVED"}
                      className="text-sm border-0 border-b border-black/10 mt-1 pb-2 shadow-none focus-visible:ring-0 rounded-none bg-transparent"
                      placeholder="e.g. Email Date, Call Log ID..."
                   />
                </div>
            </div>
          </section>

          {/* SECTION: COMPLIANCE DOCUMENTATION */}
          {rectification.is_investor_requested && (
            <section className="print:hidden">
               <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-emerald-500 mb-6">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-900">Compliance Documentation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                 {/* 1. Investor Request Copy */}
                 <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-none overflow-hidden h-full">
                    <CardHeader className="p-4 bg-emerald-500/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-900">
                        {confirmationMode.includes("Video Call") ? (
                          <Video className="w-4 h-4" />
                        ) : confirmationMode.includes("Verbal") ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )} 
                        {confirmationMode.includes("Video Call") 
                          ? "Investor Video Evidence" 
                          : confirmationMode.includes("Verbal") 
                            ? "Investor Verbal Evidence (Audio)" 
                            : "Investor Request Evidence"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {rectification.investor_request_path ? (
                        <div className="flex items-center justify-between p-3 bg-white/50 border border-emerald-500/20 rounded-lg">
                          <div className="flex items-center gap-3 overflow-hidden">
                             {rectification.investor_request_path.match(/\.(mp3|wav|m4a|ogg|aac)$/i) ? (
                               <Music className="w-5 h-5 text-emerald-600 shrink-0" />
                             ) : rectification.investor_request_path.match(/\.(mp4|webm|mov|mkv)$/i) ? (
                               <Video className="w-5 h-5 text-emerald-600 shrink-0" />
                             ) : (
                               <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                             )}
                             <span className="text-[10px] font-bold truncate text-emerald-900">
                               {rectification.investor_request_path.split('/').pop()?.split('_').slice(3).join('_') || 
                                (confirmationMode.includes("Video Call") ? "Video_Evidence.mp4" : confirmationMode.includes("Verbal") ? "Audio_Evidence.mp3" : "Investor_Request.pdf")}
                             </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {rectification.investor_request_path.match(/\.(mp3|wav|m4a|ogg|aac)$/i) && (
                                <audio controls className="h-6 w-32 mr-2 scale-75 origin-right">
                                    <source src={`${process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:8001'}/api/bridge/storage${rectification.investor_request_path}`} />
                                </audio>
                            )}
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-500/10" onClick={() => handleDocDownload("investor_request", rectification.investor_request_path!)}>
                               <FileDown className="w-3.5 h-3.5" />
                            </Button>
                            {rectification?.status !== "APPROVED" && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500" onClick={() => { handleDeleteDoc("investor_request"); setIsDirty(true); }}>
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
                               {confirmationMode.includes("Video Call") ? (
                                 <Video className="w-5 h-5 text-emerald-700 animate-pulse" />
                               ) : confirmationMode.includes("Verbal") ? (
                                 <Mic className="w-5 h-5 text-emerald-700 animate-pulse" />
                               ) : (
                                 <AlertCircle className="w-5 h-5 text-emerald-700" />
                               )}
                               <p className="text-[9px] font-black uppercase text-emerald-800">
                                 {confirmationMode.includes("Video Call") 
                                   ? "Missing Video Recording" 
                                   : confirmationMode.includes("Verbal") 
                                     ? "Missing Audio Proof" 
                                     : "Missing Request Copy"}
                               </p>
                               <div className="relative w-full">
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => { handleFileUpload(e, "investor_request"); setIsDirty(true); }}
                                    disabled={uploading}
                                    accept={confirmationMode.includes("Video Call") ? "video/*,audio/*" : confirmationMode.includes("Verbal") ? "audio/*" : undefined}
                                  />
                                  <Button variant="outline" size="sm" className="w-full text-[9px] font-black uppercase h-7 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-900">
                                    {confirmationMode.includes("Video Call") 
                                      ? "Upload Video" 
                                      : confirmationMode.includes("Verbal") 
                                        ? "Upload Recording" 
                                        : "Upload Copy"}
                                  </Button>
                               </div>
                             </>
                           )}
                        </div>
                      )}
                    </CardContent>
                 </Card>

                 {/* 2. IA Signed Authorization */}
                {!isDirty && (rectification.proposed_changes?.length > 0) && (
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
                                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500" onClick={() => { handleDeleteDoc("signed_form"); setIsDirty(true); }}>
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
                                     onChange={(e) => { handleFileUpload(e, "signed_form"); setIsDirty(true); }}
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
                )}
              </div>
            </section>
           )}

          {/* SECTION 7: IMPACT DECLARATION */}
          <section>
             <div className="bg-black/5 p-4 flex items-center gap-3 border-l-4 border-black mb-6">
              <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">7</div>
              <h2 className="text-sm font-black uppercase tracking-widest">Impact Declaration</h2>
            </div>
            <div className="px-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    {/* Financial */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-financial"
                          checked={impact.financial} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, financial: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-financial" className="text-xs font-bold uppercase cursor-pointer">Financial Analysis</Label>
                    </div>
                    {/* Risk */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-risk"
                          checked={impact.risk} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, risk: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-risk" className="text-xs font-bold uppercase cursor-pointer">Risk Profile</Label>
                    </div>
                    {/* Asset Allocation */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-aa"
                          checked={impact.asset_allocation} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, asset_allocation: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-aa" className="text-xs font-bold uppercase cursor-pointer">Asset Allocation</Label>
                    </div>
                    {/* Portfolio */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-portfolio"
                          checked={impact.portfolio} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, portfolio: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-portfolio" className="text-xs font-bold uppercase cursor-pointer">Portfolio / Holdings</Label>
                    </div>
                    {/* Product Basket */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-basket"
                          checked={impact.product_basket} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, product_basket: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-basket" className="text-xs font-bold uppercase cursor-pointer">Product Basket</Label>
                    </div>
                    {/* Target Portfolio */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-target"
                          checked={impact.target_portfolio} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, target_portfolio: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-target" className="text-xs font-bold uppercase cursor-pointer">Target Portfolio</Label>
                    </div>
                    {/* Others */}
                    <div className="flex items-center gap-3 hover:bg-black/5 p-2 rounded-md transition-colors">
                        <Checkbox 
                          id="impact-other"
                          checked={impact.other} 
                          onCheckedChange={(val) => {
                             setImpact({...impact, other: !!val});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"} 
                          className="w-5 h-5 border-black/20" 
                        />
                        <Label htmlFor="impact-other" className="text-xs font-bold uppercase cursor-pointer text-orange-600">Others</Label>
                    </div>
                </div>

                {impact.other && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-[9px] font-black uppercase text-orange-600 mb-1 block">Specify Other Impact Areas</Label>
                      <Textarea 
                          value={impact.other_details || ""} 
                          onChange={(e) => {
                             setImpact({...impact, other_details: e.target.value});
                             setIsDirty(true);
                           }}
                          disabled={rectification?.status === "APPROVED"}
                          className="text-[11px] font-medium leading-relaxed border-0 border-b border-orange-200 shadow-none focus-visible:ring-0 rounded-none bg-orange-50/30 p-2 min-h-[60px]"
                          placeholder="Describe the other impact areas..."
                      />
                  </div>
                )}

                <div>
                    <Label className="text-[9px] font-black uppercase opacity-40 mb-1 block">Remarks / Mitigation</Label>
                    <Textarea 
                        value={impact.remarks || ""} 
                        onChange={(e) => {
                           setImpact({...impact, remarks: e.target.value});
                           setIsDirty(true);
                         }}
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
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                {rectification.module === 'DEACTIVATION' ? "IA TERMINATION AUTHORIZATION" : "IA Authorization Case"}
              </h2>
            </div>
            <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-white p-4 border border-black/10 shadow-sm">
                    <Checkbox checked={!!rectification.signed_form_path} disabled className="w-6 h-6 border-black" />
                    <p className="text-[11px] font-black uppercase leading-tight">
                        {rectification.module === 'DEACTIVATION' 
                          ? "I, THE INVESTMENT ADVISER, HAVE REVIEWED THE TERMINATION JUSTIFICATION AND HEREBY AUTHORIZE THE PERMANENT DEACTIVATION OF THIS CLIENT ACCOUNT."
                          : "I, THE INVESTMENT ADVISER, HAVE REVIEWED THE JUSTIFICATION AND UPLOADED EVIDENCE (IA SIGNED FORM), AND HEREBY AUTHORIZE THIS DATA RECTIFICATION."
                        }
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-8">
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
