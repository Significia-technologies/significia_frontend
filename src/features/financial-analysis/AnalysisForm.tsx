"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  User, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  GraduationCap, 
  Settings2,
  Plus,
  Trash2,
  AlertCircle,
  Search,
  CheckCircle2,
  FileText,
  Calculator,
  MessageSquare,
  Users,
  Wallet,
  Flag,
  Check,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  FinancialAnalysisService, 
  FinancialAnalysisCreate 
} from "@/core/services/financial-analysis.service";
import { DatePicker } from "@/components/ui/date-picker";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FINANCIAL_GOAL_ANALYSIS_DISCLAIMER, RECORD_VERSION_CONTROL_STATEMENT } from "./constants";

interface AnalysisFormProps {
  clientId?: string;
  copyFromProfileId?: string;
  onSuccess: (resultId: string) => void;
  onCancel: () => void;
}

const STEP_TITLES: Record<number, string> = {
  1: "Entity Profile",
  2: "Family Context",
  3: "Financial Snapshot",
  4: "Risk Mitigation",
  5: "Strategic Planning",
  6: "Final Review"
};

const STEP_DESCRIPTONS: Record<number, string> = {
  1: "Basic details and spouse information",
  2: "Children and contact information",
  3: "Annual expenses, assets, and liabilities",
  4: "Comprehensive insurance portfolio analysis",
  5: "Goal setting and financial assumptions",
  6: "Final notes and disclaimer confirmation"
};

const STEPS_CONFIG = [
  { id: 1, title: "Profile", icon: User },
  { id: 2, title: "Family", icon: Users },
  { id: 3, title: "Financials", icon: Wallet },
  { id: 4, title: "Insurance", icon: ShieldCheck },
  { id: 5, title: "Assumptions", icon: Target },
  { id: 6, title: "Finish", icon: Flag }
];

export function AnalysisForm({ clientId, copyFromProfileId, onSuccess, onCancel }: AnalysisFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [clientFound, setClientFound] = useState(false);

  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [formData, setFormData] = useState<FinancialAnalysisCreate>({
    client_id: clientId || "",
    pan: "",
    occupation: "",
    dob: "",
    contact: "",
    email: "",
    annual_income: 0,
    spouse_name: "",
    spouse_dob: "",
    spouse_occupation: "",
    children: [],
    expenses: {
      hh: 0, med: 0, travel: 0, elec: 0, tele: 0,
      maid: 0, edu: 0, ent: 0, emi: 0, savings: 0, misc: 0
    },
    assets: {
      land: 0, inv: 0, cash: 0, retirement: 0, others: []
    },
    liabilities: {
      personal: 0, cc: 0, hb: 0, others: []
    },
    insurance: {
      life_cover: 0, life_premium: 0,
      med_cover: 0, med_premium: 0,
      veh_cover: 0, veh_premium: 0,
      other_cover: 0, other_premium: 0
    },
    medical_bonus_years: 0,
    medical_bonus_percentage: 0,
    education_investment_pct: 0,
    marriage_investment_pct: 0,
    assumptions: {
      retirement_age: 0,
      le_client: 0,
      le_spouse: 0,
      inflation: 0,
      medical_inflation: 0,
      pre_ret_rate: 0,
      post_ret_rate: 0,
      sol_hlv: 0,
      sol_ret: 0,
      child_education_corpus: 0,
      education_years: 0,
      child_marriage_corpus: 0,
      marriage_years: 0
    },
    exclude_ai: false,
    disclaimer_text: "",
    discussion_notes: "",
    record_version_control_statement: RECORD_VERSION_CONTROL_STATEMENT
  });

  const [displayInfo, setDisplayInfo] = useState({
    clientName: "",
    clientCode: "",
    iaName: "",
    iaReg: ""
  });

  // Load initial data with correct precedence: Client Master -> Historical Profile
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let clientData = null;

        // 1. If we have a clientId, load master data first
        if (clientId) {
          clientData = await MasterDataService.getClient(clientId);
          populateClientData(clientData);
        }

        // 2. If we are copying/editing a profile, load that snapshot
        if (copyFromProfileId) {
          const profile = await FinancialAnalysisService.getProfile(copyFromProfileId);

          // If clientId wasn't provided but profile has one, load client display info
          if (!clientData && profile.client_id) {
            clientData = await MasterDataService.getClient(profile.client_id);
            // Pass skipFormFields=true so we only get display info and don't overwrite form inputs
            populateClientData(clientData, true);
          }

          // Apply profile snapshot OVER the form
          setFormData(prev => ({ 
            ...prev, 
            occupation: profile.occupation,
            dob: formatToInputDate(profile.dob),
            annual_income: profile.annual_income,
            spouse_name: profile.spouse_name || "",
            spouse_dob: formatToInputDate(profile.spouse_dob || ""),
            spouse_occupation: profile.spouse_occupation || "",
            children: profile.children || [],
            expenses: profile.expenses || prev.expenses,
            assets: profile.assets || prev.assets,
            liabilities: profile.liabilities || prev.liabilities,
            insurance: profile.insurance || prev.insurance,
            medical_bonus_years: profile.medical_bonus_years || 0,
            medical_bonus_percentage: profile.medical_bonus_percentage || 0,
            education_investment_pct: profile.education_investment_pct || 0,
            marriage_investment_pct: profile.marriage_investment_pct || 0,
            assumptions: profile.assumptions || prev.assumptions,
            exclude_ai: !!profile.exclude_ai,
            disclaimer_text: (profile.disclaimer_text || "").replace(FINANCIAL_GOAL_ANALYSIS_DISCLAIMER, "").trim(),
            discussion_notes: profile.discussion_notes || "",
            record_version_control_statement: profile.record_version_control_statement || prev.record_version_control_statement,
            pan: profile.pan || "",
            contact: profile.contact || "",
            email: profile.email || "",
            client_id: profile.client_id,
            previous_profile_id: copyFromProfileId,
          }));
          
          setClientFound(true);
          toast.success("Historical snapshot loaded successfully.");
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load full data snapshot.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, copyFromProfileId]);

  const populateClientData = (client: ClientCreate, skipFormFields = false) => {
    if (!skipFormFields) {
      setFormData(prev => ({
        ...prev,
        client_id: client.id || prev.client_id,
        pan: client.pan_number,
        occupation: client.occupation,
        dob: formatToInputDate(client.date_of_birth),
        annual_income: client.annual_income,
        spouse_name: client.spouse_name || "",
        spouse_dob: formatToInputDate(client.spouse_dob || ""),
        contact: client.phone_number,
        email: client.email
      }));
    }
    
    setDisplayInfo({
      clientName: client.client_name,
      clientCode: client.client_code,
      iaName: client.advisor_name,
      iaReg: client.advisor_registration_number
    });
    setClientFound(true);
  };

  const validateCodeRealTime = async (code: string) => {
    if (!code) return;
    
    setIsValidating(true);
    try {
      const client = await MasterDataService.getClientByCode(code);
      toast.success("Client found! Details auto-populated.");
      populateClientData(client);
    } catch (error) {
      toast.error("Client Code not found in database.");
      setClientFound(false);
      setDisplayInfo({ clientName: "", clientCode: code, iaName: "", iaReg: "" });
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        // Clone the next level to avoid mutation
        current[part] = Array.isArray(current[part]) 
          ? [...current[part]] 
          : { ...current[part] };
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const handleTopLevelChange = (field: keyof FinancialAnalysisCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...(prev.children || []), { name: "", dob: "", occupation: "" }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children?.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: string, value: any) => {
    const cleanedValue = field === 'name' ? value.replace(/[^a-zA-Z\s]/g, '') : value;
    setFormData(prev => {
      const newChildren = [...(prev.children || [])];
      newChildren[index] = { ...newChildren[index], [field]: cleanedValue };
      return { ...prev, children: newChildren };
    });
  };

  const addOtherLiability = () => {
    setFormData(prev => ({
      ...prev,
      liabilities: {
        ...prev.liabilities,
        others: [...(prev.liabilities.others || []), { label: "", amount: 0 }]
      }
    }));
  };

  const removeOtherLiability = (index: number) => {
    setFormData(prev => ({
      ...prev,
      liabilities: {
        ...prev.liabilities,
        others: prev.liabilities.others?.filter((_, i) => i !== index)
      }
    }));
  };

  const updateOtherLiability = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newOthers = [...(prev.liabilities.others || [])];
      newOthers[index] = { ...newOthers[index], [field]: value };
      return {
        ...prev,
        liabilities: {
          ...prev.liabilities,
          others: newOthers
        }
      };
    });
  };

  const addOtherAsset = () => {
    setFormData(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        others: [...(prev.assets.others || []), { label: "", amount: 0 }]
      }
    }));
  };

  const removeOtherAsset = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        others: prev.assets.others?.filter((_, i) => i !== index)
      }
    }));
  };

  const updateOtherAsset = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newOthers = [...(prev.assets.others || [])];
      newOthers[index] = { ...newOthers[index], [field]: value };
      return {
        ...prev,
        assets: {
          ...prev.assets,
          others: newOthers
        }
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.client_id) {
      toast.error("Please validate a PAN or select a client first.");
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        disclaimer_text: `${FINANCIAL_GOAL_ANALYSIS_DISCLAIMER}\n\n${formData.disclaimer_text}`.trim()
      };
      const result = await FinancialAnalysisService.create(submissionData);
      toast.success("Analysis saved and calculated successfully!");
      onSuccess(result.id);
    } catch (error) {
      console.error("Submission failed", error);
      toast.error("Failed to run analysis. Check all required fields.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validation for Step 1
    if (step === 1) {
      if (!formData.client_id) {
        toast.error("Please validate Client Code first.");
        return;
      }
      if (!formData.occupation) {
        toast.error("Occupation is required.");
        return;
      }
      if (!formData.dob) {
        toast.error("Date of Birth is required.");
        return;
      }
      if (formData.annual_income <= 0) {
        toast.error("Annual Income must be greater than 0.");
        return;
      }
      
      /* Mandatory Spouse info removed - making it optional */
      if (formData.spouse_dob && !isEighteenPlus(formData.spouse_dob)) {
        toast.error("Spouse must be at least 18 years old.");
        return;
      }
    }
    
    setStep(s => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatToInputDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return dateStr; // yyyy-mm-dd
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // dd-mm-yyyy to yyyy-mm-dd
    }
    return dateStr;
  };

  const isEighteenPlus = (dob: string): boolean => {
    if (!dob) return true;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const SectionHeader = ({ title, icon: Icon, number }: { title: string, icon: any, number: string }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-primary/10">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
        {number}
      </div>
      <Icon className="w-4 h-4 text-primary opacity-60" />
      <h3 className="text-md font-black text-foreground/70 uppercase tracking-wide">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">

      <Card className="border-primary/20 shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10 p-4 sm:p-8">
          <div className="flex flex-col gap-4">
            {/* Professional Stepper Section */}
            <div className="relative w-full overflow-hidden sm:overflow-visible pt-2">
              <div className="flex justify-between items-start relative min-w-[600px] sm:min-w-0 px-2">
                {/* Connecting Line Background */}
                <div className="absolute top-5 left-0 w-full h-[2px] bg-muted/30 -z-10" />
                
                {/* Active/Success Progress Line */}
                <div 
                  className="absolute top-5 left-0 h-[2px] bg-green-500 transition-all duration-500 -z-10" 
                  style={{ width: `${((step - 1) / (STEPS_CONFIG.length - 1)) * 100}%` }}
                />

                {STEPS_CONFIG.map((s, idx) => {
                  const isCompleted = step > s.id;
                  const isActive = step === s.id;
                  const isPending = step < s.id;

                  return (
                    <div key={s.id} className="flex flex-col items-center gap-3 relative z-10">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                          isCompleted ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20" :
                          isActive ? "bg-primary border-primary text-background scale-125 shadow-lg shadow-primary/40 ring-4 ring-primary/10" :
                          "bg-card border-muted/50 text-muted-foreground"
                        }`}
                        onClick={() => setStep(s.id)}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                          isCompleted ? "text-green-500" :
                          isActive ? "text-primary" :
                          "text-muted-foreground/50"
                        }`}>
                          {s.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-8">
          {/* STEP 1: BASIC INFO & SPOUSE */}
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 1: Basic Information */}
              <div>
                <SectionHeader title="1. Client Basic Information" icon={User} number="1" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      Client Code * 
                      {isValidating && <span className="text-[10px] animate-spin">⌛</span>}
                    </Label>
                    <div className="relative">
                      <Input 
                        value={displayInfo.clientCode} 
                        onChange={e => setDisplayInfo(prev => ({ ...prev, clientCode: e.target.value.toUpperCase() }))}
                        onBlur={e => validateCodeRealTime(e.target.value)}
                        placeholder="SIGN001"
                        className={`uppercase font-mono text-lg tracking-widest pl-10 ${clientFound ? 'border-primary/50 bg-primary/5' : ''}`}
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-40" />
                      {clientFound && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-primary" />}
                    </div>
                  </div>
                  <div className="space-y-2 opacity-80">
                    <Label>Full Name (Auto-populated)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/30 font-bold uppercase text-primary/80">
                      {displayInfo.clientName || "Validate Client Code first"}
                    </div>
                  </div>
                  <div className="space-y-2 opacity-80">
                    <Label>PAN Number (Auto-populated)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/30 font-bold uppercase text-primary/80 tracking-widest italic">
                      {formData.pan || "Validate Client Code first"}
                    </div>
                  </div>
                  <div className="space-y-2 opacity-80">
                    <Label>IA Details (Auto-populated)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/20 text-xs overflow-hidden truncate">
                        {displayInfo.iaName || "IA Name"}
                      </div>
                      <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/20 text-xs overflow-hidden truncate">
                        {displayInfo.iaReg || "IA Reg No"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation *</Label>
                    <Input 
                      value={formData.occupation} 
                      onChange={e => handleTopLevelChange('occupation', e.target.value)}
                      placeholder="e.g. Professional / Salaried"
                      readOnly={clientFound}
                      className={clientFound ? "font-bold uppercase text-primary/80 cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    {clientFound ? (
                      <Input 
                        value={formData.dob} 
                        readOnly 
                        className="font-bold text-primary/80 cursor-default"
                      />
                    ) : (
                      <DatePicker 
                        date={formData.dob} 
                        onChange={val => handleTopLevelChange('dob', val)}
                        placeholder="Select DOB"
                        fromYear={1930}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Income (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">₹</span>
                      <Input 
                        type={clientFound ? "text" : "number"}
                        min={0}
                        value={clientFound ? formData.annual_income.toLocaleString() : (formData.annual_income === 0 ? "" : formData.annual_income)} 
                        onChange={e => handleTopLevelChange('annual_income', e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        placeholder="0"
                        readOnly={clientFound}
                        className={`pl-7 font-bold text-primary ${clientFound ? 'cursor-default' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Spouse Information */}
              <div>
                <SectionHeader title="2. Spouse Information" icon={User} number="2" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Spouse Name {clientFound && "(Auto-populated)"}</Label>
                    <Input 
                      value={formData.spouse_name} 
                      onChange={e => handleTopLevelChange('spouse_name', e.target.value)} 
                      readOnly={clientFound}
                      className={clientFound ? "font-bold uppercase text-primary/80 cursor-default" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) ? "text-destructive" : ""}>
                      Date of Birth {clientFound && "(Auto-populated)"} {formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) && "(Must be 18+)"}
                    </Label>
                    {clientFound ? (
                      <Input 
                        value={formData.spouse_dob} 
                        readOnly 
                        className="font-bold text-primary/80 cursor-default"
                      />
                    ) : (
                      <DatePicker 
                        date={formData.spouse_dob} 
                        onChange={val => handleTopLevelChange('spouse_dob', val)}
                        placeholder="Select Spouse DOB"
                        fromYear={1930}
                        className={formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation/Status</Label>
                    <Input value={formData.spouse_occupation} onChange={e => handleTopLevelChange('spouse_occupation', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHILDREN & CONTACT */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 3: Children Information */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <SectionHeader title="3. Children Information" icon={GraduationCap} number="3" />
                  <Button variant="outline" size="sm" onClick={addChild} className="gap-2 border-primary/20 -mt-6">
                    <Plus className="w-4 h-4" /> Add Child
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.children?.map((child, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 relative group">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-50">Child Name</Label>
                        <Input 
                          value={child.name} 
                          onChange={e => updateChild(idx, 'name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
                          className="h-9" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-50">DOB</Label>
                        <DatePicker 
                          date={child.dob} 
                          onChange={val => updateChild(idx, 'dob', val)}
                          className="h-9"
                          placeholder="Child DOB"
                          fromYear={1990}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-50">Occupation / Status</Label>
                        <Input value={(child as any).occupation || ""} onChange={e => updateChild(idx, 'occupation', e.target.value)} className="h-9" placeholder="Student / Dependent" />
                      </div>
                      <div className="flex items-end pb-1 justify-end">
                        <Button variant="ghost" size="sm" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeChild(idx)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {formData.children?.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-muted rounded-2xl text-center text-muted-foreground/60">
                      No children details added. Skip if not applicable.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Contact Information */}
              <div>
                <SectionHeader title="4. Contact Information" icon={MessageSquare} number="4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Contact Number *</Label>
                    <Input value={formData.contact} onChange={e => handleTopLevelChange('contact', e.target.value)} maxLength={10} placeholder="10-digit mobile" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email ID *</Label>
                    <Input value={formData.email} onChange={e => handleTopLevelChange('email', e.target.value)} placeholder="client@example.com" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXPENSES & ASSETS */}
          {step === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 5: Annual Expenses */}
              <div>
                <SectionHeader title="5. Annual Expenses (₹)" icon={CreditCard} number="5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                  {[
                    { key: 'hh', label: 'Household & Groceries' },
                    { key: 'med', label: 'Medical & Healthcare' },
                    { key: 'travel', label: 'Travel & Transport' },
                    { key: 'elec', label: 'Electricity & Utilities' },
                    { key: 'tele', label: 'Telephone & Internet' },
                    { key: 'maid', label: 'Domestic Help' },
                    { key: 'edu', label: 'Children Education and Expenses' },
                    { key: 'ent', label: 'Leisure & Ent.' },
                    { key: 'emi', label: 'Total EMI Paid' },
                    { key: 'savings', label: 'Savings/Investment Contribution' },
                    { key: 'misc', label: 'Miscellaneous' }
                  ].map(item => (
                    <div key={item.key} className="space-y-1">
                      <Label className="text-xs opacity-70 font-bold">{item.label}</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-[10px] opacity-40">₹</span>
                        <Input 
                          type="number"
                          min={0}
                          value={(formData.expenses as any)[item.key] === 0 ? "" : (formData.expenses as any)[item.key]} 
                          onChange={e => handleInputChange(`expenses.${item.key}`, e.target.value === "" ? 0 : parseFloat(e.target.value))}
                          placeholder="0"
                          className="h-8 pl-6 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Assets & 7. Liabilities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <SectionHeader title="6. Assets (₹)" icon={TrendingUp} number="6" />
                  <div className="space-y-4">
                    {[
                      { key: 'land', label: 'Land & Building (Non-Residential Only)' },
                      { key: 'inv', label: 'Investment excluding retirement Investment (MF, Stocks, etc)' },
                      { key: 'cash', label: 'Cash & Bank Balance' },
                      { key: 'retirement', label: 'Existing Retirement Savings' }
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <Label className="text-xs">{item.label}</Label>
                        <Input 
                          type="number"
                          min={0}
                          placeholder="0"
                          value={(formData.assets as any)[item.key] === 0 ? "" : (formData.assets as any)[item.key]} 
                          onChange={e => handleInputChange(`assets.${item.key}`, e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        />
                      </div>
                    ))}

                    {/* Other Assets List */}
                    {formData.assets.others?.map((other, idx) => (
                      <div key={idx} className="p-3 border border-dashed border-primary/20 rounded-lg space-y-3 relative group">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeOtherAsset(idx)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-50">Label</Label>
                            <Input 
                              placeholder="e.g. Fixed Deposits" 
                              value={other.label} 
                              onChange={e => updateOtherAsset(idx, 'label', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-50">Amount (₹)</Label>
                            <Input 
                              type="number" 
                              min={0}
                              placeholder="0"
                              value={other.amount === 0 ? "" : other.amount} 
                              onChange={e => updateOtherAsset(idx, 'amount', e.target.value === "" ? 0 : parseFloat(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addOtherAsset}
                      className="w-full border-dashed border-primary/30 text-primary/60 hover:text-primary hover:border-primary/50 text-xs h-8"
                    >
                      <Plus className="w-3 h-3 mr-2" /> Add Other Asset
                    </Button>
                  </div>
                </div>
                <div>
                  <SectionHeader title="7. Liabilities (₹)" icon={CreditCard} number="7" />
                  <div className="space-y-4">
                    {[
                      { key: 'personal', label: 'Personal Loans' },
                      { key: 'cc', label: 'Credit Card Dues' },
                      { key: 'hb', label: 'Home/Building Loan' }
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <Label className="text-xs">{item.label}</Label>
                        <Input 
                          type="number"
                          min={0}
                          placeholder="0"
                          value={(formData.liabilities as any)[item.key] === 0 ? "" : (formData.liabilities as any)[item.key]} 
                          onChange={e => handleInputChange(`liabilities.${item.key}`, e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        />
                      </div>
                    ))}

                    {/* Other Liabilities List */}
                    {formData.liabilities.others?.map((other, idx) => (
                      <div key={idx} className="p-3 border border-dashed border-primary/20 rounded-lg space-y-3 relative group">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeOtherLiability(idx)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-50">Label</Label>
                            <Input 
                              placeholder="e.g. Gold Loan" 
                              value={other.label} 
                              onChange={e => updateOtherLiability(idx, 'label', e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-50">Amount (₹)</Label>
                            <Input 
                              type="number" 
                              min={0}
                              placeholder="0"
                              value={other.amount === 0 ? "" : other.amount} 
                              onChange={e => updateOtherLiability(idx, 'amount', e.target.value === "" ? 0 : parseFloat(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addOtherLiability}
                      className="w-full border-dashed border-primary/30 text-primary/60 hover:text-primary hover:border-primary/50 text-xs h-8"
                    >
                      <Plus className="w-3 h-3 mr-2" /> Add Other Liability
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: INSURANCE */}
          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <SectionHeader title="8. Insurance Information" icon={ShieldCheck} number="8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Life & Medical */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600 font-bold">Life Insurance Cover</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.life_cover === 0 ? "" : formData.insurance.life_cover} onChange={e => handleInputChange('insurance.life_cover', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600 font-bold">Life Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.life_premium === 0 ? "" : formData.insurance.life_premium} onChange={e => handleInputChange('insurance.life_premium', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs text-green-600 font-bold">Health Insurance Cover</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.med_cover === 0 ? "" : formData.insurance.med_cover} onChange={e => handleInputChange('insurance.med_cover', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-green-600 font-bold">Health Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.med_premium === 0 ? "" : formData.insurance.med_premium} onChange={e => handleInputChange('insurance.med_premium', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Vehicle & Other */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Vehicle Insurance Cover</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.veh_cover === 0 ? "" : formData.insurance.veh_cover} onChange={e => handleInputChange('insurance.veh_cover', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Vehicle Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.veh_premium === 0 ? "" : formData.insurance.veh_premium} onChange={e => handleInputChange('insurance.veh_premium', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Other General Insurance Cover</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.other_cover === 0 ? "" : formData.insurance.other_cover} onChange={e => handleInputChange('insurance.other_cover', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Other General Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.insurance.other_premium === 0 ? "" : formData.insurance.other_premium} onChange={e => handleInputChange('insurance.other_premium', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Bonus */}
              <div className="bg-orange-500/5 border border-orange-500/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <AlertCircle className="w-8 h-8 text-orange-500 opacity-40 shrink-0" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Health Insurance Bonus Years</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.medical_bonus_years === 0 ? "" : formData.medical_bonus_years} onChange={e => handleTopLevelChange('medical_bonus_years', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Avg. Health Insurance Bonus Percentage (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.medical_bonus_percentage === 0 ? "" : formData.medical_bonus_percentage} onChange={e => handleTopLevelChange('medical_bonus_percentage', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ASSUMPTIONS & GOALS */}
          {step === 5 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 9: Assumptions */}
              <div>
                <SectionHeader title="9. Financial Assumptions" icon={Settings2} number="9" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Retirement Age</Label>
                    <Input type="number" min={40} max={80} placeholder="0" value={formData.assumptions.retirement_age === 0 ? "" : formData.assumptions.retirement_age} onChange={e => handleInputChange('assumptions.retirement_age', e.target.value === "" ? 0 : parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Expectancy - Client</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.le_client === 0 ? "" : formData.assumptions.le_client} onChange={e => handleInputChange('assumptions.le_client', e.target.value === "" ? 0 : parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Expectancy - Spouse</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.le_spouse === 0 ? "" : formData.assumptions.le_spouse} onChange={e => handleInputChange('assumptions.le_spouse', e.target.value === "" ? 0 : parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Income Increment Rate (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={(formData.assumptions as any).inc_inc_rate === 0 ? "" : (formData.assumptions as any).inc_inc_rate} onChange={e => handleInputChange('assumptions.inc_inc_rate', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Inflation Rate (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.inflation === 0 ? "" : formData.assumptions.inflation} onChange={e => handleInputChange('assumptions.inflation', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Inflation Rate (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.medical_inflation === 0 ? "" : formData.assumptions.medical_inflation} onChange={e => handleInputChange('assumptions.medical_inflation', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pre-Retirement Return (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.pre_ret_rate === 0 ? "" : formData.assumptions.pre_ret_rate} onChange={e => handleInputChange('assumptions.pre_ret_rate', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Post-Retirement Return (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.post_ret_rate === 0 ? "" : formData.assumptions.post_ret_rate} onChange={e => handleInputChange('assumptions.post_ret_rate', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard of Living for HLV (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.sol_hlv === 0 ? "" : formData.assumptions.sol_hlv} onChange={e => handleInputChange('assumptions.sol_hlv', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard of Living for Retirement (%)</Label>
                    <Input type="number" min={0} placeholder="0" value={formData.assumptions.sol_ret === 0 ? "" : formData.assumptions.sol_ret} onChange={e => handleInputChange('assumptions.sol_ret', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Section 10: Child Goals & 11. Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionHeader title="10. Child Goals" icon={GraduationCap} number="10" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Education Corpus Needed (Today)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.assumptions.child_education_corpus === 0 ? "" : Math.round(formData.assumptions.child_education_corpus)} onChange={e => handleInputChange('assumptions.child_education_corpus', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years to Education Goal</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.assumptions.education_years === 0 ? "" : formData.assumptions.education_years} onChange={e => handleInputChange('assumptions.education_years', e.target.value === "" ? 0 : parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Marriage Corpus Needed (Today)</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.assumptions.child_marriage_corpus === 0 ? "" : Math.round(formData.assumptions.child_marriage_corpus)} onChange={e => handleInputChange('assumptions.child_marriage_corpus', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years to Marriage Goal</Label>
                      <Input type="number" min={0} placeholder="0" value={formData.assumptions.marriage_years === 0 ? "" : formData.assumptions.marriage_years} onChange={e => handleInputChange('assumptions.marriage_years', e.target.value === "" ? 0 : parseInt(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <SectionHeader title="11. Existing Goal Allocation (%)" icon={TrendingUp} number="11" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Education Goal Allocation (%)</Label>
                      <Input type="number" min={0} max={100} placeholder="0" value={formData.education_investment_pct === 0 ? "" : Math.round(formData.education_investment_pct)} onChange={e => handleTopLevelChange('education_investment_pct', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Marriage Goal Allocation (%)</Label>
                      <Input type="number" min={0} max={100} placeholder="0" value={formData.marriage_investment_pct === 0 ? "" : Math.round(formData.marriage_investment_pct)} onChange={e => handleTopLevelChange('marriage_investment_pct', e.target.value === "" ? 0 : parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: AI & DISCLAIMER */}
          {step === 6 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 12: System Analysis Exclusion */}
              <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                <SectionHeader title="12. System Template Exclusion" icon={AlertCircle} number="12" />
                <div className="flex items-start space-x-3">
                  <input 
                    id="exclude-ai" 
                    type="checkbox"
                    className="h-4 w-4 rounded border-input bg-background mt-0.5 cursor-pointer accent-primary"
                    checked={formData.exclude_ai} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTopLevelChange('exclude_ai', e.target.checked)} 
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="exclude-ai" className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I do not want System Template in the report
                    </label>
                    <p className="text-xs text-muted-foreground">
                      The generated report will contain only numerical data if selected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 13: Disclaimer */}
              <div className="space-y-4">
                <SectionHeader title="13. Disclaimer to Analysis" icon={FileText} number="13" />
                <div className="p-5 rounded-2xl bg-muted/30 border border-muted/50 text-xs text-muted-foreground leading-relaxed font-serif whitespace-pre-wrap italic shadow-inner">
                  {FINANCIAL_GOAL_ANALYSIS_DISCLAIMER}
                </div>
                
                <div className="space-y-3 pt-4">
                  <Label className="text-sm font-bold flex items-center gap-2 text-primary/80">
                    <Plus className="w-4 h-4" /> Additional Disclaimer Notes (Optional)
                  </Label>
                  <Textarea 
                    value={formData.disclaimer_text} 
                    onChange={e => handleTopLevelChange('disclaimer_text', e.target.value)}
                    placeholder="Additional points on disclaimer can be given/added by the RIA/Financial Advisor"
                    className="min-h-[120px] text-sm leading-relaxed border-primary/10 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {/* Section 14: Record & Version Control Statement */}
              <div className="space-y-4">
                <SectionHeader title="14. Record & Version Control Statement" icon={ShieldCheck} number="14" />
                <div className="p-5 rounded-2xl bg-muted/30 border border-muted/50 text-xs text-muted-foreground leading-relaxed font-serif whitespace-pre-wrap italic shadow-inner">
                  {RECORD_VERSION_CONTROL_STATEMENT}
                </div>
              </div>

              {/* Section 15: Discussion Notes */}
              <div>
                <SectionHeader title="15. Discussion Notes" icon={MessageSquare} number="15" />
                <Textarea 
                  value={formData.discussion_notes} 
                  onChange={e => handleTopLevelChange('discussion_notes', e.target.value)}
                  placeholder="Record key discussion points between RIA/Advisor and client"
                  className="min-h-[200px] text-sm leading-relaxed border-primary/10 focus-visible:ring-primary/20"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-primary/10 backdrop-blur-md p-4 sm:p-8 flex flex-col sm:flex-row justify-between border-t border-primary/20 gap-6">
          <Button variant="ghost" onClick={onCancel} className="font-bold hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto">
            CANCEL AND EXIT
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} className="gap-2 border-primary/20 w-full sm:w-auto">
                <ChevronLeft className="w-4 h-4" /> PREVIOUS STEP
              </Button>
            )}
            
            {step < 6 ? (
              <Button className="gap-2 bg-primary px-10 font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto" onClick={nextStep}>
                NEXT STEP <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => setShowConfirmAlert(true)} 
                className="gap-2 bg-green-600 hover:bg-green-700 px-12 font-black shadow-xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? <span className="animate-spin mr-2">◌</span> : <Save className="w-4 h-4 mr-2" />}
                RUN COMPREHENSIVE ANALYSIS
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmAlert} onOpenChange={setShowConfirmAlert}>
        <AlertDialogContent className="bg-card border-primary/20 backdrop-blur-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-primary flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Verification Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-md font-bold text-foreground/80 py-4">
              Check Accuracy before report generation
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4">
            <AlertDialogCancel className="font-bold border-primary/10">
              NO, LET ME REVIEW
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 font-black px-10"
            >
              YES, PROCEED
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
