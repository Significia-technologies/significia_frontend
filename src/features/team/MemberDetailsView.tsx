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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MemberDetailsView() {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();

  // Extract UUID from the slug (name-uuid)
  // UUIDs are always 36 characters long at the end of the identifier
  const id = identifier?.slice(-36);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } catch (error) {
        toast.error("Failed to load details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Joined On</p>
                <p className="font-medium">{new Date(member.created_at).toLocaleDateString()}</p>
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
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
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
      </div>
    </div>
  );
}
