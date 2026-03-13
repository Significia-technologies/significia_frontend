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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientRegistrationFormProps {
  connectorId: string;
  initialData?: ClientCreate;
  clientId?: string;
  isEdit?: boolean;
}

export default function ClientRegistrationForm({ 
  connectorId, 
  initialData, 
  clientId, 
  isEdit = false 
}: ClientRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [employees, setEmployees] = useState<Employee[]>([]);

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
        const iaMaster = await IAMasterService.getLatest(connectorId);
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
  }, [connectorId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const submissionData = {
      ...formData,
      annual_income: Number(formData.annual_income) || 0,
      net_worth: Number(formData.net_worth) || 0,
      existing_portfolio_value: Number(formData.existing_portfolio_value) || 0,
    };

    try {
      // Age Validation
      if (formData.date_of_birth) {
        if (currentAge < 18) {
          toast.error("Client must be at least 18 years old.");
          setLoading(false);
          return;
        }
      }

      if (isEdit && clientId) {
          await MasterDataService.updateClient(connectorId, clientId, submissionData);
          toast.success("Client updated successfully!");
          router.push(`/master/clients/${clientId}`);
      } else {
          await MasterDataService.createClient(connectorId, submissionData);
          toast.success("Client registered successfully!");
          router.push("/master");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'register'} client`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? `Editing: ${formData.client_name}` : 'New Client Registration'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Update the client information in your secure private database.' : 'Complete the SEBI-mandated onboarding process for your new client.'}</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full h-auto p-0 flex flex-wrap bg-muted/30 border-b border-primary/10 rounded-none">
                <TabsTrigger value="personal" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <UserPlus className="w-4 h-4" /> Personal
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <CreditCard className="w-4 h-4" /> Financial
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Building className="w-4 h-4" /> Banking
                </TabsTrigger>
                <TabsTrigger value="investment" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <TrendingUp className="w-4 h-4" /> Investment
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex-1 py-4 gap-2 data-[state=active]:bg-primary/5 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <ShieldCheck className="w-4 h-4" /> Compliance
                </TabsTrigger>
              </TabsList>

              <div className="p-8 pb-12 min-h-[500px]">
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
                        <select name="gender" value={formData.gender} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Marital Status *</Label>
                        <select name="marital_status" value={formData.marital_status} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                        </select>
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
                        <Label>Nationality *</Label>
                        <Input name="nationality" value={formData.nationality} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Residential Status *</Label>
                        <select name="residential_status" value={formData.residential_status} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="Resident Individual">Resident Individual</option>
                            <option value="Non-Resident Indian">Non-Resident Indian</option>
                            <option value="Person of Indian Origin">Person of Indian Origin</option>
                            <option value="Foreign National">Foreign National</option>
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label>Tax Residency *</Label>
                        <Input name="tax_residency" value={formData.tax_residency} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>PEP Status *</Label>
                      <select name="pep_status" value={formData.pep_status} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="Not a PEP">Not a PEP</option>
                        <option value="PEP">Politically Exposed Person</option>
                        <option value="Family Member of PEP">Family Member of PEP</option>
                        <option value="Close Associate of PEP">Close Associate of PEP</option>
                      </select>
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
                    <select 
                      name="assigned_employee_id" 
                      value={formData.assigned_employee_id} 
                      onChange={handleChange} 
                      required 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Select Professional</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name_of_employee} ({emp.designation})
                        </option>
                      ))}
                    </select>
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
                      <select name="income_source" value={formData.income_source} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Select Source</option>
                        <option value="Salaried">Salaried</option>
                        <option value="Business">Business</option>
                        <option value="Professional">Professional</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Investments">Investments</option>
                        <option value="Other">Other</option>
                      </select>
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
                      <select name="risk_profile" value={formData.risk_profile} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Medium">Medium</option>
                        <option value="Aggressive">Aggressive</option>
                        <option value="Very Aggressive">Very Aggressive</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Investment Horizon *</Label>
                      <select name="investment_horizon" value={formData.investment_horizon} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Select Horizon</option>
                        <option value="Short Term">Short Term (1-3 years)</option>
                        <option value="Medium Term">Medium Term (3-7 years)</option>
                        <option value="Long Term">Long Term (7+ years)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Investment Objectives *</Label>
                    <Textarea name="investment_objectives" value={formData.investment_objectives} onChange={handleChange} required placeholder="e.g. Wealth Creation, Pension Planning, Children Education..." />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Investment Experience *</Label>
                      <select name="investment_experience" value={formData.investment_experience} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Select Experience</option>
                        <option value="Beginner">Beginner (0-2 years)</option>
                        <option value="Intermediate">Intermediate (2-5 years)</option>
                        <option value="Experienced">Experienced (5-10 years)</option>
                        <option value="Expert">Expert (10+ years)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Liquidity Needs *</Label>
                      <select name="liquidity_needs" value={formData.liquidity_needs} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">Select Needs</option>
                        <option value="Low">Low (can lock funds for long term)</option>
                        <option value="Medium">Medium (some funds may be needed)</option>
                        <option value="High">High (regular need for liquid funds)</option>
                      </select>
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
                          <select name="referral_source" value={formData.referral_source} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select Source</option>
                            <option value="Existing Client">Existing Client</option>
                            <option value="Friend/Family">Friend/Family</option>
                            <option value="Online Search">Online Search</option>
                            <option value="Advertisement">Advertisement</option>
                            <option value="Other">Other</option>
                          </select>
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>FATCA Compliance *</Label>
                          <select name="fatca_compliance" value={formData.fatca_compliance} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="FATCA Compliant">FATCA Compliant</option>
                            <option value="Non-Compliant">Non-Compliant</option>
                            <option value="Not Applicable">Not Applicable</option>
                          </select>
                        </div>
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
              </div>

              <div className="p-8 border-t border-primary/10 bg-muted/20 flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="px-8 border-primary/20">
                  Cancel
                </Button>
                
                <div className="flex gap-4">
                  {activeTab !== "compliance" ? (
                    <Button 
                      type="button" 
                      onClick={() => {
                        const tabs = ["personal", "financial", "bank", "investment", "compliance"];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        setActiveTab(tabs[nextIndex]);
                      }}
                      className="px-10"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="px-12 gap-2 h-12 text-lg font-bold shadow-lg shadow-primary/20">
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
    </div>
  );
}
