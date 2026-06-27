"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  User,
  Cpu,
  History,
} from "lucide-react";
import { EmailService, type EmailLog } from "@/core/services/email.service";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; label: string }> = {
    SENT: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" />, label: "Sent" },
    FAILED: { variant: "destructive", icon: <XCircle className="h-3 w-3" />, label: "Failed" },
    PENDING: { variant: "secondary", icon: <Clock className="h-3 w-3" />, label: "Pending" },
  };
  const c = config[status] || config.PENDING;
  return (
    <Badge variant={c.variant} className="gap-1 text-[10px]">
      {c.icon} {c.label}
    </Badge>
  );
}

export function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [exportingLogs, setExportingLogs] = useState(false);
  const [logFilters, setLogFilters] = useState({
    recipient_email: "",
    status: "ALL",
    start_date: "",
    end_date: "",
  });

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const filters: any = {};
      if (logFilters.recipient_email) filters.recipient_email = logFilters.recipient_email;
      if (logFilters.status !== "ALL") filters.status = logFilters.status;
      if (logFilters.start_date) filters.start_date = logFilters.start_date;
      if (logFilters.end_date) filters.end_date = logFilters.end_date;
      const data = await EmailService.getLogs(0, 100, filters);
      setLogs(data.items || []);
      setLogsTotal(data.total || 0);
    } catch { /* ignore */ }
    setLoadingLogs(false);
  }, [logFilters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleExportLogs = async () => {
    setExportingLogs(true);
    try {
      const filters: any = {};
      if (logFilters.recipient_email) filters.recipient_email = logFilters.recipient_email;
      if (logFilters.status !== "ALL") filters.status = logFilters.status;
      if (logFilters.start_date) filters.start_date = logFilters.start_date;
      if (logFilters.end_date) filters.end_date = logFilters.end_date;
      await EmailService.exportLogs(filters);
    } catch {
      alert("Failed to export logs.");
    }
    setExportingLogs(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Delivery History</h3>
          <p className="text-sm text-muted-foreground">
            Track every email sent from your account ({logsTotal} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            disabled={exportingLogs || logs.length === 0}
          >
            {exportingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Export Audit Log (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loadingLogs}>
            {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 border rounded-lg">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">Recipient Email</Label>
          <Input
            placeholder="Search email..."
            className="h-8 text-xs"
            value={logFilters.recipient_email}
            onChange={(e) => setLogFilters((f) => ({ ...f, recipient_email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">Status</Label>
          <Select value={logFilters.status} onValueChange={(v) => setLogFilters((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">Start Date (DD-MM-YYYY)</Label>
          <Input
            placeholder="DD-MM-YYYY"
            className="h-8 text-xs"
            value={logFilters.start_date}
            onChange={(e) => setLogFilters((f) => ({ ...f, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase text-muted-foreground">End Date (DD-MM-YYYY)</Label>
          <Input
            placeholder="DD-MM-YYYY"
            className="h-8 text-xs"
            value={logFilters.end_date}
            onChange={(e) => setLogFilters((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
      </div>

      {loadingLogs ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="font-medium text-muted-foreground">No Emails Sent Yet</h4>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Your email delivery history will appear here once you start sending.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Sender</TableHead>
                  <TableHead className="w-[180px]">Recipient</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead>Subject / Template</TableHead>
                  <TableHead className="w-[120px]">Attached</TableHead>
                  <TableHead className="w-[90px]">Version</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px]">Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.sender_name || "System"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]" title={log.user_id}>
                          {log.user_id ? `${log.user_id.slice(0, 8)}...` : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{log.recipient_name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{log.recipient_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.trigger_type === "MANUAL" ? (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 gap-1">
                          <User className="h-3 w-3" /> Manual
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 gap-1">
                          <Cpu className="h-3 w-3" /> System
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-sm line-clamp-1">{log.subject}</p>
                        {log.template_name && (
                          <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                            Template: {log.template_name}
                            {log.template_audit_id && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/20 text-primary bg-primary/5">
                                ID: {log.template_audit_id}
                              </Badge>
                            )}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.attachments_info && (() => {
                        try {
                          const files = JSON.parse(log.attachments_info);
                          if (Array.isArray(files) && files.length > 0) {
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-[10px] text-muted-foreground cursor-default flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> {files.length} file{files.length > 1 ? "s" : ""}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[200px]">
                                    <div className="space-y-1">
                                      {files.map((f: string, i: number) => (
                                        <p key={i} className="text-[10px] truncate">{f}</p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          }
                        } catch { /* ignore */ }
                        return null;
                      })()}
                    </TableCell>
                    <TableCell>
                      {log.report_version != null ? (
                        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 bg-blue-50 text-blue-700 border-blue-200">
                          v{log.report_version}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      {new Date(log.sent_at || log.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
