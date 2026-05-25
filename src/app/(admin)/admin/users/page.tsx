"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  ShieldCheck, 
  UserCog, 
  Trash2, 
  Ban, 
  CheckCircle2,
  Users,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AdminService, StaffUserOut } from "@/core/services/admin.service";
import { UserFormModal } from "@/features/admin/UserFormModal";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUserOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUserOut | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.listStaff();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to load staff accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (user: StaffUserOut) => {
    try {
      const newStatus = user.status === "active" ? "deactivated" : "active";
      await AdminService.updateStaff(user.id, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">Comprehensive list of Significia administrative personnel.</p>
        </div>
        <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="gap-2 shadow-lg shadow-primary/20 w-full md:w-auto">
          <UserPlus className="h-4 w-4" /> Add Team Member
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 bg-background focus:ring-1 focus:ring-primary/20" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[280px]">Staff Profile</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Contact Hub</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                    <p className="text-sm text-muted-foreground font-medium">Synchronizing with core backend...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-10 w-10 opacity-10" />
                    <p className="font-medium italic">Empty personnel records match your query.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-all border-b last:border-0 group">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                        {user.full_name || "Unassigned"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{user.designation || "No Designation"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="capitalize border-primary/10 px-2 py-0.5">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="h-3 w-3" />
                        <span className="font-medium underline-offset-2 hover:underline">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{user.phone_number || "No Phone"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === 'active' ? 'outline' : 'secondary'} 
                      className={user.status === 'active' ? 'text-emerald-500 border-emerald-500/20 capitalize font-bold text-[10px]' : 'capitalize font-bold text-[10px]'}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-primary/5">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px] shadow-xl border-primary/10">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Administrator Context</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsModalOpen(true); }} className="gap-2 cursor-pointer">
                          <UserCog className="h-4 w-4" /> Profile Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeactivate(user)} 
                          className={`gap-2 cursor-pointer ${user.status === 'active' ? 'text-destructive focus:bg-destructive/5' : 'text-emerald-600 focus:bg-emerald-50/5'}`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <Ban className="h-4 w-4" /> Revoke Access
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" /> Restore Account
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <UserFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
