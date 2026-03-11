"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin, Trash2, Edit, Database, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MasterDataService, Client } from "@/core/services/master.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface ClientListProps {
  connectorId: string;
}

export function ClientList({ connectorId }: ClientListProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, [connectorId]);

  const fetchClients = async () => {
    try {
      const data = await MasterDataService.listClients(connectorId);
      setClients(data);
    } catch (error) {
      toast.error("Failed to load clients from your private database");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await MasterDataService.deleteClient(connectorId, id);
      toast.success("Client removed from private storage");
      fetchClients();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients in private DB..." className="pl-10 bg-background/50 border-primary/20" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 border-primary/20">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push("/master/clients/new")}>
            <UserPlus className="w-4 h-4" />
            Add Client
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="font-semibold text-primary">Client Name</TableHead>
                <TableHead className="font-semibold text-primary">Contact Info</TableHead>
                <TableHead className="font-semibold text-primary">Address</TableHead>
                <TableHead className="font-semibold text-primary">Status</TableHead>
                <TableHead className="text-right font-semibold text-primary">Actions</TableHead>
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
                  <TableCell colSpan={5} className="h-64 text-center">
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
                    <TableCell className="font-medium">{client.client_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {client.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {client.phone_number || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground italic">
                        <MapPin className="w-3 h-3 shrink-0" /> {client.address || 'No address provided'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'} className="capitalize bg-primary/20 text-primary border-primary/20">
                        {client.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70 hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {!loading && clients.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <p>Showing {clients.length} clients from your private database.</p>
          <div className="flex items-center gap-1 p-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] text-green-600 font-bold uppercase tracking-widest px-2">
            <CheckCircle2 className="w-3 h-3" />
            Live Remote Storage
          </div>
        </div>
      )}
    </div>
  );
}
