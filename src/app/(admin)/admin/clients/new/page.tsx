"use client";

import React, { useState } from "react";
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
  ShieldCheck 
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
import { AdminService, ContactPersonPayload } from "@/core/services/admin.service";
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
    license_expiry_date: "",
    is_renewal: false,
    renewal_certificate_no: "",
    renewal_expiry_date: "",
    pricing_model: "flat_fee",
    billing_mode: "yearly",
    plan_expiry_date: "",
    max_client_permit: 5,
  });

  const [contactPersons, setContactPersons] = useState<ContactPersonPayload[]>([
    { name: "", designation: "", phone_number: "", email: "", address: "" }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        license_expiry_date: formData.license_expiry_date,
        is_renewal: formData.is_renewal,
        renewal_certificate_no: formData.is_renewal ? formData.renewal_certificate_no : undefined,
        renewal_expiry_date: formData.is_renewal ? formData.renewal_expiry_date : undefined,
        pricing_model: formData.pricing_model,
        billing_mode: formData.billing_mode,
        plan_expiry_date: formData.plan_expiry_date || undefined,
        max_client_permit: Number(formData.max_client_permit),
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
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Provision Client</h1>
            <p className="text-muted-foreground mt-1">Register a new Investment Advisor tenant into the ecosystem.</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
          <AlertTitle className="font-bold">Provisioning Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Identity Section */}
            <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
              <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">IA Identity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Full Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Capital Management"
                      className="bg-background/50 h-10"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Root Owner Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@acmecapital.com"
                      className="bg-background/50 h-10"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Assigned Subdomain</Label>
                  <div className="flex items-center">
                    <Input
                      id="subdomain"
                      placeholder="acme"
                      className="rounded-r-none bg-background/50 h-10"
                      value={formData.subdomain}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                    />
                    <div className="bg-muted px-4 h-10 flex items-center border border-l-0 rounded-r-md text-sm text-muted-foreground font-medium">
                      .significia.com
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Leave blank if the IA will use a dedicated custom domain (e.g., portal.acme.com).</p>
                </div>
              </CardContent>
            </Card>

            {/* Registration Section */}
            <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
              <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">SEC/SEBI Registration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nature of Entity *</Label>
                    <Select 
                      value={formData.nature_of_entity}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, nature_of_entity: v }))}
                    >
                      <SelectTrigger className="bg-background/50 h-10">
                        <SelectValue placeholder="Select type" />
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
                  <div className="space-y-2">
                    <Label htmlFor="registration_no">Registration Number *</Label>
                    <Input
                      id="registration_no"
                      placeholder="e.g. INA000012345"
                      className="bg-background/50 h-10"
                      required
                      value={formData.registration_no}
                      onChange={(e) => setFormData((prev) => ({ ...prev, registration_no: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                    <Label htmlFor="license_expiry_date">License Expiry Date *</Label>
                    <Input
                      id="license_expiry_date"
                      type="date"
                      className="bg-background/50 h-10"
                      required
                      value={formData.license_expiry_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, license_expiry_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Is this a Renewal?</Label>
                    <div className="flex items-center gap-6 h-10">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            className="w-4 h-4 accent-primary" 
                            checked={!formData.is_renewal} 
                            onChange={() => setFormData(prev => ({ ...prev, is_renewal: false }))} 
                          />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">Fresh Onboarding</span>
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            className="w-4 h-4 accent-primary" 
                            checked={formData.is_renewal} 
                            onChange={() => setFormData(prev => ({ ...prev, is_renewal: true }))} 
                          />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">Existing Renewal</span>
                       </label>
                    </div>
                  </div>
                </div>

                {formData.is_renewal && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 animate-in slide-in-from-left duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="renewal_certificate_no">Renewal Certificate No</Label>
                        <Input
                          id="renewal_certificate_no"
                          placeholder="e.g. R-INA0000..."
                          className="bg-background h-10 border-amber-500/20"
                          value={formData.renewal_certificate_no}
                          onChange={(e) => setFormData((prev) => ({ ...prev, renewal_certificate_no: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="renewal_expiry_date">Renewal Expiry Date</Label>
                        <Input
                          id="renewal_expiry_date"
                          type="date"
                          className="bg-background h-10 border-amber-500/20"
                          value={formData.renewal_expiry_date}
                          onChange={(e) => setFormData((prev) => ({ ...prev, renewal_expiry_date: e.target.value }))}
                        />
                      </div>
                   </div>
                )}
              </CardContent>
            </Card>

            {/* Key Contacts Section */}
            <Card className="border-primary/10 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
              <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Contact Persons</CardTitle>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addContactPerson} className="text-xs gap-1 border-primary/20 hover:bg-primary/10">
                    <Plus className="w-3.5 h-3.5" /> Add Person
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {contactPersons.map((person, index) => (
                  <div key={index} className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border relative animate-in zoom-in-95 duration-200">
                    {contactPersons.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-destructive h-8 w-8 hover:bg-destructive/10" 
                        onClick={() => removeContactPerson(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Key Personnel #{index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Full Name</Label>
                        <Input 
                          placeholder="e.g. John Doe" 
                          className="bg-background h-9 text-sm" 
                          value={person.name} 
                          onChange={(e) => handleContactChange(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email Address</Label>
                        <Input 
                          type="email" 
                          placeholder="john@acme.com" 
                          className="bg-background h-9 text-sm" 
                          value={person.email} 
                          onChange={(e) => handleContactChange(index, "email", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone Number</Label>
                        <Input 
                          placeholder="+91 98765..." 
                          className="bg-background h-9 text-sm" 
                          value={person.phone_number} 
                          onChange={(e) => handleContactChange(index, "phone_number", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Designation</Label>
                        <Input 
                          placeholder="e.g. Compliance Officer" 
                          className="bg-background h-9 text-sm" 
                          value={person.designation} 
                          onChange={(e) => handleContactChange(index, "designation", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area: Billing & Actions */}
          <div className="space-y-8">
            <Card className="border-primary/20 shadow-lg bg-card/60 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
               <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Billing & Plan</CardTitle>
                  </div>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Pricing Model</Label>
                    <Select 
                      value={formData.pricing_model}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, pricing_model: v }))}
                    >
                      <SelectTrigger className="bg-background h-10 border-primary/10">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat_fee">Flat Fee</SelectItem>
                        <SelectItem value="percentage_of_aum">% of AUM</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Frequency</Label>
                    <Select 
                      value={formData.billing_mode}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, billing_mode: v }))}
                    >
                      <SelectTrigger className="bg-background h-10 border-primary/10">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_client_permit">Max Client Permit</Label>
                    <Input
                      id="max_client_permit"
                      type="number"
                      min="1"
                      className="bg-background h-10 border-primary/10"
                      value={formData.max_client_permit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, max_client_permit: Number(e.target.value) }))}
                    />
                    <p className="text-[10px] text-muted-foreground font-medium">Cap on number of investors allowed.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan_expiry_date">Plan Expiry Date</Label>
                    <Input
                      id="plan_expiry_date"
                      type="date"
                      className="bg-background h-10 border-primary/10"
                      value={formData.plan_expiry_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, plan_expiry_date: e.target.value }))}
                    />
                  </div>

                  <Separator className="bg-primary/5" />

                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground leading-relaxed italic">
                      Check all details carefully. Once provisioned, a unique Bridge Token will be generated for the IA to activate their local silo.
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95">
                      {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <><PlusCircle className="mr-2 h-5 w-5" /> Provision New IA</>}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading} className="w-full">
                       Cancel
                    </Button>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
