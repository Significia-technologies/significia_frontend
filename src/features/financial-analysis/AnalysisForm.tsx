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
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  FinancialAnalysisService, 
  FinancialAnalysisCreate 
} from "@/core/services/financial-analysis.service";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { toast } from "sonner";

interface AnalysisFormProps {
  connectorId: string;
  clientId?: string;
  onSuccess: (resultId: string) => void;
  onCancel: () => void;
}

export function AnalysisForm({ connectorId, clientId, onSuccess, onCancel }: AnalysisFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [panValidating, setPanValidating] = useState(false);
  const [clientFound, setClientFound] = useState(false);

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
      land: 0, inv: 0, cash: 0, retirement: 0
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
      retirement_age: 60,
      le_client: 85,
      le_spouse: 85,
      inflation: 6,
      medical_inflation: 10,
      pre_ret_rate: 12,
      post_ret_rate: 8,
      sol_hlv: 70,
      sol_ret: 80,
      child_education_corpus: 0,
      education_years: 5,
      child_marriage_corpus: 0,
      marriage_years: 10
    },
    exclude_ai: false,
    disclaimer_text: `This financial analysis report is generated with data furnished solely by the client.

All analysis comments have been generated with the use of artificial intelligence deepseek and is solely meant for INFORMATION purposes only and should not be construed as investment advice, insurance recommendation, or financial planning guidance. The responsibility of the decision of Acceptance or rejection of the analysis lies solely at the discretion of the client only.

The assumptions and projections which are shown here are for illustrative purpose only and are not guaranteed under any circumstances. Future results may always vary.

This document does not constitute any legal and tax advice.

Regular review of this analysis is a key responsibility of client. Any significant changes effecting the analysis should be intimated by the client on time.

All calculations are based on the assumptions provided and are illustrative in nature. Actual results may vary based on market conditions, personal circumstances, and other factors not accounted for in this analysis. Although every possible care has been taken has been taken to ensure correct formulas and accuracy of calculation there might still be errors in the calculations. The responsibility of the decision of Acceptance or rejection of the calculations lies solely at the discretion of the client only.`,
    discussion_notes: ""
  });

  const [displayInfo, setDisplayInfo] = useState({
    clientName: "",
    clientCode: "",
    iaName: "",
    iaReg: ""
  });

  // Load existing client if ID provided
  useEffect(() => {
    if (clientId) {
      MasterDataService.getClient(connectorId, clientId).then(client => {
        populateClientData(client);
      });
    }
  }, [connectorId, clientId]);

  const populateClientData = (client: ClientCreate) => {
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
    setDisplayInfo({
      clientName: client.client_name,
      clientCode: client.client_code,
      iaName: client.advisor_name,
      iaReg: client.advisor_registration_number
    });
    setClientFound(true);
  };

  const validatePANRealTime = async (pan: string) => {
    if (pan.length !== 10) return;
    
    setPanValidating(true);
    try {
      const client = await MasterDataService.getClientByPan(connectorId, pan);
      toast.success("Client found! Details auto-populated.");
      populateClientData(client);
    } catch (error) {
      toast.error("PAN not found in registered database.");
      setClientFound(false);
      setDisplayInfo({ clientName: "", clientCode: "", iaName: "", iaReg: "" });
    } finally {
      setPanValidating(false);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = path.split('.');
      let current: any = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
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
    setFormData(prev => {
      const newChildren = [...(prev.children || [])];
      newChildren[index] = { ...newChildren[index], [field]: value };
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

  const handleSubmit = async () => {
    if (!formData.client_id) {
      toast.error("Please validate a PAN or select a client first.");
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      const result = await FinancialAnalysisService.create(connectorId, formData);
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
    // Basic validation for spouse age
    if (step === 1 && formData.spouse_dob && !isEighteenPlus(formData.spouse_dob)) {
      toast.error("Spouse must be at least 18 years old.");
      return;
    }
    setStep(s => Math.min(s + 1, 6));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

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
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
        {number}
      </div>
      <Icon className="w-5 h-5 text-primary/60" />
      <h3 className="text-lg font-bold text-foreground/80">{title}</h3>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="px-6 py-2 bg-primary/5 text-primary border-primary/20 rounded-full font-bold tracking-wider animate-pulse">
          FINPLAN SYNC: PARITY MODE v3.2
        </Badge>
      </div>

      <Card className="border-primary/20 shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/10 p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                <Calculator className="w-8 h-8 text-primary" />
                Financial Analysis Wizard
              </CardTitle>
              <CardDescription className="text-base font-medium opacity-70">
                14 Sections | Comprehensive HLV & Retirement Planning
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex bg-background/50 rounded-full p-1 border border-primary/10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${step === i ? 'bg-primary scale-125 shadow-lg shadow-primary/50' : 'bg-muted'}`}
                    onClick={() => setStep(i)}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tiniest opacity-50">Step {step} of 6</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* STEP 1: BASIC INFO & SPOUSE */}
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 1: Basic Information */}
              <div>
                <SectionHeader title="1. Client Basic Information" icon={User} number="1" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      PAN Number * 
                      {panValidating && <span className="text-[10px] animate-spin">⌛</span>}
                    </Label>
                    <div className="relative">
                      <Input 
                        value={formData.pan} 
                        onChange={e => handleTopLevelChange('pan', e.target.value.toUpperCase())}
                        onBlur={e => validatePANRealTime(e.target.value)}
                        placeholder="ABCDE1234F"
                        className={`uppercase font-mono text-lg tracking-widest pl-10 ${clientFound ? 'border-green-500/50 bg-green-500/5' : ''}`}
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-40" />
                      {clientFound && <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />}
                    </div>
                  </div>
                  <div className="space-y-2 opacity-80">
                    <Label>Full Name (Auto-populated)</Label>
                    <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/30 font-bold uppercase text-primary/80">
                      {displayInfo.clientName || "Validate PAN first"}
                    </div>
                  </div>
                  <div className="space-y-2 opacity-80">
                    <Label>Client Code / IA Details</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/20 text-xs overflow-hidden truncate">
                        {displayInfo.clientCode || "Code"}
                      </div>
                      <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/20 text-xs overflow-hidden truncate">
                        {displayInfo.iaName || "IA Name"}
                      </div>
                      <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/20 text-xs overflow-hidden truncate">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input 
                      type="date"
                      value={formData.dob} 
                      onChange={e => handleTopLevelChange('dob', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Income (₹) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs opacity-50">₹</span>
                      <Input 
                        type="number"
                        min={0}
                        value={formData.annual_income} 
                        onChange={e => handleTopLevelChange('annual_income', parseFloat(e.target.value))}
                        className="pl-7 font-bold text-primary"
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
                    <Label>Spouse Name</Label>
                    <Input value={formData.spouse_name} onChange={e => handleTopLevelChange('spouse_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className={formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) ? "text-destructive" : ""}>
                      Date of Birth {formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) && "(Must be 18+)"}
                    </Label>
                    <Input 
                      type="date"
                      value={formData.spouse_dob} 
                      onChange={e => handleTopLevelChange('spouse_dob', e.target.value)} 
                      className={formData.spouse_dob && !isEighteenPlus(formData.spouse_dob) ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
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
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 relative group">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-50">Child Name</Label>
                        <Input value={child.name} onChange={e => updateChild(idx, 'name', e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase opacity-50">DOB</Label>
                        <Input type="date" value={child.dob} onChange={e => updateChild(idx, 'dob', e.target.value)} className="h-9" />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
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
                          value={(formData.expenses as any)[item.key]} 
                          onChange={e => handleInputChange(`expenses.${item.key}`, parseFloat(e.target.value))}
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
                          value={(formData.assets as any)[item.key]} 
                          onChange={e => handleInputChange(`assets.${item.key}`, parseFloat(e.target.value))}
                        />
                      </div>
                    ))}
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
                          value={(formData.liabilities as any)[item.key]} 
                          onChange={e => handleInputChange(`liabilities.${item.key}`, parseFloat(e.target.value))}
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
                        <div className="grid grid-cols-2 gap-3">
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
                              value={other.amount} 
                              onChange={e => updateOtherLiability(idx, 'amount', parseFloat(e.target.value))}
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
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600 font-bold">Life Insurance Cover</Label>
                      <Input type="number" min={0} value={formData.insurance.life_cover} onChange={e => handleInputChange('insurance.life_cover', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600 font-bold">Life Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} value={formData.insurance.life_premium} onChange={e => handleInputChange('insurance.life_premium', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs text-green-600 font-bold">Health Insurance Cover</Label>
                      <Input type="number" min={0} value={formData.insurance.med_cover} onChange={e => handleInputChange('insurance.med_cover', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-green-600 font-bold">Health Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} value={formData.insurance.med_premium} onChange={e => handleInputChange('insurance.med_premium', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>

                {/* Vehicle & Other */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Vehicle Insurance Cover</Label>
                      <Input type="number" min={0} value={formData.insurance.veh_cover} onChange={e => handleInputChange('insurance.veh_cover', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Vehicle Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} value={formData.insurance.veh_premium} onChange={e => handleInputChange('insurance.veh_premium', parseFloat(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Other General Insurance Cover</Label>
                      <Input type="number" min={0} value={formData.insurance.other_cover} onChange={e => handleInputChange('insurance.other_cover', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs opacity-70">Other General Insurance Premium (Annually)</Label>
                      <Input type="number" min={0} value={formData.insurance.other_premium} onChange={e => handleInputChange('insurance.other_premium', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Bonus */}
              <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl flex items-center gap-6">
                <AlertCircle className="w-8 h-8 text-orange-500 opacity-40 shrink-0" />
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Health Insurance Bonus Years</Label>
                    <Input type="number" min={0} value={formData.medical_bonus_years} onChange={e => handleTopLevelChange('medical_bonus_years', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Avg. Health Insurance Bonus Percentage (%)</Label>
                    <Input type="number" min={0} value={formData.medical_bonus_percentage} onChange={e => handleTopLevelChange('medical_bonus_percentage', parseFloat(e.target.value))} />
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
                    <Input type="number" min={40} max={80} value={formData.assumptions.retirement_age} onChange={e => handleInputChange('assumptions.retirement_age', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Expectancy (Client)</Label>
                    <Input type="number" min={0} value={formData.assumptions.le_client} onChange={e => handleInputChange('assumptions.le_client', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Life Expectancy (Spouse)</Label>
                    <Input type="number" min={0} value={formData.assumptions.le_spouse} onChange={e => handleInputChange('assumptions.le_spouse', parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Inflation Rate (%)</Label>
                    <Input type="number" min={0} value={formData.assumptions.inflation} onChange={e => handleInputChange('assumptions.inflation', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Inflation Rate (%)</Label>
                    <Input type="number" min={0} value={formData.assumptions.medical_inflation} onChange={e => handleInputChange('assumptions.medical_inflation', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pre-Retirement Return (%)</Label>
                    <Input type="number" min={0} value={formData.assumptions.pre_ret_rate} onChange={e => handleInputChange('assumptions.pre_ret_rate', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Post-Retirement Return (%)</Label>
                    <Input type="number" min={0} value={formData.assumptions.post_ret_rate} onChange={e => handleInputChange('assumptions.post_ret_rate', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard of Living % for HLV</Label>
                    <Input type="number" min={0} value={formData.assumptions.sol_hlv} onChange={e => handleInputChange('assumptions.sol_hlv', parseFloat(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Standard of Living % for Retirement</Label>
                    <Input type="number" min={0} value={formData.assumptions.sol_ret} onChange={e => handleInputChange('assumptions.sol_ret', parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Section 10: Child Goals & 11. Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionHeader title="10. Child Goals" icon={GraduationCap} number="10" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Education Corpus Needed (Today)</Label>
                      <Input type="number" min={0} value={formData.assumptions.child_education_corpus} onChange={e => handleInputChange('assumptions.child_education_corpus', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years to Education Goal</Label>
                      <Input type="number" min={0} value={formData.assumptions.education_years} onChange={e => handleInputChange('assumptions.education_years', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Marriage Corpus Needed (Today)</Label>
                      <Input type="number" min={0} value={formData.assumptions.child_marriage_corpus} onChange={e => handleInputChange('assumptions.child_marriage_corpus', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years to Marriage Goal</Label>
                      <Input type="number" min={0} value={formData.assumptions.marriage_years} onChange={e => handleInputChange('assumptions.marriage_years', parseInt(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <SectionHeader title="11. Existing Goal Allocation (%)" icon={TrendingUp} number="11" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Education Goal Allocation (%)</Label>
                      <Input type="number" min={0} max={100} value={formData.education_investment_pct} onChange={e => handleTopLevelChange('education_investment_pct', parseFloat(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Marriage Goal Allocation (%)</Label>
                      <Input type="number" min={0} max={100} value={formData.marriage_investment_pct} onChange={e => handleTopLevelChange('marriage_investment_pct', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: AI & DISCLAIMER */}
          {step === 6 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Section 12: AI Exclusion */}
              <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                <SectionHeader title="12. AI Analysis Exclusion" icon={AlertCircle} number="12" />
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
                      I do not want Deepseek AI analysis comments in the report
                    </label>
                    <p className="text-xs text-muted-foreground">
                      The generated report will contain only numerical data if selected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 13: Disclaimer */}
              <div>
                <SectionHeader title="13. Disclaimer to Analysis" icon={FileText} number="13" />
                <Textarea 
                  value={formData.disclaimer_text} 
                  onChange={e => handleTopLevelChange('disclaimer_text', e.target.value)}
                  className="min-h-[200px] text-sm opacity-70 leading-relaxed font-serif"
                />
              </div>

              {/* Section 14: Discussion Notes */}
              <div>
                <SectionHeader title="14. Discussion Notes" icon={MessageSquare} number="14" />
                <Textarea 
                  value={formData.discussion_notes} 
                  onChange={e => handleTopLevelChange('discussion_notes', e.target.value)}
                  placeholder="Enter specific notes from client meeting..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-primary/10 backdrop-blur-md p-8 flex justify-between border-t border-primary/20">
          <Button variant="ghost" onClick={onCancel} className="font-bold hover:bg-destructive/10 hover:text-destructive">
            CANCEL AND EXIT
          </Button>
          
          <div className="flex gap-4">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} className="gap-2 border-primary/20">
                <ChevronLeft className="w-4 h-4" /> PREVIOUS STEP
              </Button>
            )}
            
            {step < 6 ? (
              <Button className="gap-2 bg-primary px-10 font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all" onClick={nextStep}>
                CONTINUE TO STEP {step + 1} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="gap-2 bg-green-600 hover:bg-green-700 px-12 font-black shadow-xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-all"
                disabled={loading}
              >
                {loading ? <span className="animate-spin mr-2">◌</span> : <Save className="w-4 h-4 mr-2" />}
                RUN COMPREHENSIVE ANALYSIS
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
