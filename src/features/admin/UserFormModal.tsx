"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, User, Phone, Briefcase, MapPin, Mail, Lock } from "lucide-react";
import { AdminService, StaffUserOut } from "@/core/services/admin.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: StaffUserOut | null;
}

export function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    designation: "",
    address: "",
    role: "relationship_manager",
    status: "active"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: "",
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        designation: user.designation || "",
        address: user.address || "",
        role: user.role,
        status: user.status
      });
    } else {
      setFormData({
        email: "",
        password: "",
        full_name: "",
        phone_number: "",
        designation: "",
        address: "",
        role: "relationship_manager",
        status: "active"
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user) {
        await AdminService.updateStaff(user.id, formData);
        toast.success("Staff profile updated");
      } else {
        await AdminService.createStaff(formData);
        toast.success("Staff account & profile created");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user ? <User className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
            {user ? "Edit Staff Profile" : "Create New Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? "Update professional and personal details for this staff member." 
              : "Register a new team member with both login credentials and profile details."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Identity Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal Identity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="full_name">Full Legal Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="full_name" 
                    placeholder="John Doe" 
                    value={formData.full_name}
                    required
                    className="pl-9"
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    placeholder="+91 XXXXX XXXXX" 
                    value={formData.phone_number}
                    required
                    className="pl-9"
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="designation" 
                    placeholder="e.g. Senior RM" 
                    value={formData.designation}
                    className="pl-9"
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Physical Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea 
                  id="address" 
                  placeholder="Street, City, ZIP..." 
                  value={formData.address}
                  className="pl-9 min-h-[80px]"
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Credentials Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access & Credentials</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="official@significia.com" 
                    value={formData.email}
                    disabled={!!user}
                    required
                    className="pl-9 bg-accent/50"
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Min. 8 characters" 
                      value={formData.password}
                      required
                      className="pl-9"
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Portal Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="relationship_manager">RM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {user && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="deactivated">Deactivated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-6 rounded-b-lg border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[140px] gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (user ? "Save Profile" : "Establish Account")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
