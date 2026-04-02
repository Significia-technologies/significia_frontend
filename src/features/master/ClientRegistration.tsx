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
  UploadCloud
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
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { RegistrationPreviewModal } from "./components/RegistrationPreviewModal";
import { useRouter } from "next/navigation";

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
  "Signature"
];

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
  const [pendingDocuments, setPendingDocuments] = useState<Record<string, File>>({});

  const [formData, setFormData] = useState<ClientCreate>(initialData || {
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
    declaration_date: new Date().toISOString().split('T')[0],
    assigned_employee_id: "",
  });

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const iaMaster = await IAMasterService.getLatest();
        if (iaMaster) {
          if (iaMaster.employees) {
            setEmployees(iaMaster.employees);
          }
          // Auto-fill advisor info
          setFormData(prev => ({
            ...prev,
            advisor_name: iaMaster.name_of_ia,
            advisor_registration_number: iaMaster.ia_registration_number
          }));
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  // Sync formData with initialData when it changes (Edit Mode)
  React.useEffect(() => {
    if (isEdit && initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure numeric fields are correctly handled if they come as null/undefined
        annual_income: initialData.annual_income || "" as any,
        net_worth: initialData.net_worth || "" as any,
        existing_portfolio_value: initialData.existing_portfolio_value || "" as any,
        // Ensure dates are just the YYYY-MM-DD part
        date_of_birth: initialData.date_of_birth?.split('T')[0] || "",
        client_date: initialData.client_date?.split('T')[0] || "",
        declaration_date: initialData.declaration_date?.split('T')[0] || "",
      }));
    }
  }, [initialData, isEdit]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      // Allow empty string or numbers only
      // If value is empty, set it as empty string to allow clearing the field
      // Otherwise parse as float
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value),
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
    
    // Age Validation
    if (formData.date_of_birth) {
      if (currentAge < 18) {
        toast.error("Client must be at least 18 years old.");
        return;
      }
    }
    
    // Document Validation
    if (!isEdit) {
        const missingDocs = REQUIRED_DOCUMENTS.filter(doc => !pendingDocuments[doc]);
        if (missingDocs.length > 0) {
            toast.error(`Missing mandatory documents: ${missingDocs.join(', ')}`);
            setActiveTab("documents");
            return;
        }
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
    };

    try {
      if (isEdit && clientId) {
          await MasterDataService.updateClient(clientId, submissionData);
          toast.success("Client updated successfully!");
          router.push(`/master/clients/${clientId}`);
      } else {
          const client = await MasterDataService.createClient(submissionData);
          if (client.id && Object.keys(pendingDocuments).length > 0) {
              toast.info("Registration saving. Uploading secure documents...", { duration: 5000 });
              for (const [docType, file] of Object.entries(pendingDocuments)) {
                  try {
                      await MasterDataService.uploadDocument(client.id, file, docType);
                  } catch (e) {
                      console.error(`Failed to upload ${docType}`, e);
                  }
              }
          }
          toast.success("Client registered and documents secured!");
          router.push("/master");
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
                      <Input name="client_name" value={formData.client_name} onChange={handleChange} required placeholder="Full name as per PAN" />
                    </div>
                    <div className="space-y-2">
                      <Label className={isUnderage ? "text-red-500" : ""}>Date of Birth *</Label>
                      <Input 
                        type="date" 
                        name="date_of_birth" 
                        value={formData.date_of_birth} 
                        onChange={handleChange} 
                        required 
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
                        <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="client@example.com" disabled={isEdit} />
                    </div>
                    {!isEdit && (
                      <div className="space-y-2">
                          <Label>Password for Client Login *</Label>
                          <Input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Temporary password" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label>Residential Status *</Label>
                        <Select 
                          name="residential_status" 
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
                            name="aadhar_number" 
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
                          <Input name="passport_number" value={formData.passport_number} onChange={handleChange} required placeholder="Passport number" />
                      </div>
                    )}
                    <div className="space-y-2">
                        <Label>Nationality *</Label>
                        <Input name="nationality" value={formData.nationality} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <Label>PAN Number *</Label>
                       <Input name="pan_number" value={formData.pan_number.toUpperCase()} onChange={handleChange} required placeholder="ABCDE1234F" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number *</Label>
                      <Input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} required placeholder="+91 98765 43210" />
                    </div>
                    <div className="space-y-2">
                        <Label>Gender *</Label>
                        <Select 
                          name="gender" 
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
                          name="marital_status" 
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
                    <Textarea name="address" value={formData.address} onChange={handleChange} required placeholder="Complete address with City, State, ZIP..." className="min-h-[100px]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Father's Name *</Label>
                      <Input name="father_name" value={formData.father_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Mother's Name *</Label>
                      <Input name="mother_name" value={formData.mother_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Spouse Name (Optional)</Label>
                      <Input name="spouse_name" value={formData.spouse_name} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label>Tax Residency *</Label>
                        <Input name="tax_residency" value={formData.tax_residency} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>PEP Status *</Label>
                      <Select 
                        name="pep_status" 
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
                        name="fatca_compliance" 
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
                      <Input name="nominee_name" value={formData.nominee_name} onChange={handleChange} placeholder="Optional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship with Nominee</Label>
                      <Input name="nominee_relationship" value={formData.nominee_relationship} onChange={handleChange} placeholder="e.g. Spouse, Son, Mother" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Assigned Professional (Employee/Partner) *</Label>
                    <Select 
                      name="assigned_employee_id" 
                      value={formData.assigned_employee_id} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, assigned_employee_id: val }))}
                      required
                    >
                      <SelectTrigger className="w-full bg-background/50 border-primary/20">
                        <SelectValue placeholder="Select Professional" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-primary/20">
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id || ""}>
                            {emp.name_of_employee} ({emp.designation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Select the Employee or Partner providing advisory services to this client.</p>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Annual Income (INR) *</Label>
                      <Input type="number" name="annual_income" value={formData.annual_income} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Net Worth (INR) *</Label>
                      <Input type="number" name="net_worth" value={formData.net_worth} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Source of Income *</Label>
                      <Select 
                        name="income_source" 
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
                      <Input name="occupation" value={formData.occupation} onChange={handleChange} required placeholder="Software Engineer, Doctor, etc." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Existing Portfolio Value (₹) *</Label>
                      <Input type="number" name="existing_portfolio_value" value={formData.existing_portfolio_value} onChange={handleChange} placeholder="e.g. 500000" required />
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Existing Portfolio Composition</Label>
                    <Textarea name="existing_portfolio_composition" value={formData.existing_portfolio_composition} onChange={handleChange} placeholder="Details of existing Equity, Mutual Funds, FDRs..." />
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Account Number *</Label>
                      <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} placeholder="e.g. 1234567890" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name *</Label>
                      <Input name="bank_name" value={formData.bank_name} onChange={handleChange} placeholder="e.g. HDFC Bank, ICICI Bank" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Branch *</Label>
                      <Input name="bank_branch" value={formData.bank_branch} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code *</Label>
                      <Input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required placeholder="HDFC0001234" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Demat Account (Optional)</Label>
                      <Input name="demat_account_number" value={formData.demat_account_number} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Trading Account (Optional)</Label>
                      <Input name="trading_account_number" value={formData.trading_account_number} onChange={handleChange} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="investment" className="space-y-6 mt-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Risk Profile *</Label>
                      <Select 
                        name="risk_profile" 
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
                        name="investment_horizon" 
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
                    <Textarea name="investment_objectives" value={formData.investment_objectives} onChange={handleChange} required placeholder="e.g. Wealth Creation, Pension Planning, Children Education..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Investment Experience *</Label>
                      <Select 
                        name="investment_experience" 
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
                        name="liquidity_needs" 
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
                          <Input name="advisor_name" value={formData.advisor_name} onChange={handleChange} required readOnly className="bg-muted font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Advisor Registration Number</Label>
                          <Input name="advisor_registration_number" value={formData.advisor_registration_number} onChange={handleChange} required readOnly className="bg-muted font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Previous Advisor Name (if any)</Label>
                          <Input name="previous_advisor_name" value={formData.previous_advisor_name} onChange={handleChange} placeholder="e.g. Previous Firm Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Referral Source</Label>
                          <Select 
                            name="referral_source" 
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
                          <Input type="date" name="client_date" value={formData.client_date} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Declaration Date *</Label>
                          <Input type="date" name="declaration_date" value={formData.declaration_date} onChange={handleChange} required />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-primary/5 border-primary/20 mt-8">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle2 className="w-6 h-6 text-primary mt-1" />
                            <div className="space-y-2">
                                <h3 className="font-bold">SEBI Compliance Declaration</h3>
                                <p className="text-sm text-muted-foreground">
                                    I hereby confirm that all details provided are accurate to the best of my knowledge and comply with SEBI Investment Advisor guidelines. The client's identity has been verified via KYC documents.
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
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto px-8 border-primary/20 h-11 sm:h-auto">
                  Cancel
                </Button>
                
                <div className="flex gap-4 w-full sm:w-auto">
                  {activeTab !== "documents" ? (
                    <Button 
                      type="button" 
                      onClick={() => {
                        const tabs = ["personal", "financial", "bank", "investment", "compliance", "documents"];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        setActiveTab(tabs[nextIndex]);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full sm:px-10 h-11 sm:h-auto"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="w-full sm:px-12 gap-2 h-12 text-lg font-bold shadow-lg shadow-primary/20">
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
