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
  Plus,
  X
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TeamManagement() {
  const { user } = useAppStore();
  const router = useRouter();

  const slugify = (text: string) => 
    text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

  const getIdentifier = (member: TeamMember) => 
    `${slugify(member.full_name)}-${member.id}`;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [iaProfile, setIaProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Department Management State
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isAddingDeptModalOpen, setIsAddingDeptModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<{id: string, name: string} | null>(null);
  const [isRenamingDepartment, setIsRenamingDepartment] = useState(false);


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

  const fetchDepartments = async () => {
    try {
      const data = await IAMasterService.listDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const handleAddDepartment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newDepartmentName.trim()) return;
    setIsAddingDepartment(true);
    try {
      await IAMasterService.createDepartment(newDepartmentName);
      setNewDepartmentName("");
      toast.success("Department created");
      fetchDepartments();
      setIsAddingDeptModalOpen(false);
    } catch (error) {
      toast.error("Failed to create department");
    } finally {
      setIsAddingDepartment(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone if members are assigned.")) return;
    try {
      await IAMasterService.deleteDepartment(id);
      toast.success("Department removed");
      fetchDepartments();
    } catch (error) {
      toast.error("Failed to delete. Ensure no staff are in this department.");
    }
  };

  const handleRenameDepartment = async () => {
    if (!editingDepartment || !editingDepartment.name.trim()) return;
    setIsRenamingDepartment(true);
    try {
      await IAMasterService.updateDepartment(editingDepartment.id, editingDepartment.name);
      setEditingDepartment(null);
      toast.success("Department renamed");
      fetchDepartments();
    } catch (error) {
      toast.error("Failed to rename department");
    } finally {
      setIsRenamingDepartment(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchIaProfile();
    fetchDepartments();
  }, []);




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
        const updated = { ...p, [field]: !p[field] };
        if (field === 'can_read' && !updated.can_read) {
          updated.can_update = false;
          updated.can_delete = false;
        }
        return updated;
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
      if (role === 'research_analyst') {
        // Analysts start with generic Read access to everything? 
        // Or "No Access" is better as requested.
        return { ...p, can_read: false, can_create: false, can_update: false, can_delete: false };
      }
      return { ...p, can_read: false, can_create: false, can_update: false, can_delete: false };
    }));
  };

  const selectAll = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: true
    })));
  };

  const deselectAll = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      can_read: false,
      can_create: false,
      can_update: false,
      can_delete: false
    })));
  };

  // ── Stats Calculation ──────────────────────────────
  const activeMembers = members.filter(m => m.status === "active").length;
  const maxSeats = user?.max_client_permit || 5; 
  const usagePercentage = (activeMembers / maxSeats) * 100;

  return (
    <div className="space-y-6">
      {/* ── Header Area ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your partners, staff, and organizational structure.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Action buttons can still go here if needed, or inside tabs */}
        </div>
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
                    {members.filter(m => m.role === 'research_analyst').length} RA
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    {members.filter(m => m.role === 'investment_advisor').length} IA
                </Badge>
                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                    {members.filter(m => m.role === 'management').length} Mgmt
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
              Monthly billed. Renewal date: {user?.plan_expiry_date ? new Date(user.plan_expiry_date).toLocaleDateString() : "N/A"}
            </p>
            <Button variant="link" className="h-auto p-0 text-xs font-semibold text-primary/80" disabled>
                Upgrade Plan (Comming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-12 w-fit">
          <TabsTrigger value="directory" className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Staff Directory
          </TabsTrigger>
          <TabsTrigger value="departments" className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6 outline-none">
          {/* ── Team Table ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Directory</CardTitle>
                <CardDescription>
                  All personnel registered under "{user?.company_name}".
                </CardDescription>
              </div>
              <Button onClick={() => router.push("/team/onboard")} className="gap-2 bg-primary">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </CardHeader>
            <CardContent>
              {/* Existing Directory Table Content */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead>Role, ID & Designation</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                         <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                         </TableCell>
                      </TableRow>
                    ) : members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-4">
                            <Users className="h-12 w-12 opacity-10" />
                            <div className="space-y-1">
                              <p className="font-medium">No team members onboarded yet.</p>
                              <p className="text-xs">Start by adding your first partner or staff member.</p>
                            </div>
                            <Button variant="outline" onClick={() => router.push("/team/onboard")} className="gap-2 border-primary/20 hover:bg-primary/5">
                              <Plus className="h-4 w-4" /> Add Member
                            </Button>
                          </div>
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
                                <span className="text-[10px] font-mono font-bold text-primary">{member.staff_code || '---'}</span>
                                <span className="text-[10px] text-muted-foreground">{member.designation || 'Staff Member'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{member.department_name || '---'}</span>
                                <span className="text-[10px] text-muted-foreground capitalize">{member.employee_type || 'General'}</span>
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
                             <div className="flex justify-end items-center gap-2">
                               {member.role === 'owner' && (
                                 <Badge variant="outline" className="text-[10px]">Primary Admin</Badge>
                               )}
                               {member.status === 'active' && (
                                   <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="icon" className="h-8 w-8">
                                         <MoreHorizontal className="h-4 w-4" />
                                       </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="w-48">
                                       <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                       <DropdownMenuSeparator />
                                       <DropdownMenuItem onClick={() => router.push(`/team/${getIdentifier(member)}`)}>
                                         <Eye className="mr-2 h-4 w-4" />
                                         View Profile
                                       </DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => router.push(`/team/${getIdentifier(member)}/edit`)}>
                                         <Edit className="mr-2 h-4 w-4" />
                                         Update Details
                                       </DropdownMenuItem>
                                       {member.role !== 'owner' && (
                                         <>
                                           <DropdownMenuItem onClick={() => router.push(`/team/${getIdentifier(member)}/permissions`)}>
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
                                         </>
                                       )}
                                     </DropdownMenuContent>
                                   </DropdownMenu>
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
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  Manage organizational units and view staff distribution.
                </CardDescription>
              </div>
              <Dialog open={isAddingDeptModalOpen} onOpenChange={setIsAddingDeptModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    Add Departments
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handleAddDepartment}>
                    <DialogHeader>
                      <DialogTitle>Add New Department</DialogTitle>
                      <DialogDescription>
                        Create a new organizational unit to categorize your staff.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                      <div className="grid gap-2">
                        <Label htmlFor="dept_name">Department Name <span className="text-red-500">*</span></Label>
                        <Input 
                          id="dept_name"
                          placeholder="e.g. Operations, Compliance, etc." 
                          required
                          value={newDepartmentName}
                          onChange={(e) => setNewDepartmentName(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddingDeptModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAddingDepartment || !newDepartmentName.trim()} className="gap-2">
                        {isAddingDepartment && <Loader2 className="h-4 w-4 animate-spin" />}
                        Initialize Department
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department Name</TableHead>
                      <TableHead>Staff Count</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No departments defined.
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-semibold">{dept.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-bold">
                              {dept.employee_count || 0} Staff
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(dept.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => setEditingDepartment({id: dept.id, name: dept.name})}>
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteDepartment(dept.id)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
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
        </TabsContent>
      </Tabs>

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
             <Button variant="outline" size="sm" className="h-7 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" onClick={selectAll}>Select All</Button>
             <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={deselectAll}>Deselect All</Button>
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
                        disabled={!p.can_read}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input 
                        type="checkbox" 
                        checked={p.can_delete} 
                        onChange={() => togglePermission(p.module, 'can_delete')}
                        disabled={!p.can_read}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── Rename Department Dialog ── */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Department</DialogTitle>
            <DialogDescription>
              Update the name of this organizational unit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={editingDepartment?.name || ""}
              onChange={(e) => setEditingDepartment(prev => prev ? {...prev, name: e.target.value} : null)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameDepartment()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDepartment(null)}>Cancel</Button>
            <Button onClick={handleRenameDepartment} disabled={isRenamingDepartment || !editingDepartment?.name.trim()}>
              {isRenamingDepartment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
