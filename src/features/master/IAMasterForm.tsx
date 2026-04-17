"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Database, 
  ShieldCheck, 
  Database as DbIcon,
  Info,
  FileCheck,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAssetUrl } from "@/core/api/api-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthService } from "@/core/services/auth.service";
import { useAppStore } from "@/store/useAppStore";


interface IAMasterFormProps {
  
  initialData?: IAMaster | null;
}

export function IAMasterForm({ initialData }: IAMasterFormProps) {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [iaNumberExists, setIaNumberExists] = useState(false);

  const getFileName = (path: string | undefined) => {
    if (!path) return "";
    const cleanPath = path.split('?')[0];
    return cleanPath.split('/').pop() || "";
  };

  const [formData, setFormData] = useState({
    name_of_ia: "",
    date_of_birth: "",
    nature_of_entity: "",
    name_of_entity: "",
    basl_membership_id: "",
    ia_registration_number: "",
    date_of_registration: "",
    date_of_registration_expiry: "",
    registered_address: "",
    registered_contact_number: "",
    office_contact_number: "",
    registered_email_id: "",
    cin_number: "",
    bank_account_number: "",
    bank_name: "",
    bank_branch: "",
    ifsc_code: "",
    change_reason_type: "data_correction",
    change_reason_text: "",
  });

  const [files, setFiles] = useState<{
    ia_certificate: File | null;
    ia_signature: File | null;
    ia_logo: File | null;
  }>({
    ia_certificate: null,
    ia_signature: null,
    ia_logo: null,
  });


  useEffect(() => {
    if (initialData) {
      setFormData({
        name_of_ia: initialData.name_of_ia || "",
        date_of_birth: initialData.date_of_birth || "",
        nature_of_entity: initialData.nature_of_entity || "",
        name_of_entity: initialData.name_of_entity || "",
        basl_membership_id: initialData.basl_membership_id || "",
        ia_registration_number: initialData.ia_registration_number || "",
        date_of_registration: initialData.date_of_registration || "",
        date_of_registration_expiry: initialData.date_of_registration_expiry || "",
        registered_address: initialData.registered_address || "",
        registered_contact_number: initialData.registered_contact_number || "",
        office_contact_number: initialData.office_contact_number || "",
        registered_email_id: initialData.registered_email_id || "",
        cin_number: initialData.cin_number || "",
        bank_account_number: initialData.bank_account_number || "",
        bank_name: initialData.bank_name || "",
        bank_branch: initialData.bank_branch || "",
        ifsc_code: initialData.ifsc_code || "",
        change_reason_type: "data_correction",
        change_reason_text: "",
      });
    } else if (user && !formData.registered_email_id) {
      // First-time setup: pre-populate from user session if not already filled
      setFormData(prev => ({
        ...prev,
        name_of_ia: prev.name_of_ia || user.company_name || "",
        registered_email_id: prev.registered_email_id || user.email || "",
        registered_contact_number: prev.registered_contact_number || user.phone_number || ""
      }));
    }
  }, [initialData, user]);

  const isSinglePersonEntity = formData.nature_of_entity === "individual" || formData.nature_of_entity === "proprietorship";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const validateIANumber = async () => {
    if (!formData.ia_registration_number || (initialData && initialData.ia_registration_number === formData.ia_registration_number)) return;
    try {
      const exists = await IAMasterService.validateIANumber(formData.ia_registration_number);
      setIaNumberExists(exists);
      if (exists) {
        toast.error("IA Registration Number already exists!");
      }
    } catch (error) {
      console.error("Validation failed", error);
    }
  };


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (iaNumberExists) {
      toast.error("Please use a unique IA Registration Number");
      return;
    }

    if (initialData && (!formData.change_reason_text || formData.change_reason_text.length < 5)) {
      toast.error("Please provide a valid reason for this update (min 5 characters)");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      
      // Append basic fields
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Append master files
      if (files.ia_certificate) data.append("ia_certificate", files.ia_certificate);
      if (files.ia_signature) data.append("ia_signature", files.ia_signature);
      if (files.ia_logo) data.append("ia_logo", files.ia_logo);


      if (initialData?.id) {
        await IAMasterService.update(initialData.id, data);
      } else {
        await IAMasterService.create(data);
      }
      
      // Refresh global session to update profile completion status
      await AuthService.refreshUser(setUser);
      
      toast.success("Investment Advisor record saved successfully!");
      router.push("/master");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save IA record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:px-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IA Master Entry</h1>
          <p className="text-muted-foreground text-sm">
            {initialData ? "Update" : "Register"} Investment Advisor details.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 sm:px-6 pt-4 bg-muted/30 border-b border-primary/10">
                <TabsList className="bg-transparent h-auto p-0 gap-6 sm:gap-8 flex justify-start border-none overflow-x-auto scrollbar-none flex-nowrap pb-1">
                  <TabsTrigger 
                    value="basic" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold whitespace-nowrap"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bank" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold whitespace-nowrap"
                  >
                    Bank Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="docs" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold whitespace-nowrap"
                  >
                    Documents
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 sm:p-6">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Name of Investment Advisor *</Label>
                      <Input name="name_of_ia" value={formData.name_of_ia} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className={calculateAge(formData.date_of_birth) < 18 && formData.date_of_birth ? "text-destructive font-bold" : ""}>
                        Date of Birth * {calculateAge(formData.date_of_birth) < 18 && formData.date_of_birth && `(Age: ${calculateAge(formData.date_of_birth)})`}
                      </Label>
                      <Input 
                        type="date" 
                        name="date_of_birth" 
                        value={formData.date_of_birth} 
                        onChange={handleChange} 
                        required 
                        className={`bg-background/50 ${calculateAge(formData.date_of_birth) < 18 && formData.date_of_birth ? "border-destructive ring-destructive focus-visible:ring-destructive" : ""}`} 
                      />
                      {calculateAge(formData.date_of_birth) < 18 && formData.date_of_birth && (
                        <p className="text-[10px] text-destructive font-bold animate-pulse italic">Minimum age requirement is 18 years.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Nature of Entity *</Label>
                      <Select 
                        name="nature_of_entity" 
                        value={formData.nature_of_entity} 
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, nature_of_entity: value }))}
                        required
                      >
                        <SelectTrigger className="w-full bg-background/50 border-primary/10">
                          <SelectValue placeholder="Select Nature" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="proprietorship">Proprietorship</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="llp">LLP</SelectItem>
                          <SelectItem value="body">Body Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Name of Entity</Label>
                    <Input name="name_of_entity" value={formData.name_of_entity} onChange={handleChange} placeholder="e.g. Acme Financial LLC" className="bg-background/50" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>BASL Membership ID *</Label>
                      <Input 
                        name="basl_membership_id" 
                        value={formData.basl_membership_id} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g. BASL-1234"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IA Reg Number *</Label>
                      <Input 
                        name="ia_registration_number" 
                        value={formData.ia_registration_number} 
                        onChange={handleChange} 
                        onBlur={validateIANumber}
                        required 
                        className={`bg-background/50 ${iaNumberExists ? "border-destructive ring-1 ring-destructive" : ""}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reg Date *</Label>
                      <Input type="date" name="date_of_registration" value={formData.date_of_registration} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date *</Label>
                      <Input type="date" name="date_of_registration_expiry" value={formData.date_of_registration_expiry} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Registered Address *</Label>
                    <Textarea name="registered_address" value={formData.registered_address} onChange={handleChange} required className="min-h-[100px] bg-background/50" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Contact Number *</Label>
                      <Input type="tel" name="registered_contact_number" value={formData.registered_contact_number} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Registered Email *</Label>
                      <Input type="email" name="registered_email_id" value={formData.registered_email_id} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>

                  {/* ── Change Rationale (Required for Updates) ── */}
                  {initialData && (
                    <div className="mt-8 p-6 rounded-xl border border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <ShieldCheck className="w-5 h-5" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Change Rationale (Required for Regulatory Compliance)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-amber-700 dark:text-amber-300">Reason Category *</Label>
                          <Select 
                            name="change_reason_type" 
                            value={formData.change_reason_type} 
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, change_reason_type: value }))}
                          >
                            <SelectTrigger className="w-full bg-background/50 border-amber-200/50">
                              <SelectValue placeholder="Select Reason Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data_correction">Data Correction</SelectItem>
                              <SelectItem value="client_update">Client Update</SelectItem>
                              <SelectItem value="assumption_change">Assumption Change / Review Adjustment</SelectItem>
                              <SelectItem value="regulatory_compliance">Regulatory Compliance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-amber-700 dark:text-amber-300">Detailed Explanation *</Label>
                          <Input 
                            name="change_reason_text" 
                            value={formData.change_reason_text} 
                            onChange={handleChange} 
                            placeholder="e.g. Updated IA logo and BASL ID"
                            className="bg-background/50 border-amber-200/50"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-600/70 italic">
                        This reason will be permanently stored in the Regulatory-Safe audit trail and version history.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bank" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Account Number *</Label>
                      <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name *</Label>
                      <Input name="bank_name" value={formData.bank_name} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Branch *</Label>
                      <Input name="bank_branch" value={formData.bank_branch} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code *</Label>
                      <Input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CIN Number (if applicable)</Label>
                    <Input name="cin_number" value={formData.cin_number} onChange={handleChange} className="bg-background/50" />
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="space-y-8 mt-0">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Please upload the required documents. Supported formats: PNG, JPG, PDF. Max size: 16MB. These documents will be stored securely in your private infrastructure.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <Label className="text-base text-nowrap">IA Registration Certificate *</Label>
                        {initialData?.ia_certificate_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              <span className="truncate max-w-[150px] sm:max-w-none">Already uploaded: {getFileName(initialData.ia_certificate_path)}</span>
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary flex-shrink-0" onClick={() => window.open(getAssetUrl(initialData.ia_certificate_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_certificate" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.pdf" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <Label className="text-base text-nowrap">IA Signature *</Label>
                        {initialData?.ia_signature_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              <span className="truncate max-w-[150px] sm:max-w-none">Already uploaded: {getFileName(initialData.ia_signature_path)}</span>
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary flex-shrink-0" onClick={() => window.open(getAssetUrl(initialData.ia_signature_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_signature" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                        <Label className="text-base text-nowrap">IA Logo *</Label>
                        {initialData?.ia_logo_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              <span className="truncate max-w-[150px] sm:max-w-none">Already uploaded: {getFileName(initialData.ia_logo_path)}</span>
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary flex-shrink-0" onClick={() => window.open(getAssetUrl(initialData.ia_logo_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_logo" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                  </div>
                </TabsContent>

              </div>

              <div className="p-4 sm:p-8 border-t border-primary/10 bg-muted/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading} className="px-6 w-full sm:w-auto">
                    Discard Changes
                  </Button>
                  {activeTab !== "basic" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const tabs = ["basic", "bank", "docs"];
                        const prevIndex = tabs.indexOf(activeTab) - 1;
                        setActiveTab(tabs[prevIndex]);
                      }}
                      className="border-primary/20 w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {activeTab !== "docs" ? (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={(e) => {
                        e.preventDefault();
                        const tabs = ["basic", "bank", "docs"];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        if (nextIndex < tabs.length) {
                           setActiveTab(tabs[nextIndex]);
                        }
                      }}
                      className="px-8 border-primary/30 w-full sm:w-auto py-6"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="gap-2 px-10 bg-primary hover:bg-primary/90 text-lg py-6 w-full sm:w-auto" 
                      disabled={loading || iaNumberExists}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                      {loading ? "Saving Records..." : "Save Master Entry"}
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
