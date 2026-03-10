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
import { MasterDataService, Customer } from "@/core/services/master.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCustomerModal } from "./AddCustomerModal";

interface CustomerListProps {
  connectorId: string;
}

export function CustomerList({ connectorId }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [connectorId]);

  const fetchCustomers = async () => {
    try {
      const data = await MasterDataService.listCustomers(connectorId);
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers from your private database");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await MasterDataService.deleteCustomer(connectorId, id);
      toast.success("Customer removed from private storage");
      fetchCustomers();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers in private DB..." className="pl-10 bg-background/50 border-primary/20" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2 border-primary/20">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="font-semibold text-primary">Customer Name</TableHead>
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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Database className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No results found in your private database</p>
                      <p className="text-sm">Start by adding your first customer above.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {customer.email || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {customer.phone || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground italic">
                        <MapPin className="w-3 h-3 shrink-0" /> {customer.address || 'No address provided'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'} className="capitalize bg-primary/20 text-primary border-primary/20">
                        {customer.status}
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
                          onClick={() => handleDelete(customer.id)}
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
      
      {!loading && customers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <p>Showing {customers.length} customers from your private database.</p>
          <div className="flex items-center gap-1 p-1 rounded-md bg-green-500/10 border border-green-500/20 text-[10px] text-green-600 font-bold uppercase tracking-widest px-2">
            <CheckCircle2 className="w-3 h-3" />
            Live Remote Storage
          </div>
        </div>
      )}

      <AddCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        connectorId={connectorId}
      />
    </div>
  );
}
