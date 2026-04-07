"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  ShieldAlert, 
  Building2, 
  UserPlus, 
  Settings, 
  Ban, 
  RefreshCcw 
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminService, ActivityLogOut } from "@/core/services/admin.service";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getLogs(100);
      setLogs(data);
    } catch (err) {
      toast.error("Failed to load activity logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "PROVISION_CLIENT": return <Building2 className="h-4 w-4 text-emerald-500" />;
      case "CREATE_STAFF": return <UserPlus className="h-4 w-4 text-blue-500" />;
      case "UPDATE_STAFF": return <Settings className="h-4 w-4 text-amber-500" />;
      case "DEACTIVATE_STAFF": return <Ban className="h-4 w-4 text-destructive" />;
      default: return <ShieldAlert className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const formatted = action.replace('_', ' ');
    return <Badge variant="outline" className="capitalize text-[10px] font-bold tracking-tight">{formatted}</Badge>;
  };

  const filteredLogs = logs.filter(log => 
    log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Audit logs</h1>
          <p className="text-muted-foreground mt-1">Real-time trail of all administrative actions performed across the master backend.</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={isLoading} className="gap-2 border-primary/20">
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 bg-background" 
            placeholder="Search by admin or action..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  Loading activity history...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No activity matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {log.admin_email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {getActionBadge(log.action)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="line-clamp-2">{log.details || "No details available."}</p>
                    {log.target_type && (
                      <span className="text-[10px] text-primary/60 font-semibold uppercase">{log.target_type}: {log.target_id?.slice(0, 8)}...</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">
                    {log.ip_address || "Internal"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
