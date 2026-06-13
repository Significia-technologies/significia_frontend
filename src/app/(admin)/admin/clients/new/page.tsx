"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Copy, 
  PlusCircle, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Info, 
  Building2, 
  CreditCard, 
  Users, 
  ShieldCheck,
  UserCheck,
  MapPin,
  Phone,
  Landmark,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminService, ContactPersonPayload, StaffUserOut } from "@/core/services/admin.service";
import { AxiosError } from "axios";
import { toast } from "sonner";

export default function NewClientProvisioningPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    subdomain: "",
    nature_of_entity: "Individual",
    registration_no: "",
    date_of_registration: "",
    license_expiry_date: "",
    date_of_birth: "",
    registered_address: "",
    registered_contact_number: "",
    office_contact_number: "",
    cin_number: "",
    bank_name: "",
    bank_account_number: "",
    bank_branch: "",
    ifsc_code: "",
    is_renewal: false,
    renewal_certificate_no: "",
    renewal_expiry_date: "",
    pricing_model: "flat_fee",
    billing_mode: "yearly",
    plan_expiry_date: "",
    max_client_permit: 5,
    relationship_manager_id: "",
  });

  const [contactPersons, setContactPersons] = useState<ContactPersonPayload[]>([
    { name: "", designation: "", phone_number: "", email: "", address: "" }
  ]);

  const [rms, setRms] = useState<StaffUserOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { title: "Identity", description: "IA Registration", icon: Building2 },
    { title: "Operations", description: "Office & Staff", icon: MapPin },
    { title: "Financials", description: "Banking & Plan", icon: CreditCard },
  ];

  useEffect(() => {
    const fetchRMs = async () => {
      try {
        const staff = await AdminService.listStaff();
        const filteredRMs = staff.filter(s => s.role === 'relationship_manager' || s.role === 'super_admin');
        setRms(filteredRMs);
      } catch (err) {
        toast.error("Failed to load staff list for RM assignment");
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchRMs();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleContactChange = (index: number, field: keyof ContactPersonPayload, value: string) => {
    const updated = [...contactPersons];
    updated[index] = { ...updated[index], [field]: value };
    setContactPersons(updated);
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: "", designation: "", phone_number: "", email: "", address: "" }]);
  };

  const removeContactPerson = (index: number) => {
    if (contactPersons.length > 1) {
      setContactPersons(contactPersons.filter((_, i) => i !== index));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length) {
      handleNext();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const payload = {
        company_name: formData.companyName,
        email: formData.email,
        subdomain: formData.subdomain || undefined,
        nature_of_entity: formData.nature_of_entity,
        registration_no: formData.registration_no,
        registration_date: formData.date_of_registration,
        license_expiry_date: formData.license_expiry_date,
        date_of_birth: formData.date_of_birth,
        registered_address: formData.registered_address,
        registered_contact_number: formData.registered_contact_number,
        office_contact_number: formData.office_contact_number || undefined,
        cin_number: formData.cin_number || undefined,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_branch: formData.bank_branch,
        ifsc_code: formData.ifsc_code,
        is_renewal: formData.is_renewal,
        renewal_certificate_no: formData.is_renewal ? formData.renewal_certificate_no : undefined,
        renewal_expiry_date: formData.is_renewal ? formData.renewal_expiry_date : undefined,
        pricing_model: formData.pricing_model,
        billing_mode: formData.billing_mode,
        plan_expiry_date: formData.plan_expiry_date || undefined,
        max_client_permit: Number(formData.max_client_permit),
        relationship_manager_id: formData.relationship_manager_id || undefined,
        contact_persons: contactPersons.filter(cp => cp.name && cp.email),
      };

      const response = await AdminService.provisionClient(payload);
      setSuccessData(response);
      toast.success("Client provisioned successfully!");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
         const detail = err.response.data.detail;
         setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        setError("Failed to reach server. Check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 px-4 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning Successful</h1>
        </div>

        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-500/5 mb-6">
          <CheckCircle2 className="h-5 w-5 stroke-emerald-600" />
          <AlertTitle className="text-lg font-bold">Tenant Created</AlertTitle>
          <AlertDescription className="text-base">
            The record for <b>{successData.tenant_name}</b> is now live. Please provide the token below to the client.
          </AlertDescription>
        </Alert>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Onboarding Credentials</CardTitle>
                <CardDescription>Handover these details to the IA Master for Bridge installation.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-3">
              <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Bridge Registration Token</Label>
              <div className="flex gap-2">
                <Input value={successData.bridge_registration_token} readOnly className="font-mono text-sm bg-muted/50 border-primary/20 h-12" />
                <Button variant="outline" size="icon" className="h-12 w-12 border-primary/20" onClick={() => copyToClipboard(successData.bridge_registration_token)}>
                  <Copy className="h-4 w-4 text-primary" />
                </Button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-600 text-xs">
                <Info className="w-4 h-4 flex-shrink-0" />
                <p>This token is sensitive. The IA must use this in their <b>bridge/.env</b> to activate their silo.</p>
              </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-1.5 p-4 rounded-xl bg-muted/30">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider text-muted-foreground/60">Owner Email</Label>
                <p className="text-base font-semibold">{successData.email}</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl bg-muted/30">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider text-muted-foreground/60">Assigned Slug</Label>
                <p className="text-base font-semibold">{successData.subdomain || "None (Custom Domain Only)"}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-primary/10 bg-primary/5 py-6">
            <Button variant="ghost" onClick={() => setSuccessData(null)}>Provision Another IA</Button>
            <Link href="/admin">
              <Button className="px-8 shadow-lg shadow-primary/20">Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-4 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-primary/5 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Provision Client</h1>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-bold">Register New Investment Advisor</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
          <AlertTitle className="font-bold">Provisioning Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stepper Progress Section */}
      <div className="relative group mb-4">
        <div className="relative flex justify-between items-center bg-card/40 backdrop-blur-xl border border-primary/10 p-3 md:p-4 rounded-xl shadow-lg">
          {steps.map((step, idx) => {
             const StepIcon = step.icon;
             const isActive = currentStep === idx + 1;
             const isCompleted = currentStep > idx + 1;
             
             return (
               <div key={idx} className="flex-1 flex items-center justify-center gap-2 relative z-10">
                 <div className={`
                   flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-500
                   ${isActive ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105" : ""}
                   ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/10" : ""}
                   ${!isActive && !isCompleted ? "bg-background border-muted-foreground/20 text-muted-foreground/40" : ""}
                 `}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                 </div>
                 <div className="hidden sm:block">
                   <h3 className={`text-[11px] font-bold tracking-tight uppercase ${isActive ? "text-primary" : "text-muted-foreground/60"}`}>
                     {step.title}
                   </h3>
                 </div>
                 {idx < steps.length - 1 && (
                    <div className="hidden md:block w-8 lg:w-16 h-px bg-muted mx-2" />
                 )}
               </div>
             );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-4xl mx-auto">
          {/* Main Form Content Area */}
          <div className="space-y-4">
            {/* STEP 1: IDENTITY & REGISTRATION */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                {/* Identity Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">IA Identity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyName" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Full Company Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="companyName"
                          placeholder="Acme Capital Management"
                          className="bg-background/50 h-10 text-sm"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Root Owner Email <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@acmecapital.com"
                          className="bg-background/50 h-10 text-sm"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="date_of_birth" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Date of Incorporation <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input
                            id="date_of_birth"
                            type="date"
                            className="bg-background/50 h-10 pl-9 text-sm"
                            required
                            value={formData.date_of_birth}
                            onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                          />
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="subdomain" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Assigned Subdomain</Label>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0 sm:gap-0">
                        <Input
                          id="subdomain"
                          placeholder="acme"
                          className="rounded-b-none sm:rounded-r-none sm:rounded-b-md bg-background/50 h-10 text-sm"
                          value={formData.subdomain}
                          onChange={(e) => setFormData((prev) => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                        />
                        <div className="bg-muted px-3 h-10 flex items-center border border-t-0 sm:border-t sm:border-l-0 rounded-b-md sm:rounded-b-none sm:rounded-r-md text-xs text-muted-foreground font-bold">
                          .significia.com
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">Registration Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Nature of Entity <span className="text-red-500">*</span></Label>
                        <Select 
                          value={formData.nature_of_entity}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, nature_of_entity: v }))}
                        >
                          <SelectTrigger className="bg-background/50 h-10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Individual">Individual</SelectItem>
                            <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                            <SelectItem value="Partnership">Partnership</SelectItem>
                            <SelectItem value="LLP">LLP</SelectItem>
                            <SelectItem value="Body Corporate">Body Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="registration_no" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Registration Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="registration_no"
                          placeholder="INA000012345"
                          className="bg-background/50 h-10 text-sm"
                          required
                          value={formData.registration_no}
                          onChange={(e) => setFormData((prev) => ({ ...prev, registration_no: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="registration_date" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Registration Date <span className="text-red-500">*</span></Label>
                        <Input
                          id="registration_date"
                          type="date"
                          className="bg-background/50 h-10 text-sm"
                          required
                          value={formData.date_of_registration}
                          onChange={(e) => setFormData((prev) => ({ ...prev, date_of_registration: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="license_expiry_date" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">License Expiry <span className="text-red-500">*</span></Label>
                        <Input
                          id="license_expiry_date"
                          type="date"
                          className="bg-background/50 h-10 text-sm"
                          required
                          value={formData.license_expiry_date}
                          onChange={(e) => setFormData((prev) => ({ ...prev, license_expiry_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: OPERATIONS & PERSONNEL */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                {/* Registered Office Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">Registered Office</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="registered_address" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Registered Address <span className="text-red-500">*</span></Label>
                      <textarea
                        id="registered_address"
                        placeholder="Enter full registered address"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                        required
                        value={formData.registered_address}
                        onChange={(e) => setFormData((prev) => ({ ...prev, registered_address: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="registered_contact_number" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Primary Contact <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input
                            id="registered_contact_number"
                            placeholder="+91..."
                            className="bg-background/50 h-10 pl-9 text-sm"
                            required
                            value={formData.registered_contact_number}
                            onChange={(e) => setFormData((prev) => ({ ...prev, registered_contact_number: e.target.value }))}
                          />
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="office_contact_number" className="text-xs font-bold text-neutral-800 dark:text-neutral-300">Office Contact</Label>
                        <Input
                          id="office_contact_number"
                          placeholder="e.g. 022-..."
                          className="bg-background/50 h-10 text-sm"
                          value={formData.office_contact_number}
                          onChange={(e) => setFormData((prev) => ({ ...prev, office_contact_number: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Contacts Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base font-bold text-neutral-900 dark:text-neutral-100">Key Personnel</CardTitle>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={addContactPerson} className="text-[10px] h-7 gap-1.5 border-primary/20 hover:bg-primary/10 font-bold px-3">
                        <Plus className="w-3 h-3" /> Add Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {contactPersons.map((person, index) => (
                      <div key={index} className="space-y-3 p-4 rounded-xl bg-muted/30 border border-primary/5 relative group/item">
                        {contactPersons.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-destructive h-7 w-7 hover:bg-destructive/10" 
                            onClick={() => removeContactPerson(index)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-400 uppercase">Full Name</Label>
                            <Input placeholder="John Doe" className="bg-background h-9 text-xs" value={person.name} onChange={(e) => handleContactChange(index, "name", e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-neutral-700 dark:text-neutral-400 uppercase">Email</Label>
                            <Input type="email" placeholder="john@company.com" className="bg-background h-9 text-xs" value={person.email} onChange={(e) => handleContactChange(index, "email", e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: FINANCIALS & BILLING */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                {/* Banking Details Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <Landmark className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Banking Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="bank_name" className="font-bold text-neutral-800 dark:text-neutral-300">Bank Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="bank_name"
                          placeholder="e.g. HDFC Bank"
                          className="bg-background/50 h-11"
                          required
                          value={formData.bank_name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, bank_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number" className="font-bold text-neutral-800 dark:text-neutral-300">Account Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="bank_account_number"
                          placeholder="Enter account number"
                          className="bg-background/50 h-11"
                          required
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData((prev) => ({ ...prev, bank_account_number: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_branch" className="font-bold text-neutral-800 dark:text-neutral-300">Branch Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="bank_branch"
                          placeholder="e.g. Bandra East"
                          className="bg-background/50 h-11"
                          required
                          value={formData.bank_branch}
                          onChange={(e) => setFormData((prev) => ({ ...prev, bank_branch: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc_code" className="font-bold text-neutral-800 dark:text-neutral-300">IFSC Code <span className="text-red-500">*</span></Label>
                        <Input
                          id="ifsc_code"
                          placeholder="HDFC0001234"
                          className="bg-background/50 h-11 uppercase font-mono"
                          required
                          value={formData.ifsc_code}
                          onChange={(e) => setFormData((prev) => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing & RM Assignment Section */}
                <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                  <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Subscription & Relationship</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Left Column: Management */}
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <Label className="font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
                               <UserCheck className="w-4 h-4 text-primary" /> Assigned Relationship Manager <span className="text-red-500">*</span>
                             </Label>
                             <Select 
                                value={formData.relationship_manager_id}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, relationship_manager_id: v }))}
                              >
                                <SelectTrigger className="bg-background/50 h-11 border-primary/20">
                                  <SelectValue placeholder="Select Manager" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rms.map(rm => (
                                    <SelectItem key={rm.id} value={rm.id}>{rm.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          </div>

                          <div className="space-y-2">
                             <Label className="font-bold text-neutral-800 dark:text-neutral-300">Max Client Permit</Label>
                             <Input
                               type="number"
                               className="bg-background/50 h-11"
                               value={formData.max_client_permit}
                               onChange={(e) => setFormData(prev => ({ ...prev, max_client_permit: Number(e.target.value) }))}
                             />
                          </div>
                       </div>

                       {/* Right Column: Billing */}
                       <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-bold text-neutral-800 dark:text-neutral-300">Pricing Model</Label>
                              <Select 
                                value={formData.pricing_model}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, pricing_model: v }))}
                              >
                                <SelectTrigger className="bg-background/50 h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="flat_fee">Flat Fee</SelectItem>
                                  <SelectItem value="percentage_of_aum">% of AUM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-neutral-800 dark:text-neutral-300">Frequency</Label>
                              <Select 
                                value={formData.billing_mode}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, billing_mode: v }))}
                              >
                                <SelectTrigger className="bg-background/50 h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                             <Label className="font-bold text-neutral-800 dark:text-neutral-300">Plan Expiry Date</Label>
                             <Input
                               type="date"
                               className="bg-background/50 h-11"
                               value={formData.plan_expiry_date}
                               onChange={(e) => setFormData(prev => ({ ...prev, plan_expiry_date: e.target.value }))}
                             />
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 pt-6 pb-12">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || isLoading}
                className="h-12 w-full sm:w-auto px-8 font-bold gap-2 hover:bg-primary/5 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                 <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className="h-12 w-full sm:w-auto px-6 font-semibold order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading || (currentStep === 3 && !formData.relationship_manager_id)} 
                    className={`h-12 w-full sm:w-auto px-10 font-bold shadow-xl transition-all duration-300 order-1 sm:order-2 ${currentStep === 3 ? "bg-primary shadow-primary/30" : "bg-neutral-800"}`}
                  >
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    ) : currentStep === steps.length ? (
                      <><PlusCircle className="mr-2 h-5 w-5" /> Provision New IA</>
                    ) : (
                      "Continue"
                    )}
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
