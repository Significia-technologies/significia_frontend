"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin, Trash2, Pencil, Eye, Database, CheckCircle2, FileText, Download, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dropdown-menu";
import { MasterDataService, Client } from "@/core/services/master.service";
import { IAMasterService, Employee } from "@/core/services/ia-master.service";
import { RectificationService } from "@/core/services/rectification.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { PreRegistrationChecklist } from "./components/PreRegistrationChecklist";
import { useAppStore } from "@/store/useAppStore";

export function ClientList() {
  const router = useRouter();
  const { user } = useAppStore();
  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const canCreateClient = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Clients")?.can_create;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [initiating, setInitiating] = useState<string | null>(null);

  const handleInitiateRectification = async (client: Client) => {
    setInitiating(client.id);
    try {
      const draft = await RectificationService.initiate({
        client_id: client.id,
        module: "CLIENT",
        record_id: client.id,
        current_version: 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { 
          financial: false, 
          risk: false, 
          asset_allocation: false, 
          portfolio: false,
          product_basket: false,
          target_portfolio: false,
          other: false
        },
        confirmation_mode: "Client Update",
        is_investor_requested: false,
        initiation_reason: "Internal rectification initiated from Client List"
      });

      toast.success("Rectification Draft Created (E-Serial No Assigned)");
      router.push(`/rectification/${draft.id}`);
    } catch (error) {
      toast.error("Failed to initiate rectification protocol");
    } finally {
      setInitiating(null);
    }
  };

  const handleSendOnboardingEmail = async (clientId: string) => {
    try {
      await MasterDataService.sendOnboardingEmail(clientId);
      toast.success("Welcome email sent to client");
    } catch (error) {
      toast.error("Failed to send onboarding email");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [page, pageSize, debouncedSearch]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await MasterDataService.listClients({
        page,
        limit: pageSize,
        search: debouncedSearch
      });
      setClients(response.clients);
      setTotal(response.total);
    } catch (error) {
      toast.error("Failed to load clients from your private database");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await MasterDataService.deleteClient(id);
      toast.success("Client removed from private storage");
      fetchClients();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleDownloadMasterReport = async () => {
    try {
      setDownloading(true);
      await MasterDataService.downloadMasterReport();
      toast.success("Master report downloaded successfully");
    } catch (error) {
      toast.error("Failed to download master report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients in private DB..." 
            className="pl-10 bg-background/50 border-primary/20" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
          {/* <Button variant="outline" className="flex-1 sm:flex-none gap-2 border-primary/20 h-9 text-xs sm:text-sm">
            <Filter className="w-4 h-4" />
            Filters
          </Button> */}
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none gap-2 border-primary/20 text-primary hover:bg-primary/10 h-9 text-xs sm:text-sm"
            onClick={handleDownloadMasterReport}
            disabled={downloading || clients.length === 0}
          >
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">{downloading ? "Generating..." : "Master Report"}</span>
            <span className="xs:hidden">Report</span>
          </Button>
          {canCreateClient && (
            <Button className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90 h-9 text-xs sm:text-sm" onClick={() => setShowChecklist(true)}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden xs:inline">Add Client</span>
              <span className="xs:hidden">Add</span>
            </Button>
          )}

          <PreRegistrationChecklist 
            isOpen={showChecklist}
            onClose={() => setShowChecklist(false)}
            onProceed={() => {
              setShowChecklist(false);
              router.push("/clients/new");
            }}
          />
        </div>
      </div>

      <Card className="border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-none">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Client Name</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Contact Info</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Address</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Assigned To</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap text-center">Status</TableHead>
                  <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Database className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No results found in your private database</p>
                      <p className="text-sm">Start by adding your first client above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{client.client_name}</span>
                        <span className="text-[10px] text-primary/60 font-mono font-normal uppercase tracking-wider">{client.client_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone_number || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] min-w-[200px]">
                      <span 
                        className="flex items-center gap-1.5 text-sm text-muted-foreground italic"
                        title={client.address || 'No address provided'}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{client.address || 'No address provided'}</span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {client.assigned_employee_id ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                          {client.assigned_employee_name || "Staff Member"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge 
                        variant={client.is_active ? 'default' : 'secondary'} 
                        className={`capitalize px-2 py-0.5 text-[10px] ${
                          client.is_active 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}
                      >
                        {client.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 border-primary/20">
                          <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)} className="gap-2">
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem 
                            onClick={() => router.push(`/clients/${client.id}/edit`)} 
                            className="gap-2"
                            disabled={!client.is_active}
                          >
                            <Pencil className="w-4 h-4" /> Edit Records
                          </DropdownMenuItem> */}
                          <DropdownMenuItem 
                            onClick={() => handleSendOnboardingEmail(client.id)} 
                            className="gap-2"
                            disabled={!client.is_active}
                          >
                            <Mail className="w-4 h-4" /> Send Onboarding Email
                          </DropdownMenuItem>
                          {/* <DropdownMenuSeparator className="bg-primary/10" />
                          <DropdownMenuItem 
                            onClick={() => handleInitiateRectification(client)} 
                            className="gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            disabled={!!initiating}
                          >
                            {initiating === client.id ? (
                                <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <RefreshCcw className="w-4 h-4" />
                            )}
                            Data Rectification
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-primary/10" /> */}
                          {/* <DropdownMenuItem 
                            onClick={() => handleDelete(client.id)} 
                            variant="destructive"
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Client
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-4 border-t border-primary/10 bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Items per page</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(val) => {
                    setPageSize(parseInt(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] bg-background border-primary/20">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{Math.min((page - 1) * pageSize + 1, total)}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> entries
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2 border-primary/20"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1 font-medium text-xs">
                <span className="text-primary">{page}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{Math.ceil(total / pageSize) || 1}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2 border-primary/20"
                onClick={() => setPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
                disabled={page >= Math.ceil(total / pageSize) || loading}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!loading && total > 0 && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2 uppercase tracking-widest font-bold">
          <p>Significia Bridge is managing {total} private client records.</p>
          <div className="flex items-center gap-1 text-emerald-500">
            <Database className="w-3 h-3" />
            Vault Encrypted
          </div>
        </div>
      )}
    </div>
  );
}
