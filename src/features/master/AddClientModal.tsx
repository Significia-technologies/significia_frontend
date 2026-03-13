"use client";

import React, { useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
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
import { MasterDataService, ClientCreate } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { toast } from "sonner";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  connectorId: string;
}

export function AddClientModal({ isOpen, onClose, onSuccess, connectorId }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<Partial<ClientCreate>>({
    client_name: "",
    email: "",
    phone_number: "",
    address: "",
    assigned_employee_id: "",
    // Default fields for quick add
    password: "Password123!",
    client_code: "AUTO-" + Math.random().toString(36).substring(7).toUpperCase(),
    date_of_birth: "1990-01-01",
    pan_number: "",
    occupation: "Others",
    gender: "Male",
    marital_status: "Single",
    annual_income: 0,
    net_worth: 0,
    income_source: "Business",
    fatca_compliance: "Yes",
    aadhar_number: "",
    passport_number: "",
    bank_account_number: "00000000",
    bank_name: "TBD",
    bank_branch: "TBD",
    ifsc_code: "TBD",
    risk_profile: "Moderate",
    investment_experience: "0-2 Years",
    investment_objectives: "Wealth Creation",
    investment_horizon: "1-3 Years",
    liquidity_needs: "Low",
    advisor_name: "IA",
    declaration_signed: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          const iaMaster = await IAMasterService.getLatest(connectorId);
          if (iaMaster?.employees) {
            setEmployees(iaMaster.employees);
          }
        } catch (error) {
          console.error("Failed to fetch employees", error);
        }
      };
      fetchEmployees();
    }
  }, [isOpen, connectorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await MasterDataService.createClient(connectorId, formData as ClientCreate);
      toast.success("Client added to your private database!");
      onSuccess();
      onClose();
      // Reset form
      setFormData((prev) => ({
        ...prev,
        client_name: "",
        email: "",
        phone_number: "",
        address: "",
        assigned_employee_id: "",
        pan_number: "",
      }));
    } catch (error: any) {
      toast.error(error.message || "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Add New Client
          </DialogTitle>
          <DialogDescription>
            This information will be stored exclusively in your private database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              required
              className="bg-background/50 border-primary/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="bg-background/50 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan_number">PAN Number</Label>
              <Input
                id="pan_number"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                required
                className="bg-background/50 border-primary/10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="bg-background/50 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigned_employee_id">Assigned Professional *</Label>
              <select 
                id="assigned_employee_id"
                name="assigned_employee_id" 
                value={formData.assigned_employee_id} 
                onChange={handleChange} 
                required 
                className="flex h-10 w-full rounded-md border border-primary/10 bg-background/50 px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Select Professional</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name_of_employee}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Residential Status *</Label>
              <select 
                name="residential_status" 
                value={formData.residential_status} 
                onChange={handleChange} 
                required 
                className="flex h-10 w-full rounded-md border border-primary/10 bg-background/50 px-3 py-2 text-sm"
              >
                  <option value="Resident Individual">Resident Individual</option>
                  <option value="Non-Resident Indian">Non-Resident Indian</option>
                  <option value="Person of Indian Origin">Person of Indian Origin</option>
                  <option value="Foreign National">Foreign National</option>
              </select>
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
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Passport Number *</Label>
                <Input 
                  name="passport_number" 
                  value={formData.passport_number} 
                  onChange={handleChange} 
                  required 
                  placeholder="Passport number"
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Physical Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Financial St, Suite 456..."
              className="bg-background/50 border-primary/10 min-h-[100px]"
            />
          </div>
          <DialogFooter className="pt-4 mt-6 border-t border-primary/5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
