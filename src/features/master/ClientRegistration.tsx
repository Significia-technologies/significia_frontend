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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientRegistrationFormProps {
  connectorId: string;
}

export default function ClientRegistrationForm({ connectorId }: ClientRegistrationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState<ClientCreate>({
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
    residential_status: "Resident",
    tax_residency: "India",
    pep_status: "No",
    father_name: "",
    mother_name: "",
    spouse_name: "",
    annual_income: 0,
    net_worth: 0,
    income_source: "",
    fatca_compliance: "Yes",
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
    ifsc_code: "",
    risk_profile: "Moderate",
    investment_experience: "0-2 Years",
    investment_objectives: "",
    investment_horizon: "1-3 Years",
    liquidity_needs: "Low",
    advisor_name: "",
    nominee_name: "",
    nominee_relationship: "",
    declaration_signed: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await MasterDataService.createClient(connectorId, formData);
      toast.success("Client registered successfully!");
      router.push("/master");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to register client");
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
          <h1 className="text-3xl font-bold tracking-tight">New Client Registration</h1>
          <p className="text-muted-foreground">Complete the SEBI-mandated onboarding process for your new client.</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Client Name *</Label>
                      <Input name="client_name" value={formData.client_name} onChange={handleChange} required placeholder="Full name as per PAN" />
                    </div>
                    <div className="space-y-2">
                        <Label>Client Code *</Label>
                        <Input name="client_code" value={formData.client_code} onChange={handleChange} required placeholder="Unique Client Code" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Email (Login Username) *</Label>
                        <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="client@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Password for Client Login *</Label>
                        <Input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Temporary password" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </TabsContent>

                <TabsContent value="financial" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Annual Income (INR) *</Label>
                      <Input type="number" name="annual_income" value={formData.annual_income} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Net Worth (INR) *</Label>
                      <Input type="number" name="net_worth" value={formData.net_worth} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Source of Income *</Label>
                      <Input name="income_source" value={formData.income_source} onChange={handleChange} required placeholder="Salary, Business, Profession, etc." />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation *</Label>
                      <Input name="occupation" value={formData.occupation} onChange={handleChange} required placeholder="Software Engineer, Doctor, etc." />
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
                      <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name *</Label>
                      <Input name="bank_name" value={formData.bank_name} onChange={handleChange} required placeholder="e.g. HDFC Bank, ICICI Bank" />
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
                        <option value="Aggressive">Aggressive</option>
                        <option value="Very Aggressive">Very Aggressive</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Investment Horizon *</Label>
                      <select name="investment_horizon" value={formData.investment_horizon} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="Less than 1 Year">Less than 1 Year</option>
                        <option value="1-3 Years">1-3 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
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
                        <option value="None">None (Beginner)</option>
                        <option value="0-2 Years">0-2 Years</option>
                        <option value="2-5 Years">2-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Liquidity Needs *</Label>
                      <select name="liquidity_needs" value={formData.liquidity_needs} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="High">High (Needs cash frequently)</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low (Long-term lock-in okay)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Advisor Name *</Label>
                      <Input name="advisor_name" value={formData.advisor_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Marital Status *</Label>
                        <select name="marital_status" value={formData.marital_status} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                        </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                      <Label>Nominee Name</Label>
                      <Input name="nominee_name" value={formData.nominee_name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship with Nominee</Label>
                      <Input name="nominee_relationship" value={formData.nominee_relationship} onChange={handleChange} />
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
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      {loading ? "Registering..." : "Finalize Registration"}
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
