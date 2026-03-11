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

interface IAMasterFormProps {
  connectorId: string;
  initialData?: IAMaster | null;
}

export function IAMasterForm({ connectorId, initialData }: IAMasterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [iaNumberExists, setIaNumberExists] = useState(false);

  const getFileName = (path: string | undefined) => {
    if (!path) return "";
    const cleanPath = path.split('?')[0];
    return cleanPath.split('/').pop() || "";
  };

  const getFileUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://127.0.0.1:8000/${path}`;
  };

  const [formData, setFormData] = useState({
    name_of_ia: "",
    nature_of_entity: "",
    name_of_entity: "",
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

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name_of_ia: initialData.name_of_ia || "",
        nature_of_entity: initialData.nature_of_entity || "",
        name_of_entity: initialData.name_of_entity || "",
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
      });
      // Hydrate employees
      if (initialData.employees && initialData.employees.length > 0) {
        setEmployees(initialData.employees.map(emp => ({
          name_of_employee: emp.name_of_employee || "",
          designation: emp.designation || "",
          ia_registration_number: emp.ia_registration_number || "",
          date_of_registration: emp.date_of_registration || "",
          date_of_registration_expiry: emp.date_of_registration_expiry || "",
          certificate: null,
          certificate_path: emp.certificate_path,
        })));
      }
    }
  }, [initialData]);

  const isSinglePersonEntity = formData.nature_of_entity === "individual" || formData.nature_of_entity === "proprietorship";
  const personLabel = formData.nature_of_entity === "body" ? "Employee" : "Partner";
  const personLabelPlural = formData.nature_of_entity === "body" ? "Employees" : "Partners";

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
      const exists = await IAMasterService.validateIANumber(connectorId, formData.ia_registration_number);
      setIaNumberExists(exists);
      if (exists) {
        toast.error("IA Registration Number already exists!");
      }
    } catch (error) {
      console.error("Validation failed", error);
    }
  };

  const addEmployee = () => {
    setEmployees((prev) => [
      ...prev,
      {
        name_of_employee: "",
        designation: "",
        ia_registration_number: "",
        date_of_registration: "",
        date_of_registration_expiry: "",
        certificate: null,
      },
    ]);
  };

  const removeEmployee = (index: number) => {
    setEmployees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmployeeChange = (index: number, field: string, value: any) => {
    setEmployees((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (iaNumberExists) {
      toast.error("Please use a unique IA Registration Number");
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

      // Append employees as JSON string (excluding files)
      const employeesClean = employees.map(emp => {
        const { certificate, ...rest } = emp;
        return rest;
      });
      data.append("employees_json", JSON.stringify(employeesClean));

      // Append employee certificates
      employees.forEach((emp, index) => {
        if (emp.certificate) {
          data.append("employee_certificates", emp.certificate);
        }
      });

      await IAMasterService.create(connectorId, data);
      toast.success("Investment Advisor record saved successfully!");
      router.push("/dashboard/master");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save IA record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IA Master Entry</h1>
          <p className="text-muted-foreground text-sm">
            {initialData ? "Update" : "Register"} Investment Advisor details and employee records.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-4 bg-muted/30 border-b border-primary/10">
                <TabsList className="bg-transparent h-auto p-0 gap-8 flex justify-start border-none">
                  <TabsTrigger 
                    value="basic" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bank" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold"
                  >
                    Bank Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="docs" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold"
                  >
                    Documents
                  </TabsTrigger>
                  <TabsTrigger 
                    value="employees" 
                    disabled={isSinglePersonEntity}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-1 text-sm font-semibold"
                  >
                    {personLabelPlural}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Name of Investment Advisor *</Label>
                      <Input name="name_of_ia" value={formData.name_of_ia} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nature of Entity *</Label>
                      <select 
                        name="nature_of_entity" 
                        value={formData.nature_of_entity} 
                        onChange={handleChange}
                        required
                        className="flex h-10 w-full rounded-md border border-primary/10 bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Nature</option>
                        <option value="individual">Individual</option>
                        <option value="proprietorship">Proprietorship</option>
                        <option value="partnership">Partnership</option>
                        <option value="llp">LLP</option>
                        <option value="body">Body Corporate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Name of Entity</Label>
                    <Input name="name_of_entity" value={formData.name_of_entity} onChange={handleChange} placeholder="e.g. Acme Financial LLC" className="bg-background/50" />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
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

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Contact Number *</Label>
                      <Input type="tel" name="registered_contact_number" value={formData.registered_contact_number} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Registered Email *</Label>
                      <Input type="email" name="registered_email_id" value={formData.registered_email_id} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bank" className="space-y-6 mt-0">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Bank Account Number *</Label>
                      <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} required className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name *</Label>
                      <Input name="bank_name" value={formData.bank_name} onChange={handleChange} required className="bg-background/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
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
                      <div className="flex justify-between items-end">
                        <Label className="text-base">IA Registration Certificate *</Label>
                        {initialData?.ia_certificate_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Already uploaded: {getFileName(initialData.ia_certificate_path)}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => window.open(getFileUrl(initialData.ia_certificate_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_certificate" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.pdf" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <Label className="text-base">IA Signature *</Label>
                        {initialData?.ia_signature_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Already uploaded: {getFileName(initialData.ia_signature_path)}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => window.open(getFileUrl(initialData.ia_signature_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_signature" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <Label className="text-base">IA Logo *</Label>
                        {initialData?.ia_logo_path && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Already uploaded: {getFileName(initialData.ia_logo_path)}
                            </span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => window.open(getFileUrl(initialData.ia_logo_path), '_blank')}>
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Input type="file" name="ia_logo" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required={!initialData} className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="employees" className="space-y-6 mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Associated {personLabelPlural}</h3>
                      <p className="text-sm text-muted-foreground">List of certified investment advisory representatives.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addEmployee} className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10">
                      <Plus className="w-4 h-4" />
                      Add {personLabel}
                    </Button>
                  </div>

                  {employees.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-primary/10 rounded-2xl bg-muted/5">
                      <p className="text-muted-foreground">No {personLabelPlural.toLowerCase()} added yet.</p>
                      <Button type="button" variant="ghost" className="mt-4 text-primary" onClick={addEmployee}>
                        Add your first {personLabel.toLowerCase()} record
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {employees.map((emp, index) => (
                        <Card key={index} className="border-primary/10 bg-primary/5 overflow-hidden">
                          <CardHeader className="py-3 px-6 bg-primary/10 border-b border-primary/10 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">{personLabel} Record #{index + 1}</CardTitle>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEmployee(index)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={emp.name_of_employee} onChange={(e) => handleEmployeeChange(index, "name_of_employee", e.target.value)} required className="bg-background/50" />
                              </div>
                              <div className="space-y-2">
                                <Label>Designation</Label>
                                <Input value={emp.designation} onChange={(e) => handleEmployeeChange(index, "designation", e.target.value)} required className="bg-background/50" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label>IA Reg Number</Label>
                                <Input value={emp.ia_registration_number} onChange={(e) => handleEmployeeChange(index, "ia_registration_number", e.target.value)} required className="bg-background/50" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Reg Date</Label>
                                  <Input type="date" value={emp.date_of_registration} onChange={(e) => handleEmployeeChange(index, "date_of_registration", e.target.value)} required className="bg-background/50" />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Expiry Date</Label>
                                  <Input type="date" value={emp.date_of_registration_expiry} onChange={(e) => handleEmployeeChange(index, "date_of_registration_expiry", e.target.value)} required className="bg-background/50" />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-primary/5">
                              <div className="flex justify-between items-center mb-1">
                                <Label>{personLabel} IA Certificate</Label>
                                {emp.certificate_path && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                                      <FileCheck className="w-3 h-3" />
                                      Existing: {getFileName(emp.certificate_path)}
                                    </span>
                                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => window.open(getFileUrl(emp.certificate_path), '_blank')}>
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <Input 
                                type="file" 
                                onChange={(e) => handleEmployeeChange(index, "certificate", e.target.files?.[0])} 
                                accept=".png,.jpg,.jpeg,.pdf" 
                                required={!initialData}
                                className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>

              <div className="p-8 border-t border-primary/10 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading} className="px-6">
                    Discard Changes
                  </Button>
                  {activeTab !== "basic" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const tabs = ["basic", "bank", "docs", "employees"];
                        const prevIndex = tabs.indexOf(activeTab) - 1;
                        setActiveTab(tabs[prevIndex]);
                      }}
                      className="border-primary/20"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-4">
                  {activeTab !== "employees" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        const tabs = ["basic", "bank", "docs", "employees"];
                        const nextIndex = tabs.indexOf(activeTab) + 1;
                        if (isSinglePersonEntity && tabs[nextIndex] === "employees") {
                           // Skip employees if individual/proprietorship
                           handleSubmit(new Event('submit') as any);
                           return;
                        }
                        setActiveTab(tabs[nextIndex]);
                      }}
                      className="px-8 border-primary/30"
                    >
                      Next Step
                    </Button>
                  )}
                  {(activeTab === "employees" || (activeTab === "docs" && isSinglePersonEntity)) && (
                    <Button type="submit" className="gap-2 px-10 bg-primary hover:bg-primary/90 text-lg py-6" disabled={loading || iaNumberExists}>
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
