"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TeamService, TeamMember, ModulePermission, APP_MODULES } from "@/core/services/team.service";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  User, 
  Briefcase,
  CheckCircle2,
  XCircle,
  Loader2,
  Building2,
  FileText,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { MasterDataService, Client } from "@/core/services/master.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomCheckbox } from "@/components/ui/CustomCheckbox";
import { Input } from "@/components/ui/input";

export default function MemberDetailsView() {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  // Extract UUID from the slug (name-uuid)
  // UUIDs are always 36 characters long at the end of the identifier
  const id = identifier?.slice(-36);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAppStore();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // We'll need a getMemberById in TeamService or find it in getTeam
        const allMembers = await TeamService.getTeamMembers();
        const found = allMembers.find(m => m.id === id);
        
        if (!found) {
          toast.error("Member not found");
          router.push("/team");
          return;
        }
        
        setMember(found);
        
        const perms = await TeamService.getMemberPermissions(id as string);
        const completePermissions = APP_MODULES.map(mod => {
          const existing = perms.find(p => p.module === mod);
          return existing || { 
            module: mod, 
            can_read: false, 
            can_create: false, 
            can_update: false, 
            can_delete: false 
          };
        });
        setPermissions(completePermissions);

        // Fetch clients if non-advisory
        if (found.employee_type === "non-advisory") {
          const clientRes = await MasterDataService.listClients({ limit: 1000 });
          setAllClients(clientRes.clients);
          const assigned = clientRes.clients.filter(c => c.assigned_employee_id === found.id);
          setAssignedClients(assigned);
          setSelectedClientIds(assigned.map(c => c.id));
        }
      } catch (error) {
        toast.error("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const isAdminRole = user?.role === "admin";
  const canManage = isIAOwner || isIAPartner || isSuperAdmin || isAdminRole;

  const handleSaveAssignments = async () => {
    if (!member) return;
    try {
      setIsSavingAssignments(true);

      const currentAssignedIds = assignedClients.map(c => c.id);
      
      const toAssign = selectedClientIds.filter(cid => !currentAssignedIds.includes(cid));
      const toUnassign = currentAssignedIds.filter(cid => !selectedClientIds.includes(cid));

      const promises = [
        ...toAssign.map(clientId => 
          MasterDataService.assignClient(clientId, member.id)
        ),
        ...toUnassign.map(clientId => 
          MasterDataService.assignClient(clientId, "")
        )
      ];

      await Promise.all(promises);

      const clientRes = await MasterDataService.listClients({ limit: 1000 });
      setAllClients(clientRes.clients);
      const assigned = clientRes.clients.filter(c => c.assigned_employee_id === member.id);
      setAssignedClients(assigned);
      setSelectedClientIds(assigned.map(c => c.id));

      toast.success("Client assignments updated successfully");
      setShowManageModal(false);
    } catch (error) {
      console.error("Failed to save assignments", error);
      toast.error("Failed to update client assignments");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Profile</h1>
          <p className="text-muted-foreground">Detailed overview of {member.full_name}'s roles and access.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Full Name</p>
                <p className="font-medium">{member.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-muted-foreground uppercase font-bold">Email Address</p>
                <p className="font-medium truncate">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Phone Number</p>
                <p className="font-medium">{member.phone_number || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Designation</p>
                <p className="font-medium">{member.designation || 'Staff Member'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Role</p>
                <Badge className="capitalize mt-0.5">{member.role.replace('_', ' ')}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Date of Joining</p>
                  <p className="font-medium text-sm">{member.date_of_joining ? new Date(member.date_of_joining).toLocaleDateString() : '---'}</p>
                </div>
                {member.date_of_leaving && (
                  <div>
                    <p className="text-xs text-destructive uppercase font-bold text-[10px]">Date of Leaving</p>
                    <p className="font-medium text-destructive text-sm font-bold">{new Date(member.date_of_leaving).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-full">
                  <Shield className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Staff Code</p>
                    <p className="font-mono font-bold text-indigo-600">{member.staff_code || '---'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Current Version</p>
                    <Badge variant="outline" className="text-[10px] font-mono font-black border-indigo-200 text-indigo-700 bg-indigo-50">
                      v{member.version_number || 1}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-full">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold text-[10px]">Department & Category</p>
                  <p className="font-medium text-sm">
                    {member.department_name || 'No Department'}
                    <span className="text-muted-foreground mx-2">|</span>
                    <span className="capitalize">{member.employee_type || 'General'}</span>
                  </p>
                </div>
              </div>
            </div>

            {member.ia_registration_number && (
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <Shield className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">IA Reg. Number</p>
                    <p className="font-medium">{member.ia_registration_number}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-full">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Reg. Date</p>
                      <p className="font-medium">{member.date_of_registration ? new Date(member.date_of_registration).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Expiry Date</p>
                      <p className="font-medium text-destructive/80 font-bold">{member.date_of_registration_expiry ? new Date(member.date_of_registration_expiry).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(member.certificate_path || member.signature_path) && (
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Compliance Documents</p>
                
                {member.certificate_path && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50/20 border-emerald-100 dark:border-emerald-950">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">Regulatory Certificate</p>
                        <p className="text-[10px] text-muted-foreground">Verified PDF copy</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(member.certificate_path, "_blank")}
                      className="text-xs h-7 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
                    >
                      View
                    </Button>
                  </div>
                )}

                {member.signature_path && (
                  <div className="flex flex-col p-3 border rounded-lg bg-primary/5 border-primary/10">
                    <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">Verified Signature Copy</p>
                    <div className="h-16 w-full flex items-center justify-center bg-white rounded-lg border border-primary/10 p-2 shadow-inner">
                      <img 
                        src={member.signature_path} 
                        alt={`${member.full_name}'s signature`} 
                        className="h-full object-contain max-w-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Access Permissions</CardTitle>
                  <CardDescription>Active permissions across all application modules.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/team/${identifier}/permissions`)}>
                  Edit Access
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[180px]">Module</TableHead>
                      <TableHead className="text-center text-[10px] uppercase font-black">Read</TableHead>
                      <TableHead className="text-center text-[10px] uppercase font-black">Create</TableHead>
                      <TableHead className="text-center text-[10px] uppercase font-black">Update</TableHead>
                      <TableHead className="text-center text-[10px] uppercase font-black">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((p) => (
                      <TableRow key={p.module}>
                        <TableCell className="font-medium text-sm">{p.module}</TableCell>
                        <TableCell className="text-center">
                          {p.can_read ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.can_create ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.can_update ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.can_delete ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {member.employee_type === "non-advisory" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Assigned Clients Mapping</CardTitle>
                    <CardDescription>Clients assigned to this non-advisory staff member.</CardDescription>
                  </div>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedClientIds(assignedClients.map(c => c.id));
                      setShowManageModal(true);
                    }}>
                      Manage Assignments
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {assignedClients.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                    No clients assigned to this staff member.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Client Code</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.client_name}</TableCell>
                            <TableCell className="font-mono text-xs uppercase">{client.client_code}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{client.email || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={client.is_active ? 'default' : 'secondary'} className={client.is_active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}>
                                {client.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Manage Assignments Dialog */}
      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-2xl bg-card border border-primary/20">
          <DialogHeader>
            <DialogTitle>Manage Assigned Clients</DialogTitle>
            <DialogDescription>
              Select the clients list to assign to {member.full_name}.
            </DialogDescription>
          </DialogHeader>

          {/* Search bar */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-primary/20"
            />
          </div>

          {/* Scrollable checklist */}
          <div className="max-h-[350px] overflow-y-auto border rounded-md p-1.5 space-y-1 bg-background/30">
            {allClients
              .filter(client => {
                const search = searchQuery.toLowerCase();
                return client.client_name.toLowerCase().includes(search) || 
                       client.client_code.toLowerCase().includes(search);
              })
              .map(client => {
                const isChecked = selectedClientIds.includes(client.id);
                const isAssignedToOther = client.assigned_employee_id && client.assigned_employee_id !== member.id;
                
                return (
                  <div key={client.id} className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                    <CustomCheckbox
                      id={`client-${client.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClientIds(prev => [...prev, client.id]);
                        } else {
                          setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                        }
                      }}
                    />
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <label 
                        htmlFor={`client-${client.id}`}
                        className="text-xs font-semibold leading-none cursor-pointer flex items-baseline gap-2 min-w-0"
                      >
                        <span className="font-medium text-sm text-foreground truncate">{client.client_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">({client.client_code})</span>
                      </label>
                      
                      {isAssignedToOther && (
                        <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded border border-orange-100 dark:border-orange-900/40 shrink-0 ml-2">
                          Assigned: {client.assigned_employee_name || "Another staff"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {allClients.filter(client => {
              const search = searchQuery.toLowerCase();
              return client.client_name.toLowerCase().includes(search) || 
                     client.client_code.toLowerCase().includes(search);
            }).length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No clients found.
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 flex flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => setShowManageModal(false)} disabled={isSavingAssignments}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} disabled={isSavingAssignments}>
              {isSavingAssignments ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
