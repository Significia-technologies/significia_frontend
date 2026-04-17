"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TeamService, TeamMember } from "@/core/services/team.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Calendar,
  Shield,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MemberEditForm() {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  // Extract UUID from the slug (name-uuid)
  // UUIDs are always 36 characters long at the end of the identifier
  const id = identifier?.slice(-36);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [iaProfile, setIaProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    role: "ia_staff",
    designation: "",
    staff_code: "",
    date_of_joining: "",
    date_of_leaving: "",
    employee_type: "non-advisory",
    department_id: "",
    ia_registration_number: "",
    date_of_registration: "",
    certificate_issue_date: "",
    date_of_registration_expiry: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [allMembers, profile, depts] = await Promise.all([
          TeamService.getTeamMembers(),
          IAMasterService.getLatest(),
          IAMasterService.listDepartments()
        ]);
        
        const found = allMembers.find(m => m.id === id);
        if (!found) {
          toast.error("Member not found");
          router.push("/team");
          return;
        }
        
        setMember(found);
        setIaProfile(profile);
        setDepartments(depts);
        
        setFormData({
          full_name: found.full_name,
          email: found.email,
          phone_number: found.phone_number || "",
          role: found.role,
          designation: found.designation || "",
          staff_code: found.staff_code || "",
          date_of_joining: found.date_of_joining || "",
          date_of_leaving: found.date_of_leaving || "",
          employee_type: (found.employee_type as any) || "non-advisory",
          department_id: found.department_id || "",
          ia_registration_number: found.ia_registration_number || "",
          date_of_registration: found.date_of_registration || "",
          certificate_issue_date: found.certificate_issue_date || "",
          date_of_registration_expiry: found.date_of_registration_expiry || "",
        });
      } catch (error) {
        toast.error("Failed to load member data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSaving(true);
      // We use Partial as defined in TeamService.updateTeamMember
      const updateData: any = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        role: formData.role,
        designation: formData.designation,
        staff_code: formData.staff_code,
        date_of_joining: formData.date_of_joining,
        date_of_leaving: formData.date_of_leaving || null,
        employee_type: formData.employee_type,
        department_id: formData.department_id || null,
      };

      if (showExtraFields) {
        updateData.ia_registration_number = formData.ia_registration_number;
        updateData.date_of_registration = formData.date_of_registration;
        updateData.certificate_issue_date = formData.certificate_issue_date;
        updateData.date_of_registration_expiry = formData.date_of_registration_expiry;
      }

      await TeamService.updateTeamMember(id as string, updateData);
      toast.success("Team member updated successfully");
      router.push(`/team/${identifier}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const isBodyCorporate = iaProfile?.nature_of_entity === 'body';
  const showExtraFields = isBodyCorporate || formData.role === "partner";

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Update Details</h1>
          <p className="text-muted-foreground">Modify information for {member?.full_name}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Member Profile</CardTitle>
              <CardDescription>Update name, role, and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address (Read Only)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    disabled
                    className="bg-muted pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+91 0000000000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input 
                    id="designation" 
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    placeholder="e.g. Senior Planner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select 
                      value={formData.role}
                      onValueChange={(val) => setFormData({...formData, role: val})}
                  >
                    <SelectTrigger id="role" className="bg-background/50">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {!isBodyCorporate && <SelectItem value="partner">Partner</SelectItem>}
                      <SelectItem value="ia_staff">Staff</SelectItem>
                      <SelectItem value="research_analyst">Research Analyst</SelectItem>
                      <SelectItem value="investment_advisor">Investment Advisor</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Employee Type</Label>
                  <Select 
                      value={formData.employee_type}
                      onValueChange={(val: any) => setFormData({...formData, employee_type: val})}
                  >
                    <SelectTrigger id="type" className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advisory">Advisory</SelectItem>
                      <SelectItem value="non-advisory">Non-Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff_code">Staff Code / ID</Label>
                  <Input 
                    id="staff_code" 
                    value={formData.staff_code}
                    onChange={(e) => setFormData({...formData, staff_code: e.target.value})}
                    placeholder="SIG-001"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                      value={formData.department_id}
                      onValueChange={(val) => setFormData({...formData, department_id: val})}
                  >
                    <SelectTrigger id="department" className="bg-background/50">
                      <SelectValue placeholder="Not Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                <div className="grid gap-2">
                  <Label>Date of Joining</Label>
                  <Input 
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({...formData, date_of_joining: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-destructive font-bold">Date of Leaving (if any)</Label>
                  <Input 
                    type="date"
                    className="border-destructive/30"
                    value={formData.date_of_leaving}
                    onChange={(e) => setFormData({...formData, date_of_leaving: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 bg-muted/50 rounded-b-lg flex justify-between">
              <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Member Changes
              </Button>
            </CardFooter>
          </Card>

          {showExtraFields && (
            <Card className="h-fit">
              <CardHeader>
                <div className="text-xs font-bold uppercase text-primary mb-1 flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Registration Details
                </div>
                <CardTitle className="text-lg">Compliance Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="reg_no">IA Registration Number</Label>
                    <Input 
                        id="reg_no" 
                        value={formData.ia_registration_number}
                        onChange={(e) => setFormData({...formData, ia_registration_number: e.target.value})}
                        required={showExtraFields}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="reg_date">Registration Date</Label>
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="reg_date" 
                            type="date"
                            className="pl-9"
                            value={formData.date_of_registration}
                            onChange={(e) => setFormData({...formData, date_of_registration: e.target.value})}
                            required={showExtraFields}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="exp_date">Expiry Date</Label>
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="exp_date" 
                            type="date"
                            className="pl-9"
                            value={formData.date_of_registration_expiry}
                            onChange={(e) => setFormData({...formData, date_of_registration_expiry: e.target.value})}
                            required={showExtraFields}
                        />
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
}
