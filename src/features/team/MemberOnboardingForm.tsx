"use client";

import React, { useEffect, useState } from "react";
import { TeamService } from "@/core/services/team.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import { useAppStore } from "@/store/useAppStore";
import { 
  UserPlus, 
  Shield, 
  Briefcase,
  Calendar,
  Lock,
  Plus,
  ArrowLeft,
  Loader2,
  FileText,
  Eye,
  EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

export default function MemberOnboardingForm() {
  const { user } = useAppStore();
  const router = useRouter();

  const [iaProfile, setIaProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newMember, setNewMember] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "ia_staff",
    designation: "",
    staff_code: "",
    date_of_joining: new Date().toISOString().split('T')[0],
    employee_type: "non-advisory",
    department_id: "",
    ia_registration_number: "",
    certificate_issue_date: "",
    date_of_registration_expiry: "",
    certificate: null as File | null,
    signature: null as File | null
  });

  const passwordCriteria = {
    length: newMember.password.length >= 8,
    upper: /[A-Z]/.test(newMember.password),
    lower: /[a-z]/.test(newMember.password),
    number: /[0-9]/.test(newMember.password),
    special: /[^A-Za-z0-9]/.test(newMember.password)
  };

  const getMissingPasswordRequirements = () => {
    const missing = [];
    if (!passwordCriteria.length) missing.push("8+ characters");
    if (!passwordCriteria.upper) missing.push("one Uppercase letter");
    if (!passwordCriteria.lower) missing.push("one Lowercase letter");
    if (!passwordCriteria.number) missing.push("one Number (0-9)");
    if (!passwordCriteria.special) missing.push("one Special character");
    return missing;
  };

  const missingReqs = getMissingPasswordRequirements();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [profile, depts] = await Promise.all([
          IAMasterService.getLatest(),
          IAMasterService.listDepartments()
        ]);
        setIaProfile(profile);
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to fetch onboarding prerequisites", error);
        toast.error("Failed to load necessary data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("full_name", newMember.full_name);
      formData.append("email", newMember.email);
      formData.append("phone_number", newMember.phone_number);
      formData.append("password", newMember.password);
      formData.append("role", newMember.role);
      formData.append("designation", newMember.designation);
      formData.append("staff_code", newMember.staff_code);
      formData.append("date_of_joining", newMember.date_of_joining);
      formData.append("employee_type", newMember.employee_type);
      
      if (newMember.department_id && newMember.department_id !== "none") {
        formData.append("department_id", newMember.department_id);
      }

      // Certification fields are now mandatory for everyone
      formData.append("ia_registration_number", newMember.ia_registration_number);
      formData.append("certificate_issue_date", newMember.certificate_issue_date);
      formData.append("date_of_registration_expiry", newMember.date_of_registration_expiry);
      if (newMember.certificate) {
          formData.append("certificate", newMember.certificate);
      }
      if (newMember.signature) {
          formData.append("signature", newMember.signature);
      }

      await TeamService.onboardTeamMember(formData);
      toast.success("Team member onboarded successfully");
      router.push("/team");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Onboarding failed. Please check all fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBodyCorporate = iaProfile?.nature_of_entity === 'body';

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
          <h1 className="text-3xl font-bold tracking-tight">Onboard Employee</h1>
          <p className="text-muted-foreground">Register new Partner, Staff, or Analyst personnel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Card: Profile Details */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Employee Profile
              </CardTitle>
              <CardDescription>Core identity and employment information.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="Enter full name" 
                    required
                    value={newMember.full_name}
                    onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@example.com" 
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className={newMember.phone_number && !/^[6-9][0-9]{9}$/.test(newMember.phone_number) ? "text-orange-500 font-medium" : ""}>
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={newMember.phone_number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewMember({...newMember, phone_number: val});
                    }}
                    className={newMember.phone_number && !/^[6-9][0-9]{9}$/.test(newMember.phone_number) ? "border-orange-500 focus-visible:ring-orange-500" : ""}
                  />
                  {newMember.phone_number && !/^[6-9][0-9]{9}$/.test(newMember.phone_number) && (
                    <p className="text-[10px] text-orange-500">Invalid 10-digit mobile number.</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className={passwordBlurred && missingReqs.length > 0 ? "text-red-500 font-medium" : ""}>
                    Temporary Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="Assign a temporary password"
                      value={newMember.password}
                      onBlur={() => setPasswordBlurred(true)}
                      onFocus={() => setPasswordBlurred(false)}
                      onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                      className={`pr-10 ${passwordBlurred && missingReqs.length > 0 ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordBlurred && missingReqs.length > 0 && (
                    <p className="text-[10px] text-red-500 font-medium">
                      Missing: {missingReqs.join(", ")}.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">System Role <span className="text-red-500">*</span></Label>
                  <Select 
                      value={newMember.role}
                      onValueChange={(val) => setNewMember({...newMember, role: val})}
                  >
                    <SelectTrigger id="role">
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
                  <Label htmlFor="type">Employee Type <span className="text-red-500">*</span></Label>
                  <Select 
                      value={newMember.employee_type}
                      onValueChange={(val: any) => setNewMember({...newMember, employee_type: val})}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advisory">Advisory</SelectItem>
                      <SelectItem value="non-advisory">Non-Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="staff_code">Staff Code / ID <span className="text-red-500">*</span></Label>
                  <Input 
                    id="staff_code" 
                    placeholder="e.g. SIG-001" 
                    required
                    value={newMember.staff_code}
                    onChange={(e) => setNewMember({...newMember, staff_code: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={newMember.department_id || "none"}
                    onValueChange={(val) => setNewMember({...newMember, department_id: val})}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Not Assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not Assigned</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                <div className="grid gap-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input 
                      id="designation" 
                      placeholder="e.g. Senior Planner"
                      value={newMember.designation}
                      onChange={(e) => setNewMember({...newMember, designation: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date of Joining <span className="text-red-500">*</span></Label>
                  <DatePicker 
                    date={newMember.date_of_joining}
                    onChange={(val) => setNewMember({...newMember, date_of_joining: val})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 bg-muted/20 rounded-b-lg flex justify-between">
              <Button variant="ghost" type="button" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2 px-8">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Complete Onboarding
              </Button>
            </CardFooter>
          </Card>

          {/* Sidebar Card: Certification (Always Visible & Mandatory) */}
          <Card className="h-fit shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5">
              <div className="text-[10px] font-bold uppercase text-primary mb-1 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Mandatory Compliance
              </div>
              <CardTitle className="text-lg">Professional Certification</CardTitle>
              <CardDescription>Verification details for regulatory compliance.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                  <Label htmlFor="reg_no">Certificate No. <span className="text-red-500">*</span></Label>
                  <Input 
                      id="reg_no" 
                      placeholder="e.g. INA0000000"
                      required
                      value={newMember.ia_registration_number}
                      onChange={(e) => setNewMember({...newMember, ia_registration_number: e.target.value})}
                  />
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="issue_date">Certificate Issue Date <span className="text-red-500">*</span></Label>
                  <DatePicker 
                      date={newMember.certificate_issue_date}
                      onChange={(val) => setNewMember({...newMember, certificate_issue_date: val})}
                      placeholder="Select issue date"
                  />
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="exp_date">Registration Expiry Date <span className="text-red-500">*</span></Label>
                  <DatePicker 
                      date={newMember.date_of_registration_expiry}
                      onChange={(val) => setNewMember({...newMember, date_of_registration_expiry: val})}
                      placeholder="Select expiry date"
                  />
              </div>

              <div className="grid gap-2 pt-2">
                  <Label htmlFor="certificate">Upload Certificate (PDF) <span className="text-red-500">*</span></Label>
                  <div className="flex flex-col gap-2 p-3 border-2 border-dashed rounded-md bg-background/50 transition-colors hover:border-primary/30 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate font-medium">
                            {newMember.certificate ? newMember.certificate.name : "Select regulatory PDF document"}
                        </span>
                    </div>
                    <Input 
                        id="certificate" 
                        type="file"
                        accept="application/pdf"
                        className="text-[10px] h-8 p-1 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        required
                        onChange={(e) => setNewMember({...newMember, certificate: e.target.files?.[0] || null})}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-1">
                      Professional certification is mandatory for all roles.
                  </p>
              </div>

              <div className="grid gap-2 pt-2">
                  <Label htmlFor="signature" className={newMember.employee_type === "advisory" && !newMember.signature ? "text-orange-500 font-medium" : ""}>
                      Upload Signature (PNG/JPG) {newMember.employee_type === "advisory" && <span className="text-red-500">*</span>}
                  </Label>
                  <div className={`flex flex-col gap-2 p-3 border-2 border-dashed rounded-md bg-background/50 transition-colors hover:border-primary/30 overflow-hidden ${newMember.employee_type === "advisory" && !newMember.signature ? "border-orange-500" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate font-medium">
                            {newMember.signature ? newMember.signature.name : "Select signature image"}
                        </span>
                    </div>
                    <Input 
                        id="signature" 
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="text-[10px] h-8 p-1 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        required={newMember.employee_type === "advisory"}
                        onChange={(e) => setNewMember({...newMember, signature: e.target.files?.[0] || null})}
                    />
                  </div>
                  {newMember.employee_type === "advisory" && !newMember.signature ? (
                      <p className="text-[10px] text-orange-500 font-medium mt-1 animate-in fade-in duration-300">
                          Signature copy is required for advisory personnel.
                      </p>
                  ) : (
                      <p className="text-[10px] text-muted-foreground italic mt-1">
                          Upload a clear PNG/JPG copy of signature.
                      </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
