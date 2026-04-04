"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, MoreHorizontal, Mail, Phone, MapPin, Trash2, Pencil, Eye, Database, CheckCircle2, Download, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MasterDataService, Client } from "@/core/services/master.service";
import { TeamService, TeamMember } from "@/core/services/team.service";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClientDirectory() {
  const router = useRouter();
  const { user } = useAppStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [clientData, teamData] = await Promise.all([
          MasterDataService.listClients(),
          TeamService.getTeamMembers()
        ]);
        setClients(clientData);
        setTeam(teamData);
      } catch (error) {
        toast.error("Failed to load directory data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAssign = async (clientId: string, staffId: string) => {
    try {
      await MasterDataService.assignClient(clientId, staffId);
      toast.success("Client assigned successfully");
      
      // Update local state
      setClients(prev => prev.map(c => 
        c.id === clientId ? { ...c, assigned_employee_id: staffId } : c
      ));
    } catch (error) {
      toast.error("Assignment failed");
    }
  };

  const filteredClients = clients.filter(c => 
    c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.pan_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOwnerOrPartner = user?.role === "owner" || user?.role === "partner";

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Directory</h1>
          <p className="text-muted-foreground">
            {user?.role === 'owner' ? "Managing all clients in your organization's private silo." : "Viewing clients assigned to your workspace."}
          </p>
        </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients by name, email or PAN..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none gap-2"
            onClick={() => MasterDataService.downloadMasterReport()}
            disabled={clients.length === 0}
          >
            <Download className="w-4 h-4" />
            Master Report
          </Button>
          <Button className="flex-1 sm:flex-none gap-2" onClick={() => router.push("/master/clients/new")}>
            <UserPlus className="w-4 h-4" />
            Onboard Investor
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Client</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Relationship Manager</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Database className="w-12 h-12 opacity-10 mb-4" />
                      <p className="text-lg font-medium">No clients found</p>
                      <p className="text-sm">Check your search or add a new client.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const assignedManager = team.find(t => t.id === client.assigned_employee_id);
                  
                  return (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                         <div className="font-semibold">{client.client_name}</div>
                         <div className="text-[10px] text-muted-foreground font-mono">{client.client_code}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3" /> {client.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3" /> {client.phone_number || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           {assignedManager ? (
                               <Badge variant="secondary" className="gap-1 px-1.5 ">
                                   <UserCheck className="w-3 h-3 text-primary" />
                                   {assignedManager.full_name}
                               </Badge>
                           ) : (
                               <span className="text-xs text-muted-foreground italic">Unassigned</span>
                           )}
                           
                           {isOwnerOrPartner && (
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Pencil className="w-3 h-3" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="start" className="w-56">
                                   <DropdownMenuLabel>Assign Relationship Manager</DropdownMenuLabel>
                                   <DropdownMenuSeparator />
                                   {team.filter(t => t.status === 'active').map(staff => (
                                       <DropdownMenuItem 
                                         key={staff.id} 
                                         onClick={() => handleAssign(client.id, staff.id)}
                                         className="flex flex-col items-start gap-0.5"
                                       >
                                          <span>{staff.full_name}</span>
                                          <span className="text-[10px] text-muted-foreground capitalize">{staff.role.replace('_', ' ')}</span>
                                       </DropdownMenuItem>
                                   ))}
                                 </DropdownMenuContent>
                               </DropdownMenu>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={client.is_active ? 'default' : 'secondary'} className="h-5 text-[10px]">
                          {client.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/master/clients/${client.id}`)}>
                              <Eye className="w-4 h-4 mr-2" /> View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/master/clients/${client.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit Records
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      </Card>
      
      {!loading && clients.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <p>Significia Bridge is currently managing {clients.length} private investor records.</p>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SECURE COMPLIANT STORAGE
          </div>
        </div>
      )}
    </div>
  );
}
