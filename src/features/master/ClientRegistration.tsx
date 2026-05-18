"use client";

import React, { useState } from "react";
import { 
  UserPlus, 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Building, 
  TrendingUp, 
  ShieldCheck,
  Loader2,
  CheckCircle2,
  FolderOpen,
  UploadCloud,
  Eye,
  EyeOff,
  Check,
  X,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { RegistrationPreviewModal } from "./components/RegistrationPreviewModal";
import { useRouter } from "next/navigation";
import { RectificationService, RectificationResponse } from "@/core/services/rectification.service";
import { History } from "lucide-react";

interface ClientRegistrationFormProps {
  
  initialData?: ClientCreate;
  clientId?: string;
  isEdit?: boolean;
}

const REQUIRED_DOCUMENTS = [
  "Signed Form",
  "PAN Card",
  "Aadhar Card",
  "Cancelled Cheque",
  "Photo (Passport size)",
  "Address Proof",
  "Income Proof",
  "Client Agreement",
  "Signature"
];

const STORAGE_KEY = "client_registration_draft";

const DEFAULT_FORM_DATA: ClientCreate = {
  email: "",
  password: "",
  client_code: "",
  client_name: "",
  date_of_birth: "",
  pan_number: "",
  phone_number: "",
  address: "",
  occupation: "",
  gender: "",
  marital_status: "",
  nationality: "Indian",
  residential_status: "Resident Individual",
  tax_residency: "India",
  pep_status: "Not a PEP",
  father_name: "",
  mother_name: "",
  spouse_name: "",
  aadhar_number: "",
  passport_number: "",
  annual_income: "" as any,
  net_worth: "" as any,
  income_source: "",
  fatca_compliance: "FATCA Compliant",
  existing_portfolio_value: "" as any,
  existing_portfolio_composition: "",
  bank_account_number: "",
  bank_name: "",
  bank_branch: "",
  ifsc_code: "",
  demat_account_number: "",
  trading_account_number: "",
  risk_profile: "Moderate",
  investment_experience: "Beginner",
  investment_objectives: "",
  investment_horizon: "Medium Term",
  liquidity_needs: "Medium",
  advisor_name: "",
  advisor_registration_number: "",
  client_date: new Date().toISOString().split('T')[0],
  nominee_name: "",
  nominee_relationship: "",
  previous_advisor_name: "",
  referral_source: "",
  declaration_signed: true,
  agreement_date: new Date().toISOString().split('T')[0],
  assigned_employee_id: "",
  kyc_verified: false,
  ckyc_number: "",
  ipv_done_by_id: "",
  ipv_date: "",
};

export default function ClientRegistrationForm({ 
  
  initialData, 
  clientId, 
  isEdit = false 
}: ClientRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [ipvSearchTerm, setIpvSearchTerm] = React.useState("");
  const [showIpvResults, setShowIpvResults] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordBlurred, setPasswordBlurred] = React.useState(false);
  const [assignedSearchTerm, setAssignedSearchTerm] = useState("");
  const [showAssignedResults, setShowAssignedResults] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<Record<string, File>>({});
  const [availableRectifications, setAvailableRectifications] = useState<RectificationResponse[]>([]);
  const [authorizedFields, setAuthorizedFields] = useState<string[]>([]);

  const isFieldDisabled = (fieldName: string) => {
    if (!isEdit) return false;
    // Permanent read-only fields — never editable via data rectification
    const IMMUTABLE_FIELDS = new Set([
      // Core Identity
      "client_name", "name", "client_code", "date_of_birth", "pan_number", "aadhar_number", "passport_number",
      // KYC / Compliance
      "kyc_verified", "ckyc_number",
      // IPV
      "ipv_done_by_id", "ipv_date",
      // Advisor / IA (system-assigned)
      "advisor_name", "advisor_registration_number",
      // System dates
      "client_date", "agreement_date",
      // System status & document paths
      "status", "is_active",
      "documents", "certificate_path", "financial_analysis_path",
      "other_document_path", "agreement_copy_path",
      "client_signature_path", "advisor_signature_path",
      // Audit trail
      "rectification_serial_no",
      // Assessment outcomes — managed via Risk Profile / Financial Analysis modules
      "risk_profile", "investment_experience", "investment_horizon", "liquidity_needs", "investment_objectives",
    ]);
    if (IMMUTABLE_FIELDS.has(fieldName)) return true;
    return !authorizedFields.includes(fieldName);
  };

  const [formData, setFormData] = useState<ClientCreate>(() => {
    if (initialData) return initialData;
    // Restore draft from localStorage for new registrations
    if (!isEdit) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Refresh system dates to today and never restore password
          return {
            ...DEFAULT_FORM_DATA,
            ...parsed,
            password: "",
            client_date: new Date().toISOString().split('T')[0],
            agreement_date: new Date().toISOString().split('T')[0],
          };
        }
      } catch (e) {
        console.warn("Failed to restore draft from localStorage", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return { ...DEFAULT_FORM_DATA };
  });

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const [iaMaster, allEmployees] = await Promise.all([
          IAMasterService.getLatest(),
          IAMasterService.listEmployees()
        ]);

        if (iaMaster) {
          // Auto-fill advisor info
          setFormData(prev => ({
            ...prev,
            advisor_name: iaMaster.name_of_ia,
            advisor_registration_number: iaMaster.ia_registration_number
          }));
        }

        if (allEmployees) {
          // Filter out invalid/junk entries (like 0 or null) and ensure each has an ID
          const validEmployees = (allEmployees as any[]).filter(
            emp => emp && typeof emp === "object" && (emp.id || emp._id)
          );
          setEmployees(validEmployees);
          
          // If we already have a selected ID (edit mode), find its name
          if (formData.ipv_done_by_id) {
            const selected = validEmployees.find(e => (e.id || e._id) === formData.ipv_done_by_id);
            if (selected) {
              setIpvSearchTerm(selected.full_name || selected.name || selected.name_of_employee || "");
            }
          }

          // Also handle Assigned Professional search term
          if (formData.assigned_employee_id) {
            const selected = validEmployees.find(e => (e.id || (e as any)._id) === formData.assigned_employee_id);
            if (selected) {
              setAssignedSearchTerm(selected.full_name || selected.name || selected.name_of_employee || "");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);
  
  // Fetch Client Data and Rectifications if in Edit mode and no initialData
  React.useEffect(() => {
    if (clientId && !initialData) {
      const fetchClientAndRectifications = async () => {
        try {
          const client = await MasterDataService.getClient(clientId);
          if (client) {
            setFormData(prev => ({
              ...prev,
              ...client,
              // Ensure numeric fields and dates are correctly handled
              annual_income: client.annual_income || "" as any,
              net_worth: client.net_worth || "" as any,
              existing_portfolio_value: client.existing_portfolio_value || "" as any,
              date_of_birth: client.date_of_birth?.split('T')[0] || "",
              client_date: client.client_date?.split('T')[0] || "",
              agreement_date: client.agreement_date?.split('T')[0] || "",
            }));
          }

            if (isEdit) {
                const response = await RectificationService.list({ client_id: clientId });
                const relevant = response.records.filter(r => r.module === "CLIENT");
                setAvailableRectifications(relevant);
            }

        } catch (error) {
          console.error("Failed to fetch client for edit", error);
          toast.error("Failed to load client data");
        }
      };
      fetchClientAndRectifications();
    }
  }, [clientId, initialData, isEdit]);

  // Sync formData with initialData when it changes (Edit Mode prop)
  React.useEffect(() => {
    if (isEdit && initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        annual_income: initialData.annual_income || "" as any,
        net_worth: initialData.net_worth || "" as any,
        existing_portfolio_value: initialData.existing_portfolio_value || "" as any,
        date_of_birth: initialData.date_of_birth?.split('T')[0] || "",
        client_date: initialData.client_date?.split('T')[0] || "",
        agreement_date: initialData.agreement_date?.split('T')[0] || "",
      }));
    }
  }, [initialData, isEdit]);

  // Fetch relevant Rectifications (DRAFT, UPDATED, or APPROVED) for tracing and unlocking
  React.useEffect(() => {
    if (isEdit && clientId) {
        RectificationService.list({ client_id: clientId }).then(response => {
            const relevant = response.records.filter(r => r.module === "CLIENT");
            setAvailableRectifications(relevant);
        }).catch(err => {
            console.error("Failed to load rectifications", err);
        });
    }
  }, [isEdit, clientId]);

  // Synchronize authorized fields based on the entered serial number
  React.useEffect(() => {
    if (isEdit && formData.rectification_serial_no && availableRectifications.length > 0) {
      const val = formData.rectification_serial_no.toUpperCase().trim();
      const rect = availableRectifications.find(r => r.serial_no === val);
      if (rect && rect.proposed_changes) {
        try {
          const changes = typeof rect.proposed_changes === 'string' ? JSON.parse(rect.proposed_changes) : rect.proposed_changes;
          const fields = changes.map((c: any) => c.field);
          setAuthorizedFields(fields);
        } catch (e) {
          console.error("Parse error in rectification sync", e);
        }
      } else {
        setAuthorizedFields([]);
      }
    } else if (isEdit && !formData.rectification_serial_no) {
      setAuthorizedFields([]);
    }
  }, [formData.rectification_serial_no, availableRectifications, isEdit]);

  // Robustly sync Search Terms for Edit Mode when either employees or formData changes
  React.useEffect(() => {
    if (employees.length > 0) {
      if (formData.ipv_done_by_id) {
        const selected = employees.find(e => (e.id || (e as any)._id) === formData.ipv_done_by_id);
        if (selected) {
          setIpvSearchTerm(selected.full_name || selected.name || selected.name_of_employee || "");
        }
      }
      if (formData.assigned_employee_id) {
        const selected = employees.find(e => (e.id || (e as any)._id) === formData.assigned_employee_id);
        if (selected) {
          setAssignedSearchTerm(selected.full_name || selected.name || selected.name_of_employee || "");
        }
      }
    }
  }, [employees, formData.ipv_done_by_id, formData.assigned_employee_id]);

  // Auto-save form data to localStorage (only in create mode, debounced)
  React.useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => {
      try {
        // Exclude password from persisted draft for security
        const { password, ...draftData } = formData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
      } catch (e) {
        console.warn("Failed to save draft to localStorage", e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, isEdit]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(formData.date_of_birth);
  const isUnderage = formData.date_of_birth !== "" && currentAge < 18;

  const passwordCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };

  const getMissingPasswordRequirements = () => {
    const missing = [];
    if (!passwordCriteria.length) missing.push("8+ characters");
    if (!passwordCriteria.upper) missing.push("one Uppercase letter");
    if (!passwordCriteria.lower) missing.push("one Lowercase letter");
    if (!passwordCriteria.number) missing.push("one Number (0-9)");
    if (!passwordCriteria.special) missing.push("one Special character");
    return missing;
  };

  const missingReqs = getMissingPasswordRequirements();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value),
      }));
    } else if (name === "ckyc_number") {
      // Restrict to Alphanumeric and Max 14 characters, auto-uppercase
      const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 14);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else if (name === "ifsc_code") {
      // Restrict to Alphanumeric and Max 11 characters, auto-uppercase
      const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else if (name === "pan_number") {
      // Restrict to Alphanumeric and Max 10 characters, auto-uppercase
      const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else if (name === "phone_number") {
      // Restrict to Digits and Max 10 characters
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else if (["client_name", "father_name", "mother_name", "spouse_name", "nominee_name", "nominee_relationship"].includes(name)) {
      // Restrict to alphabetical characters and spaces
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date_of_birth && currentAge < 18) {
      toast.error("Client must be at least 18 years old.");
      return;
    }
    if (!isEdit && activeTab === "documents") {
        const missingDocs = REQUIRED_DOCUMENTS.filter(doc => !pendingDocuments[doc]);
        if (missingDocs.length > 0) {
            toast.error(`Missing mandatory documents: ${missingDocs.join(', ')}`);
            setActiveTab("documents");
            return;
        }
    }

    // If submitted from a non-document tab (e.g. via Enter key), proceed to next step instead of preview
    if (activeTab !== "documents") {
        const tabs = ["personal", "financial", "bank", "investment", "compliance", "documents"];
        const nextIndex = tabs.indexOf(activeTab) + 1;
        if (nextIndex < tabs.length) {
          setActiveTab(tabs[nextIndex]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    setShowPreview(true);
  };

  const handleFinalConfirm = async () => {
    setLoading(true);
    const submissionData = {
      ...formData,
      annual_income: Number(formData.annual_income) || 0,
      net_worth: Number(formData.net_worth) || 0,
      existing_portfolio_value: Number(formData.existing_portfolio_value) || 0,
      assigned_employee_id: formData.assigned_employee_id || undefined,
      ipv_done_by_id: formData.ipv_done_by_id || undefined,
    };

    try {
      if (isEdit && clientId) {
          await MasterDataService.updateClient(clientId, submissionData);
          toast.success("Client updated successfully!");
          router.push(`/clients/${clientId}`);
      } else {
          const client = await MasterDataService.createClient(submissionData);
          const newClientId = client.user_id || client.id;
          
          if (newClientId && Object.keys(pendingDocuments).length > 0) {
              toast.info("Registration saving. Uploading secure documents...", { duration: 5000 });
              for (const [docType, file] of Object.entries(pendingDocuments)) {
                  try {
                      await MasterDataService.uploadDocument(newClientId, file, docType);
                  } catch (e) {
                      console.error(`Failed to upload ${docType}`, e);
                  }
              }
          }
          // Clear the localStorage draft on successful registration
          localStorage.removeItem(STORAGE_KEY);
          toast.success("Client registered and documents secured!");
          router.push("/clients");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'register'} client`);
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full w-10 h-10 border-primary/20 bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-all shrink-0 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isEdit ? `Editing: ${formData.client_name}` : 'New Client Registration'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {isEdit ? 'Update the client information in your secure private database.' : 'Complete the onboarding process.'}
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            {isEdit && (
              <div className="p-4 sm:p-6 bg-primary/5 border-b border-primary/20 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Regulatory-Compliant Data Rectification
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">If this edit is part of a formalized authorization, attach the approved serial number for the audit trail.</p>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-64">
                    {formData.rectification_serial_no && authorizedFields.length > 0 && (
                        <Button 
                            type="button"
                            variant="outline" 
                            size="sm" 
                            className={`w-full ${
                                availableRectifications.find(r => r.serial_no === formData.rectification_serial_no)?.status === 'APPROVED' 
                                ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30' 
                                : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/30'
                            }`}
                            onClick={() => {
                                const rect = availableRectifications.find(r => r.serial_no === formData.rectification_serial_no);
                                if (!rect) return;
                                const changes = typeof rect.proposed_changes === 'string' ? JSON.parse(rect.proposed_changes) : rect.proposed_changes;
                                const updates: any = {};
                                changes.forEach((c: any) => { updates[c.field] = c.proposed; });
                                setFormData(prev => ({ ...prev, ...updates }));
                                toast.success(rect.status === 'APPROVED' ? "Auto-applied authorized values" : "Applied proposed values (Pending Approval)");
                            }}
                        >
                            {availableRectifications.find(r => r.serial_no === formData.rectification_serial_no)?.status === 'APPROVED' 
                                ? 'Apply Approved Values' 
                                : 'Apply Proposed (Draft)'}
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Input
                          placeholder="Paste or type E-Serial..."
                          value={formData.rectification_serial_no}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase().trim();
                            setFormData(prev => ({ ...prev, rectification_serial_no: val }));
                            // authorizedFields is now synced via useEffect
                          }}
                          className={`bg-background border-primary/20 text-xs h-9 ${
                            formData.rectification_serial_no && authorizedFields.length === 0 ? "border-red-500" : ""
                          }`}
                        />
                    </div>
                    {formData.rectification_serial_no && authorizedFields.length > 0 && availableRectifications.find(r => r.serial_no === formData.rectification_serial_no)?.status !== 'APPROVED' && (
                        <p className="text-[9px] text-orange-600 font-medium">Note: This rectification is not yet approved by IA.</p>
                    )}
                </div>
              </div>
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="w-full overflow-x-auto scrollbar-none bg-muted/30 border-b border-primary/10">
                <TabsList className="min-w-max h-auto p-0 flex bg-transparent rounded-none">
                  <TabsTrigger value="personal" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <UserPlus className="w-4 h-4" /> Personal
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <CreditCard className="w-4 h-4" /> Financial
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <Building className="w-4 h-4" /> Banking
                  </TabsTrigger>
                  <TabsTrigger value="investment" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <TrendingUp className="w-4 h-4" /> Investment
                  </TabsTrigger>
                  <TabsTrigger value="compliance" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <ShieldCheck className="w-4 h-4" /> Compliance
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="px-6 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm transition-all">
                    <FolderOpen className="w-4 h-4" /> Documents
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-8 pb-12 min-h-[500px]">
                <TabsContent value="personal" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Client Name *</Label>
                      <Input name="client_name" disabled={isFieldDisabled("client_name")} value={formData.client_name} onChange={handleChange} required placeholder="Full name as per PAN" />
                    </div>
                    <div className="space-y-2">
                      <Label className={isUnderage ? "text-red-500" : ""}>Date of Birth *</Label>
                      <DatePicker 
                        date={formData.date_of_birth} 
                        onChange={(val) => setFormData(prev => ({ ...prev, date_of_birth: val }))}
                        disabled={isFieldDisabled("date_of_birth")}
                        placeholder="Select Date of Birth"
                        fromYear={1930}
                        className={isUnderage ? "border-red-500 ring-offset-red-500 focus-visible:ring-red-500" : ""}
                      />
                      <p className={`text-[10px] italic ${isUnderage ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                        {isUnderage ? `Age is ${currentAge}. Must be 18+ years.` : "Age must be 18+ years."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Email (Login Username) *</Label>
                        <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="client@example.com" disabled={isFieldDisabled("email")} />
                    </div>
                    {!isEdit && (
                      <div className="space-y-2">
                          <Label className={passwordBlurred && missingReqs.length > 0 ? "text-red-500 font-medium" : ""}>
                            Password for Client Login *
                          </Label>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              name="password" 
                              disabled={isFieldDisabled("password")} 
                              value={formData.password} 
                              onChange={handleChange} 
                              onBlur={() => setPasswordBlurred(true)}
                              onFocus={() => setPasswordBlurred(false)}
                              required 
                              placeholder="Temporary password" 
                              className={`pr-10 ${passwordBlurred && missingReqs.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          
                          {passwordBlurred && missingReqs.length > 0 && (
                            <p className="text-[10px] text-red-500 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                              Missing: {missingReqs.join(", ")}.
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label>Residential Status *</Label>
                        <Select 
                          name="residential_status" disabled={isFieldDisabled("residential_status")} 
                          value={formData.residential_status} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, residential_status: val }))}
                          required
                        >
                          <SelectTrigger className="w-full bg-background/50 border-primary/20">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-primary/20">
                            <SelectItem value="Resident Individual">Resident Individual</SelectItem>
                            <SelectItem value="Non-Resident Indian">Non-Resident Indian</SelectItem>
                            <SelectItem value="Person of Indian Origin">Person of Indian Origin</SelectItem>
                            <SelectItem value="Foreign National">Foreign National</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    {formData.residential_status === "Resident Individual" ? (
                      <div className="space-y-2">
                          <Label>Aadhar Number *</Label>
                          <Input 
                            name="aadhar_number" disabled={isFieldDisabled("aadhar_number")} 
                            value={formData.aadhar_number} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                              setFormData(prev => ({ ...prev, aadhar_number: val }));
                            }} 
                            required 
                            placeholder="12 digit Aadhar" 
                            className={formData.aadhar_number && formData.aadhar_number.length !== 12 ? "border-orange-500" : ""}
                          />
                          {formData.aadhar_number && formData.aadhar_number.length !== 12 && (
                            <p className="text-[10px] text-orange-500">Must be 12 digits</p>
                          )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                          <Label>Passport Number *</Label>
                          <Input name="passport_number" disabled={isFieldDisabled("passport_number")} value={formData.passport_number} onChange={handleChange} required placeholder="Passport number" />
                      </div>
                    )}
                    <div className="space-y-2">
                        <Label>Nationality *</Label>
                        <Input name="nationality" disabled={isFieldDisabled("nationality")} value={formData.nationality} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <Label className={formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan_number) ? "text-orange-500 font-medium" : ""}>
                         PAN Number *
                       </Label>
                       <Input 
                         name="pan_number" 
                         disabled={isFieldDisabled("pan_number")} 
                         value={formData.pan_number} 
                         onChange={handleChange} 
                         required 
                         placeholder="ABCDE1234F" 
                         className={formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan_number) ? "border-orange-500" : ""}
                       />
                       {formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan_number) && (
                         <p className="text-[10px] text-orange-500">Invalid PAN format (e.g. ABCDE1234F).</p>
                       )}
                    </div>
                    <div className="space-y-2">
                      <Label className={formData.phone_number && !/^[6-9][0-9]{9}$/.test(formData.phone_number) ? "text-orange-500 font-medium" : ""}>
                        Phone Number *
                      </Label>
                      <Input 
                        type="tel" 
                        name="phone_number" 
                        disabled={isFieldDisabled("phone_number")} 
                        value={formData.phone_number} 
                        onChange={handleChange} 
                        required 
                        placeholder="9876543210" 
                        className={formData.phone_number && !/^[6-9][0-9]{9}$/.test(formData.phone_number) ? "border-orange-500" : ""}
                      />
                      {formData.phone_number && !/^[6-9][0-9]{9}$/.test(formData.phone_number) && (
                        <p className="text-[10px] text-orange-500">Invalid 10-digit mobile number.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Select 
                          name="gender" disabled={isFieldDisabled("gender")} 
                          value={formData.gender} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                          required
                        >
                          <SelectTrigger className="w-full bg-background/50 border-primary/20">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-primary/20">
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Marital Status *</Label>
                        <Select 
                          name="marital_status" disabled={isFieldDisabled("marital_status")} 
                          value={formData.marital_status} 
                          onValueChange={(val) => setFormData(prev => ({ ...prev, marital_status: val }))}
                          required
                        >
                          <SelectTrigger className="w-full bg-background/50 border-primary/20">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-primary/20">
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Permanent Address *</Label>
                    <Textarea name="address" disabled={isFieldDisabled("address")} value={formData.address} onChange={handleChange} required placeholder="Complete address with City, State, ZIP..." className="min-h-[100px]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Father's Name *</Label>
                      <Input name="father_name" disabled={isFieldDisabled("father_name")} value={formData.father_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Name *</Label>
                      <Input name="mother_name" disabled={isFieldDisabled("mother_name")} value={formData.mother_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Spouse Name (Optional)</Label>
                      <Input name="spouse_name" disabled={isFieldDisabled("spouse_name")} value={formData.spouse_name} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label>Tax Residency *</Label>
                        <Input name="tax_residency" disabled={isFieldDisabled("tax_residency")} value={formData.tax_residency} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>PEP Status *</Label>
                      <Select 
                        name="pep_status" disabled={isFieldDisabled("pep_status")} 
                        value={formData.pep_status} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, pep_status: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Not a PEP">Not a PEP</SelectItem>
                          <SelectItem value="PEP">Politically Exposed Person</SelectItem>
                          <SelectItem value="Family Member of PEP">Family Member of PEP</SelectItem>
                          <SelectItem value="Close Associate of PEP">Close Associate of PEP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>FATCA Compliance *</Label>
                      <Select 
                        name="fatca_compliance" disabled={isFieldDisabled("fatca_compliance")} 
                        value={formData.fatca_compliance} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, fatca_compliance: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Compliance" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="FATCA Compliant">FATCA Compliant</SelectItem>
                          <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                          <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <hr className="border-primary/10" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nominee Name</Label>
                      <Input name="nominee_name" disabled={isFieldDisabled("nominee_name")} value={formData.nominee_name} onChange={handleChange} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship with Nominee</Label>
                      <Input name="nominee_relationship" disabled={isFieldDisabled("nominee_relationship")} value={formData.nominee_relationship} onChange={handleChange} placeholder="e.g. Spouse, Son, Mother" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Professional (Employee/Partner) *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Type to search staff/partner..."
                        value={assignedSearchTerm}
                        onChange={(e) => {
                          setAssignedSearchTerm(e.target.value);
                          setShowAssignedResults(true);
                          if (!e.target.value) {
                            setFormData(prev => ({ ...prev, assigned_employee_id: "" }));
                          }
                        }}
                        onFocus={() => setShowAssignedResults(true)}
                        className="bg-background/50 border-primary/20 pr-10"
                        autoComplete="off"
                      />
                      {assignedSearchTerm && (
                        <button 
                          type="button"
                          onClick={() => {
                            setAssignedSearchTerm("");
                            setFormData(prev => ({ ...prev, assigned_employee_id: "" }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      )}

                      {showAssignedResults && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowAssignedResults(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-primary/20 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                            {employees
                              .filter(emp => {
                                const name = (emp.full_name || emp.name || emp.name_of_employee || "").toLowerCase();
                                const desig = (emp.designation || "").toLowerCase();
                                const search = assignedSearchTerm.toLowerCase();
                                return name.includes(search) || desig.includes(search);
                              })
                              .map((emp) => (
                                <div
                                  key={emp.id}
                                  className="p-3 hover:bg-primary/10 cursor-pointer border-b border-primary/5 last:border-0 flex flex-col transition-colors"
                                  onClick={() => {
                                    const name = emp.full_name || emp.name || emp.name_of_employee || "";
                                    setAssignedSearchTerm(name);
                                    setFormData(prev => ({ ...prev, assigned_employee_id: emp.id || "" }));
                                    setShowAssignedResults(false);
                                  }}
                                >
                                  <span className="font-medium text-sm text-foreground">
                                    {emp.full_name || emp.name || emp.name_of_employee || "Staff Member"}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {emp.designation || "Professional"}
                                  </span>
                                </div>
                              ))}
                            {employees.filter(emp => {
                                const name = (emp.full_name || emp.name || emp.name_of_employee || "").toLowerCase();
                                const desig = (emp.designation || "").toLowerCase();
                                const search = assignedSearchTerm.toLowerCase();
                                return name.includes(search) || desig.includes(search);
                            }).length === 0 && (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                No staff members found
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Select the Employee or Partner providing advisory services to this client.</p>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Annual Income (INR) *</Label>
                      <Input type="number" name="annual_income" disabled={isFieldDisabled("annual_income")} value={formData.annual_income} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Net Worth (INR) *</Label>
                      <Input type="number" name="net_worth" disabled={isFieldDisabled("net_worth")} value={formData.net_worth} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Source of Income *</Label>
                      <Select 
                        name="income_source" disabled={isFieldDisabled("income_source")} 
                        value={formData.income_source} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, income_source: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Salaried">Salaried</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Agriculture">Agriculture</SelectItem>
                          <SelectItem value="Investments">Investments</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation *</Label>
                      <Input name="occupation" disabled={isFieldDisabled("occupation")} value={formData.occupation} onChange={handleChange} required placeholder="Software Engineer, Doctor, etc." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Existing Portfolio Value (₹) *</Label>
                      <Input type="number" name="existing_portfolio_value" disabled={isFieldDisabled("existing_portfolio_value")} value={formData.existing_portfolio_value} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Existing Portfolio Composition</Label>
                    <Textarea name="existing_portfolio_composition" disabled={isFieldDisabled("existing_portfolio_composition")} value={formData.existing_portfolio_composition} onChange={handleChange} placeholder="Details of existing Equity, Mutual Funds, FDRs..." />
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Account Number *</Label>
                      <Input name="bank_account_number" disabled={isFieldDisabled("bank_account_number")} value={formData.bank_account_number} onChange={handleChange} placeholder="e.g. 1234567890" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name *</Label>
                      <Input name="bank_name" disabled={isFieldDisabled("bank_name")} value={formData.bank_name} onChange={handleChange} placeholder="e.g. HDFC Bank, ICICI Bank" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Branch *</Label>
                      <Input name="bank_branch" disabled={isFieldDisabled("bank_branch")} value={formData.bank_branch} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label className={formData.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code) ? "text-orange-500 font-medium" : ""}>
                        IFSC Code *
                      </Label>
                      <Input 
                        name="ifsc_code" 
                        disabled={isFieldDisabled("ifsc_code")} 
                        value={formData.ifsc_code} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. HDFC0001234" 
                        className={formData.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code) ? "border-orange-500" : ""}
                      />
                      {formData.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code) && (
                        <p className="text-[10px] text-orange-500">Invalid format (e.g. ABCD0123456). 5th char must be 0.</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Demat Account (Optional)</Label>
                      <Input name="demat_account_number" disabled={isFieldDisabled("demat_account_number")} value={formData.demat_account_number} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Trading Account (Optional)</Label>
                      <Input name="trading_account_number" disabled={isFieldDisabled("trading_account_number")} value={formData.trading_account_number} onChange={handleChange} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="investment" className="space-y-6 mt-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Risk Profile *</Label>
                      <Select 
                        name="risk_profile" disabled={isFieldDisabled("risk_profile")} 
                        value={formData.risk_profile} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, risk_profile: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Profile" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Conservative">Conservative</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Aggressive">Aggressive</SelectItem>
                          <SelectItem value="Very Aggressive">Very Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Investment Horizon *</Label>
                      <Select 
                        name="investment_horizon" disabled={isFieldDisabled("investment_horizon")} 
                        value={formData.investment_horizon} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, investment_horizon: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Horizon" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Short Term">Short Term (1-3 years)</SelectItem>
                          <SelectItem value="Medium Term">Medium Term (3-7 years)</SelectItem>
                          <SelectItem value="Long Term">Long Term (7+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Investment Objectives *</Label>
                    <Textarea name="investment_objectives" disabled={isFieldDisabled("investment_objectives")} value={formData.investment_objectives} onChange={handleChange} required placeholder="e.g. Wealth Creation, Pension Planning, Children Education..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Investment Experience *</Label>
                      <Select 
                        name="investment_experience" disabled={isFieldDisabled("investment_experience")} 
                        value={formData.investment_experience} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, investment_experience: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Experience" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Beginner">Beginner (0-2 years)</SelectItem>
                          <SelectItem value="Intermediate">Intermediate (2-5 years)</SelectItem>
                          <SelectItem value="Experienced">Experienced (5-10 years)</SelectItem>
                          <SelectItem value="Expert">Expert (10+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Liquidity Needs *</Label>
                      <Select 
                        name="liquidity_needs" disabled={isFieldDisabled("liquidity_needs")} 
                        value={formData.liquidity_needs} 
                        onValueChange={(val) => setFormData(prev => ({ ...prev, liquidity_needs: val }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/20">
                          <SelectValue placeholder="Select Needs" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/20">
                          <SelectItem value="Low">Low (can lock funds for long term)</SelectItem>
                          <SelectItem value="Medium">Medium (some funds may be needed)</SelectItem>
                          <SelectItem value="High">High (regular need for liquid funds)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-6 mt-0">
                  <div className="space-y-8">
                    {/* Advisor Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Advisor Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Advisor Name</Label>
                          <Input name="advisor_name" disabled={isFieldDisabled("advisor_name")} value={formData.advisor_name} onChange={handleChange} required readOnly className="bg-muted font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Advisor Registration Number</Label>
                          <Input name="advisor_registration_number" disabled={isFieldDisabled("advisor_registration_number")} value={formData.advisor_registration_number} onChange={handleChange} required readOnly className="bg-muted font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Previous Advisor Name (if any)</Label>
                          <Input name="previous_advisor_name" disabled={isFieldDisabled("previous_advisor_name")} value={formData.previous_advisor_name} onChange={handleChange} placeholder="e.g. Previous Firm Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Referral Source</Label>
                          <Select 
                            name="referral_source" disabled={isFieldDisabled("referral_source")} 
                            value={formData.referral_source} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, referral_source: val }))}
                          >
                            <SelectTrigger className="w-full bg-background/50 border-primary/20">
                              <SelectValue placeholder="Select Source" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-primary/20">
                              <SelectItem value="Existing Client">Existing Client</SelectItem>
                              <SelectItem value="Friend/Family">Friend/Family</SelectItem>
                              <SelectItem value="Online Search">Online Search</SelectItem>
                              <SelectItem value="Advertisement">Advertisement</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* KYC & IPV Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">KYC & IPV Details</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>KYC Verified Status *</Label>
                          <Select 
                            name="kyc_verified" disabled={isFieldDisabled("kyc_verified")} 
                            value={formData.kyc_verified ? "yes" : "no"} 
                            onValueChange={(val) => {
                              const isVerified = val === "yes";
                              setFormData(prev => ({ ...prev, kyc_verified: isVerified }));
                              if (!isVerified) {
                                toast.error("Please validate the KYC then Reenter the Client data", {
                                  duration: 5000,
                                  position: "top-center"
                                });
                              }
                            }}
                            required
                          >
                            <SelectTrigger className={`w-full bg-background/50 border-primary/20 transition-all ${
                              formData.kyc_verified 
                                ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-500" 
                                : "border-rose-500/50 bg-rose-500/5 text-rose-500"
                            }`}>
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-primary/20">
                              <SelectItem value="yes" className="text-emerald-500 focus:text-emerald-500">
                                <div className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                  <span>KYC Verified (Yes)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="no" className="text-rose-500 focus:text-rose-500">
                                <div className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                  <span>Not Verified (No)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {!formData.kyc_verified && (
                            <p className="text-[10px] text-red-500 font-medium italic">Submission disabled until KYC is verified.</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className={formData.ckyc_number && !/^[SLOM][0-9A-Z]{13}$|^[0-9]{14}$/.test(formData.ckyc_number) ? "text-orange-500 font-medium" : ""}>
                            CKYC Number *
                          </Label>
                          <Input 
                            name="ckyc_number" 
                            disabled={isFieldDisabled("ckyc_number")} 
                            value={formData.ckyc_number} 
                            onChange={handleChange} 
                            required
                            placeholder="Central KYC Number (14 chars)" 
                            className={formData.ckyc_number && !/^[SLOM][0-9A-Z]{13}$|^[0-9]{14}$/.test(formData.ckyc_number) ? "border-orange-500" : ""}
                          />
                          {formData.ckyc_number && !/^[SLOM][0-9A-Z]{13}$|^[0-9]{14}$/.test(formData.ckyc_number) && (
                            <p className="text-[10px] text-orange-500">
                              Must be 14 digits or start with S, L, O, M followed by 13 chars.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Regulatory Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Regulatory & Dates</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Client Onboarding Date *</Label>
                          <DatePicker 
                            date={formData.client_date} 
                            onChange={(val) => setFormData(prev => ({ ...prev, client_date: val }))}
                            disabled={isFieldDisabled("client_date")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Agreement Date *</Label>
                          <DatePicker 
                            date={formData.agreement_date} 
                            onChange={(val) => setFormData(prev => ({ ...prev, agreement_date: val }))}
                            disabled={isFieldDisabled("agreement_date")}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 relative">
                          <Label>In-Person Verification (IPV) Done By *</Label>
                          <div className="relative">
                            <Input
                              placeholder="Type to search staff..."
                              value={ipvSearchTerm}
                              onChange={(e) => {
                                setIpvSearchTerm(e.target.value);
                                setShowIpvResults(true);
                                if (!e.target.value) {
                                  setFormData(prev => ({ ...prev, ipv_done_by_id: "" }));
                                }
                              }}
                              onFocus={() => setShowIpvResults(true)}
                              className="bg-background/50 border-primary/20 pr-10"
                              autoComplete="off"
                            />
                            {ipvSearchTerm && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setIpvSearchTerm("");
                                  setFormData(prev => ({ ...prev, ipv_done_by_id: "" }));
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                              </button>
                            )}

                            {showIpvResults && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setShowIpvResults(false)}
                                />
                                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-primary/20 rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                                  {employees
                                    .filter(emp => {
                                      const name = (emp.full_name || emp.name || emp.name_of_employee || "").toLowerCase();
                                      const desig = (emp.designation || "").toLowerCase();
                                      const search = ipvSearchTerm.toLowerCase();
                                      return name.includes(search) || desig.includes(search);
                                    })
                                    .map((emp) => (
                                      <div
                                        key={emp.id}
                                        className="p-3 hover:bg-primary/10 cursor-pointer border-b border-primary/5 last:border-0 flex flex-col transition-colors"
                                        onClick={() => {
                                          const name = emp.full_name || emp.name || emp.name_of_employee || "";
                                          setIpvSearchTerm(name);
                                          setFormData(prev => ({ ...prev, ipv_done_by_id: emp.id || "" }));
                                          setShowIpvResults(false);
                                        }}
                                      >
                                        <span className="font-medium text-sm text-foreground">
                                          {emp.full_name || emp.name || emp.name_of_employee || "Staff Member"}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {emp.designation || "Executive"}
                                        </span>
                                      </div>
                                    ))}
                                  {employees.filter(emp => {
                                    const name = (emp.full_name || emp.name || emp.name_of_employee || "").toLowerCase();
                                    const desig = (emp.designation || "").toLowerCase();
                                    const search = ipvSearchTerm.toLowerCase();
                                    return name.includes(search) || desig.includes(search);
                                  }).length === 0 && (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                      No staff members found
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>IPV Date *</Label>
                          <DatePicker 
                            date={formData.ipv_date} 
                            onChange={(val) => setFormData(prev => ({ ...prev, ipv_date: val }))}
                            disabled={isFieldDisabled("ipv_date")}
                            placeholder="Select IPV Date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-primary/5 border-primary/20 mt-8">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle2 className="w-6 h-6 text-primary mt-1" />
                            <div className="space-y-2">
                                <h3 className="font-bold">Compliance Declaration</h3>
                                <p className="text-sm text-muted-foreground">
                                    I hereby confirm that all details provided are accurate to the best of my knowledge and comply with Regulatory Investment Advisor guidelines. The client's identity has been verified via KYC documents.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-6 mt-0">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Mandatory Documents</h3>
                        <p className="text-xs text-muted-foreground">Please upload clear copies of all required documents.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {REQUIRED_DOCUMENTS.map(docType => {
                       const isImageOnly = ["Signature", "Photo (Passport size)", "Cancelled Cheque"].includes(docType);
                       return (
                       <div key={docType} className="border border-primary/20 rounded-lg p-4 bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center min-h-[160px] relative" onClick={() => document.getElementById(`file-${docType.replace(/\s+/g, '-')}`)?.click()}>
                           <input id={`file-${docType.replace(/\s+/g, '-')}`} type="file" className="hidden" accept={isImageOnly ? ".jpg,.jpeg" : ".pdf,.png,.jpg,.jpeg"} onChange={(e) => {
                               if (e.target.files && e.target.files[0]) {
                                   const file = e.target.files[0];
                                   if (file.size > 5 * 1024 * 1024) {
                                       toast.error(`${docType} exceeds maximum file size of 5MB.`);
                                       e.target.value = "";
                                       return;
                                   }
                                   if (isImageOnly && !file.type.match(/image\/jpe?g/)) {
                                       toast.error(`${docType} must be in JPG/JPEG format.`);
                                       // Reset the input value so user can try again
                                       e.target.value = "";
                                       return;
                                   }
                                   setPendingDocuments(prev => ({...prev, [docType]: file}));
                               }
                           }} onClick={(e) => e.stopPropagation()} />
                           {pendingDocuments[docType] ? (
                               <>
                                  <div className="absolute top-2 right-2">
                                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  </div>
                                  <FileText className="w-8 h-8 text-primary mb-2" />
                                  <p className="font-semibold text-sm max-w-[120px] truncate" title={pendingDocuments[docType].name}>{pendingDocuments[docType].name}</p>
                                  <p className="text-xs text-green-600 mt-1 font-medium">Ready to secure</p>
                               </>
                           ) : (
                               <>
                                  <UploadCloud className="w-8 h-8 text-primary/40 mb-2" />
                                  <p className="font-semibold text-sm">{docType} <span className="text-red-500">*</span></p>
                                  <p className="text-[10px] text-muted-foreground mt-1 text-center font-medium opacity-80">
                                      {isImageOnly ? "Must be JPG/JPEG (Max 5MB)" : "PDF, JPG, PNG (Max 5MB)"}
                                  </p>
                               </>
                           )}
                       </div>
                    )})}
                  </div>
                </TabsContent>
              </div>

              <div className="p-6 sm:p-8 border-t border-primary/10 bg-muted/20 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto px-8 border-primary/20 h-11 sm:h-auto">
                    Cancel
                  </Button>
                  {!isEdit && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={loading}
                      className="w-full sm:w-auto px-6 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 h-11 sm:h-auto gap-2 transition-all"
                      onClick={() => {
                        localStorage.removeItem(STORAGE_KEY);
                        setFormData({ ...DEFAULT_FORM_DATA });
                        setPendingDocuments({});
                        setIpvSearchTerm("");
                        setAssignedSearchTerm("");
                        setActiveTab("personal");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        toast.success("Form cleared. Starting fresh.", { icon: "🗑️" });
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Form
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-4 w-full sm:w-auto">
                  {activeTab !== "documents" ? (
                    <Button 
                      key="btn-next"
                      type="button" 
                      onClick={() => {
                        const tabs = ["personal", "financial", "bank", "investment", "compliance", "documents"];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        if (nextIndex < tabs.length) {
                          setActiveTab(tabs[nextIndex]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="w-full sm:px-10 h-11 sm:h-auto"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button 
                      key="btn-submit"
                      type="submit" 
                      disabled={loading || !formData.kyc_verified} 
                      className="w-full sm:px-12 gap-2 h-12 text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? <CheckCircle2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
                      {loading ? (isEdit ? "Updating..." : "Registering...") : (isEdit ? "Update Client" : "Finalize Registration")}
                    </Button>
                  )}
                </div>
              </div>
            </Tabs>
          </form>
        </CardContent>
      </Card>

      <RegistrationPreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleFinalConfirm}
        formData={formData}
        loading={loading}
      />
    </div>
  );
}
