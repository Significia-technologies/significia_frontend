"use client";

import React, { useEffect, useState } from "react";
import { TeamService, TeamMember, APP_MODULES, ModulePermission } from "@/core/services/team.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import { useAppStore } from "@/store/useAppStore";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  MoreHorizontal,
  UserCheck,
  UserX,
  CreditCard,
  Calendar,
  Upload,
  Lock,
  Eye,
  Edit,
  Trash2,
  Settings,
  FileText,
  Loader2,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeamManagement() {
  const { user } = useAppStore();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [iaProfile, setIaProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "ia_staff",
    designation: "",
    ia_registration_number: "",
    date_of_registration: "",
    date_of_registration_expiry: "",
    certificate: null as File | null
  });

  // Permission Management State
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const data = await TeamService.getTeamMembers();
      setMembers(data);
    } catch (error) {
      toast.error("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIaProfile = async () => {
    try {
      const profile = await IAMasterService.getLatest();
      setIaProfile(profile);
    } catch (error) {
      console.error("Failed to fetch IA profile", error);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchIaProfile();
  }, []);

  // Update default role if it's body corporate
  useEffect(() => {
    if (iaProfile?.nature_of_entity === 'body' && newMember.role === 'partner') {
        setNewMember(prev => ({ ...prev, role: 'ia_staff' }));
    }
  }, [iaProfile]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("full_name", newMember.full_name);
      formData.append("email", newMember.email);
      formData.append("phone_number", newMember.phone_number);
      formData.append("password", newMember.password);
      formData.append("role", newMember.role);
      formData.append("designation", newMember.designation);
      
      if (showExtraFields) {
          formData.append("ia_registration_number", newMember.ia_registration_number);
          formData.append("date_of_registration", newMember.date_of_registration);
          formData.append("date_of_registration_expiry", newMember.date_of_registration_expiry);
          if (newMember.certificate) {
              formData.append("certificate", newMember.certificate);
          }
      }

      await TeamService.onboardTeamMember(formData);
      toast.success("Team member onboarded successfully");
      setIsAddingMember(false);
      setNewMember({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: iaProfile?.nature_of_entity === 'body' ? 'ia_staff' : "ia_staff", // Safe default
        designation: "",
        ia_registration_number: "",
        date_of_registration: "",
        date_of_registration_expiry: "",
        certificate: null
      });
      fetchTeam();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Onboarding failed");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this team member?")) return;
    try {
      await TeamService.removeTeamMember(id);
      toast.success("Member deactivated");
      fetchTeam();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleManagePermissions = async (member: TeamMember) => {
    setSelectedMember(member);
    setIsManagingPermissions(true);
    try {
      const data = await TeamService.getMemberPermissions(member.id);
      // Fill in missing modules with defaults
      const completePermissions = APP_MODULES.map(mod => {
        const existing = data.find(p => p.module === mod);
        return existing || { 
          module: mod, 
          can_read: false, 
          can_create: false, 
          can_update: false, 
          can_delete: false 
        };
      });
      setPermissions(completePermissions);
    } catch (error) {
      toast.error("Failed to load permissions");
    }
  };

  const togglePermission = (module: string, field: keyof Omit<ModulePermission, 'module'>) => {
    setPermissions(prev => prev.map(p => {
      if (p.module === module) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    setIsSavingPermissions(true);
    try {
      if (selectedMember.role === 'partner') {
          // Partners should logically have all access if we are using presets, 
          // but we'll save whatever is in the UI
      }
      await TeamService.updateMemberPermissions(selectedMember.id, permissions);
      toast.success("Permissions updated successfully");
      setIsManagingPermissions(false);
    } catch (error) {
      toast.error("Failed to save permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const applyPreset = (role: string) => {
    setPermissions(prev => prev.map(p => {
      if (role === 'partner') {
        return { ...p, can_read: true, can_create: true, can_update: true, can_delete: true };
      }
      if (role === 'analyst') {
        // Analysts start with generic Read access to everything? 
        // Or "No Access" is better as requested.
        return { ...p, can_read: false, can_create: false, can_update: false, can_delete: false };
      }
      return { ...p, can_read: false, can_create: false, can_update: false, can_delete: false };
    }));
  };

  // ── Stats Calculation ──────────────────────────────
  const activeMembers = members.filter(m => m.status === "active").length;
  const maxSeats = user?.max_client_permit || 5; 
  const usagePercentage = (activeMembers / maxSeats) * 100;

  // Determine if extra fields should be shown
  const isBodyCorporate = iaProfile?.nature_of_entity === 'body';
  const showExtraFields = isBodyCorporate || newMember.role === "partner";

  return (
    <div className="space-y-6">
      {/* ── Header Area ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your partners, staff, and analysts. These accounts count towards your license limit.
          </p>
        </div>
        
        <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Onboard Member
            </Button>
          </DialogTrigger>
          <DialogContent className={cn("sm:max-w-[425px]", showExtraFields && "sm:max-w-[600px]")}>
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Onboard Team Member</DialogTitle>
                <DialogDescription>
                  Enter details for the new staff{isBodyCorporate ? "" : " or partner"}. They will receive an email to login.
                </DialogDescription>
              </DialogHeader>
              
              <div className={cn("grid gap-4 py-4", showExtraFields && "grid-cols-2")}>
                <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        required
                        value={newMember.full_name}
                        onChange={(e) => setNewMember({...newMember, full_name: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        required
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                            id="phone" 
                            required
                            value={newMember.phone_number}
                            onChange={(e) => setNewMember({...newMember, phone_number: e.target.value})}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            required
                            value={newMember.password}
                            onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
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
                            <SelectItem value="analyst">Analyst</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="designation">Designation</Label>
                        <Input 
                            id="designation" 
                            placeholder="e.g. Senior Planner"
                            value={newMember.designation}
                            onChange={(e) => setNewMember({...newMember, designation: e.target.value})}
                        />
                      </div>
                    </div>
                </div>

                {showExtraFields && (
                    <div className="space-y-4 border-l pl-4 border-border">
                        <div className="text-xs font-bold uppercase text-primary mb-2 flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Registration Details
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="reg_no">IA Registration Number</Label>
                            <Input 
                                id="reg_no" 
                                placeholder="INA000000000"
                                required={showExtraFields}
                                value={newMember.ia_registration_number}
                                onChange={(e) => setNewMember({...newMember, ia_registration_number: e.target.value})}
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
                                    required={showExtraFields}
                                    value={newMember.date_of_registration}
                                    onChange={(e) => setNewMember({...newMember, date_of_registration: e.target.value})}
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
                                    required={showExtraFields}
                                    value={newMember.date_of_registration_expiry}
                                    onChange={(e) => setNewMember({...newMember, date_of_registration_expiry: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="certificate">Upload Certificate (PDF)</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    id="certificate" 
                                    type="file"
                                    accept="application/pdf"
                                    className="text-xs"
                                    required={showExtraFields}
                                    onChange={(e) => setNewMember({...newMember, certificate: e.target.files?.[0] || null})}
                                />
                                {newMember.certificate && <FileText className="h-4 w-4 text-primary" />}
                            </div>
                        </div>
                    </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Initialize Account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Status Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internal User Seats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers} / {maxSeats}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
               <div 
                 className={cn(
                   "h-full transition-all duration-500",
                   usagePercentage > 90 ? "bg-red-500" : usagePercentage > 70 ? "bg-amber-500" : "bg-primary"
                 )}
                 style={{ width: `${Math.min(usagePercentage, 100)}%` }}
               />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.max(0, maxSeats - activeMembers)} seats available in your current plan.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Distribution</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex gap-2 flex-wrap mt-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    {members.filter(m => m.role === 'partner').length} Partners
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {members.filter(m => m.role === 'ia_staff').length} Staff
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                    {members.filter(m => m.role === 'analyst').length} Analysts
                </Badge>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold uppercase tracking-wider text-primary">Standard</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly billed. Renewal date: {user?.plan_expiry_date ? new Date(user.plan_expiry_date).toLocaleDateString() : 'N/A'}
            </p>
            <Button variant="link" className="h-auto p-0 text-xs font-semibold text-primary/80" disabled>
                Upgrade Plan (Comming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Team Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Team Directory</CardTitle>
          <CardDescription>
            All personnel registered under "{user?.company_name}".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                     </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No team members onboarded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id} className={cn(member.status === 'inactive' && "opacity-60")}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground leading-none">{member.full_name}</span>
                          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                            <Badge className={cn(
                                "capitalize text-[10px] font-bold px-1.5 py-0",
                                member.role === 'owner' ? "bg-amber-500 hover:bg-amber-600" :
                                member.role === 'partner' ? "bg-blue-500 hover:bg-blue-600" :
                                "bg-slate-500 hover:bg-slate-600"
                            )}>
                                {member.role.replace('_', ' ')}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{member.designation || 'Staff Member'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === "active" ? "default" : "secondary"} className="h-5 text-[10px]">
                          {member.status === "active" ? (
                            <div className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> Active</div>
                          ) : (
                            <div className="flex items-center gap-1"><UserX className="h-3 w-3" /> Inactive</div>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end">
                           {member.role !== 'owner' && member.status === 'active' && (
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-8 w-8">
                                     <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" className="w-48">
                                   <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem onClick={() => router.push(`/team/${member.id}`)}>
                                     <Eye className="mr-2 h-4 w-4" />
                                     View Profile
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => router.push(`/team/${member.id}/edit`)}>
                                     <Edit className="mr-2 h-4 w-4" />
                                     Update Details
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleManagePermissions(member)}>
                                     <Lock className="mr-2 h-4 w-4" />
                                     Permissions
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem 
                                     variant="destructive"
                                     onClick={() => handleDeactivate(member.id)}
                                   >
                                     <Trash2 className="mr-2 h-4 w-4" />
                                     Deactivate
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                           )}
                           {member.role === 'owner' && (
                             <Badge variant="outline" className="text-[10px]">Primary Admin</Badge>
                           )}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Permissions Dialog ── */}
      <Dialog open={isManagingPermissions} onOpenChange={setIsManagingPermissions}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manage Permissions: {selectedMember?.full_name}
            </DialogTitle>
            <DialogDescription>
              Control access levels for each module. "Delete" refers to soft-deletion.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
             <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => applyPreset('partner')}>Full Access Preset</Button>
             <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => applyPreset('ia_staff')}>Reset (No Access)</Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Module</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Update</TableHead>
                  <TableHead className="text-center">Delete (Soft)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p) => (
                  <TableRow key={p.module}>
                    <TableCell className="font-medium text-sm">{p.module}</TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={p.can_read} 
                        onChange={() => togglePermission(p.module, 'can_read')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={p.can_create} 
                        onChange={() => togglePermission(p.module, 'can_create')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={p.can_update} 
                        onChange={() => togglePermission(p.module, 'can_update')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={p.can_delete} 
                        onChange={() => togglePermission(p.module, 'can_delete')}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsManagingPermissions(false)} disabled={isSavingPermissions}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={isSavingPermissions} className="gap-2">
              {isSavingPermissions && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
