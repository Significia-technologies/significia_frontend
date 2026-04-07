"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Upload, FileCheck, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IAMasterService } from "@/core/services/ia-master.service";
import { toast } from "sonner";

interface AddIAMasterModalProps {
  isOpen: boolean;
  
  onClose: () => void;
  onSuccess: () => void;
}

export function AddIAMasterModal({ isOpen, onClose, onSuccess }: AddIAMasterModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [iaNumberExists, setIaNumberExists] = useState(false);

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
    if (!formData.ia_registration_number) return;
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

      await IAMasterService.create(data);
      toast.success("Investment Advisor record created successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save IA record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-y-auto border-primary/20 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            IA Master Entry
          </DialogTitle>
          <DialogDescription>
            Register comprehensive Investment Advisor details and employee records.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-primary/10">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
              <TabsTrigger value="employees" disabled={formData.nature_of_entity === "individual"}>
                Employees
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name of Investment Advisor *</Label>
                  <Input name="name_of_ia" value={formData.name_of_ia} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Nature of Entity *</Label>
                  <select 
                    name="nature_of_entity" 
                    value={formData.nature_of_entity} 
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-primary/10 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Input name="name_of_entity" value={formData.name_of_entity} onChange={handleChange} placeholder="e.g. Acme Financial LLC" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>IA Reg Number *</Label>
                  <Input 
                    name="ia_registration_number" 
                    value={formData.ia_registration_number} 
                    onChange={handleChange} 
                    onBlur={validateIANumber}
                    required 
                    className={iaNumberExists ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reg Date *</Label>
                  <Input type="date" name="date_of_registration" value={formData.date_of_registration} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date *</Label>
                  <Input type="date" name="date_of_registration_expiry" value={formData.date_of_registration_expiry} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Registered Address *</Label>
                <Textarea name="registered_address" value={formData.registered_address} onChange={handleChange} required className="min-h-[80px]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Number *</Label>
                  <Input type="tel" name="registered_contact_number" value={formData.registered_contact_number} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Registered Email *</Label>
                  <Input type="email" name="registered_email_id" value={formData.registered_email_id} onChange={handleChange} required />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Account Number *</Label>
                  <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input name="bank_name" value={formData.bank_name} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Branch *</Label>
                  <Input name="bank_branch" value={formData.bank_branch} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code *</Label>
                  <Input name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CIN Number (if applicable)</Label>
                <Input name="cin_number" value={formData.cin_number} onChange={handleChange} />
              </div>
            </TabsContent>

            <TabsContent value="docs" className="space-y-6 pt-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Please upload the required documents. Supported formats: PNG, JPG, PDF. Max size: 16MB.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label>IA Registration Certificate *</Label>
                  <Input type="file" name="ia_certificate" onChange={handleFileChange} accept=".png,.jpg,.jpeg,.pdf" required />
                </div>
                <div className="space-y-2">
                  <Label>IA Signature *</Label>
                  <Input type="file" name="ia_signature" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required />
                </div>
                <div className="space-y-2">
                  <Label>IA Logo *</Label>
                  <Input type="file" name="ia_logo" onChange={handleFileChange} accept=".png,.jpg,.jpeg" required />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="space-y-4 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Employee List</h3>
                <Button type="button" variant="outline" size="sm" onClick={addEmployee} className="gap-2 border-primary/20">
                  <Plus className="w-4 h-4" />
                  Add Employee
                </Button>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-primary/10 rounded-xl">
                  <p className="text-muted-foreground">No employees added yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {employees.map((emp, index) => (
                    <div key={index} className="p-4 border border-primary/10 rounded-lg bg-primary/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">Employee #{index + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEmployee(index)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input value={emp.name_of_employee} onChange={(e) => handleEmployeeChange(index, "name_of_employee", e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Designation</Label>
                          <Input value={emp.designation} onChange={(e) => handleEmployeeChange(index, "designation", e.target.value)} required />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>IA Reg Number</Label>
                          <Input value={emp.ia_registration_number} onChange={(e) => handleEmployeeChange(index, "ia_registration_number", e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase">Reg Date</Label>
                            <Input type="date" value={emp.date_of_registration} onChange={(e) => handleEmployeeChange(index, "date_of_registration", e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase">Expiry Date</Label>
                            <Input type="date" value={emp.date_of_registration_expiry} onChange={(e) => handleEmployeeChange(index, "date_of_registration_expiry", e.target.value)} required />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Employee IA Certificate</Label>
                        <Input 
                          type="file" 
                          onChange={(e) => handleEmployeeChange(index, "certificate", e.target.files?.[0])} 
                          accept=".png,.jpg,.jpeg,.pdf" 
                          required 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-6 border-t border-primary/5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {activeTab !== "employees" && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const tabs = ["basic", "bank", "docs", "employees"];
                    const nextIndex = tabs.indexOf(activeTab) + 1;
                    if (formData.nature_of_entity === "individual" && tabs[nextIndex] === "employees") return;
                    setActiveTab(tabs[nextIndex]);
                  }}
                >
                  Next Step
                </Button>
              )}
              <Button type="submit" className="gap-2 px-8 bg-primary hover:bg-primary/90" disabled={loading || iaNumberExists}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                {loading ? "Saving Records..." : "Save Master Entry"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
