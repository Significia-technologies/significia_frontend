"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Users, 
  ShieldCheck, 
  Calendar,
  CreditCard,
  ExternalLink,
  Edit,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IAMasterViewProps {
  connectorId: string;
}

export function IAMasterView({ connectorId }: IAMasterViewProps) {
  const router = useRouter();
  const [data, setData] = useState<IAMaster | null>(null);
  const [loading, setLoading] = useState(true);

  const getFileUrl = (path: string | undefined) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://127.0.0.1:8000/${path}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const latest = await IAMasterService.getLatest(connectorId);
      setData(latest);
    } catch (error) {
      console.error("Failed to fetch IA Master data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [connectorId]);

  const handleDownloadPdf = async () => {
    if (!data) return;
    try {
      toast.info("Generating your PDF report...");
      await IAMasterService.downloadPdf(connectorId, data.id);
      toast.success("PDF report downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-6">
            <ShieldCheck className="w-12 h-12 text-primary opacity-50" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No IA Record Found</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            You haven't registered your Investment Advisor details yet. 
            Once added, your compliance reports and signatures will be managed here.
          </p>
          <Button className="gap-2 px-8" onClick={() => router.push("/dashboard/master/ia-master/new")}>
            <Building2 className="w-5 h-5" />
            Register IA Master
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Summary Hero Card ────────────────────────── */}
      <Card className="relative overflow-hidden border-primary/10 bg-card/50 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 blur-xl" />
        <CardHeader className="relative flex flex-row items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {data.ia_logo_path ? (
                <img src={getFileUrl(data.ia_logo_path)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl font-bold tracking-tight">{data.name_of_ia}</CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px] px-2 py-0.5">
                  {data.nature_of_entity}
                </Badge>
              </div>
              <CardDescription className="text-lg mt-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-primary/60" />
                Reg No: <span className="font-mono text-primary font-medium">{data.ia_registration_number}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5" onClick={handleDownloadPdf}>
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push("/dashboard/master/ia-master/new")}>
              <Edit className="w-4 h-4" />
              Update
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8 pt-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact & Location</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/80 leading-relaxed">{data.registered_address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/80">{data.registered_contact_number}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/80">{data.registered_email_id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Registration Cycle
            </h4>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Registered on:</span>
              <span className="text-sm font-semibold">{data.date_of_registration}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-primary/10">
              <span className="text-sm text-muted-foreground">Expires on:</span>
              <span className="text-sm font-semibold text-amber-600">{data.date_of_registration_expiry}</span>
            </div>
          </div>

          <div className="space-y-3 border-l md:pl-8 border-primary/10">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Banking Details</h4>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase">Bank Name</span>
                <span className="text-sm font-medium">{data.bank_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-mono">{data.ifsc_code}</span>
                <span className="font-mono">{data.bank_account_number}</span>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-primary/10 flex gap-3">
              {data.ia_certificate_path && (
                <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5" onClick={() => window.open(getFileUrl(data.ia_certificate_path), '_blank')}>
                  <FileText className="w-3 h-3" />
                  Certificate
                </Button>
              )}
              {data.ia_signature_path && (
                <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5" onClick={() => window.open(getFileUrl(data.ia_signature_path), '_blank')}>
                  <Edit className="w-3 h-3" />
                  Signature
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Employees Table ──────────────────────────── */}
      {data.employees && data.employees.length > 0 && (
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-primary/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Associated Employees</CardTitle>
                  <CardDescription>Records of professionals linked to this IA registration.</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary">
                {data.employees.length} Members
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-bold">Employee Name</TableHead>
                  <TableHead className="font-bold">Designation</TableHead>
                  <TableHead className="font-bold">IA Reg No</TableHead>
                  <TableHead className="font-bold">Validity</TableHead>
                  <TableHead className="text-right font-bold">Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="font-semibold">{emp.name_of_employee}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {emp.designation}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{emp.ia_registration_number}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Until {emp.date_of_registration_expiry}
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.certificate_path && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => window.open(getFileUrl(emp.certificate_path), '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
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
