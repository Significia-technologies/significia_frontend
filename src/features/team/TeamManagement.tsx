"use client";

import React, { useEffect, useState } from "react";
import { TeamService, TeamMember } from "@/core/services/team.service";
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
  Plus,
  Loader2
} from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeamManagement() {
  const { user } = useAppStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "ia_staff",
    designation: ""
  });

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

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await TeamService.onboardTeamMember(newMember);
      toast.success("Team member onboarded successfully");
      setIsAddingMember(false);
      setNewMember({
        full_name: "",
        email: "",
        phone_number: "",
        password: "",
        role: "ia_staff",
        designation: ""
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
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Onboard Team Member</DialogTitle>
                <DialogDescription>
                  Enter details for the new staff or partner. They will receive an email to login.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                    <p className="text-[10px] text-muted-foreground">At least 8 characters. User can change this later.</p>
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
                        <SelectItem value="partner">Partner</SelectItem>
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
                         {member.role !== 'owner' && member.status === 'active' && (
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-destructive hover:text-destructive hover:bg-destructive/10"
                               onClick={() => handleDeactivate(member.id)}
                             >
                               Deactivate
                             </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
