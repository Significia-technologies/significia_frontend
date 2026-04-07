"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TeamService, TeamMember, ModulePermission, APP_MODULES } from "@/core/services/team.service";
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Shield,
  Info,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomCheckbox } from "@/components/ui/CustomCheckbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MemberPermissionsView() {
  const { identifier } = useParams() as { identifier: string };
  const router = useRouter();
  
  // Extract UUID from the slug (name-uuid)
  // UUIDs are always 36 characters long at the end of the identifier
  const id = identifier?.slice(-36);
  
  const [member, setMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const allMembers = await TeamService.getTeamMembers();
        const found = allMembers.find(m => m.id === id);
        
        if (!found) {
          toast.error("Member not found");
          router.push("/team");
          return;
        }
        
        setMember(found);
        
        const perms = await TeamService.getMemberPermissions(id);
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
        toast.error("Failed to load permissions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const togglePermission = (module: string, field: keyof Omit<ModulePermission, "module">) => {
    setPermissions(prev => prev.map(p => {
      if (p.module === module) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setIsSaving(true);
      await TeamService.updateMemberPermissions(id, permissions);
      toast.success("Permissions updated successfully");
      router.push(`/team/${identifier}`);
    } catch (error) {
      toast.error("Failed to save permissions");
    } finally {
      setIsSaving(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Manage Permissions</h1>
          <p className="text-muted-foreground">Configure access control for {member.full_name}.</p>
        </div>
      </div>

      <Alert variant="default" className="bg-primary/5 border-primary/20">
        <Shield className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Role-Based Access</AlertTitle>
        <AlertDescription>
          This user has the <strong className="capitalize">{member.role.replace('_', ' ')}</strong> role. 
          {member.role === 'analyst' && " Analysts can only see data for clients assigned to them."}
          {member.role === 'owner' && " Owners have full access to all modules automatically."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Module Permission Matrix</CardTitle>
          <CardDescription>Grant or revoke specific capabilities across each system module.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Module Name</TableHead>
                  <TableHead className="text-center">Read</TableHead>
                  <TableHead className="text-center">Create</TableHead>
                  <TableHead className="text-center">Update</TableHead>
                  <TableHead className="text-center">Delete (Soft)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p) => (
                  <TableRow key={p.module} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-sm">{p.module}</TableCell>
                    <TableCell className="text-center">
                      <CustomCheckbox 
                        checked={p.can_read} 
                        onCheckedChange={() => togglePermission(p.module, "can_read")} 
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CustomCheckbox 
                        checked={p.can_create} 
                        onCheckedChange={() => togglePermission(p.module, "can_create")} 
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CustomCheckbox 
                        checked={p.can_update} 
                        onCheckedChange={() => togglePermission(p.module, "can_update")} 
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CustomCheckbox 
                        checked={p.can_delete} 
                        onCheckedChange={() => togglePermission(p.module, "can_delete")} 
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 bg-muted/50 flex justify-between">
          <Button variant="ghost" type="button" onClick={() => router.back()}>Cancel Changes</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Permissions
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
