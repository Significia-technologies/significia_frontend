"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Download,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Send,
  Loader2,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskProfileService, RiskAssessment } from "@/core/services/risk-profile.service";
import { RectificationService } from "@/core/services/rectification.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface RiskProfileHistoryProps {
  
}

export function RiskProfileHistory({  }: RiskProfileHistoryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleInitiateRectification = async (item: any) => {
    setInitiating(item.id);
    try {
      const draft = await RectificationService.initiate({
        client_id: item.client_id,
        module: "RISK",
        record_id: item.id,
        current_version: 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { financial: false, risk: true },
        confirmation_mode: "Data Correction",
        is_investor_requested: false,
        initiation_reason: "Internal rectification initiated from Risk Profile vault"
      });

      toast.success("Rectification Draft Created (E-Serial No Assigned)");
      router.push(`/rectification/${draft.id}`);
    } catch (error) {
      toast.error("Failed to initiate rectification protocol");
    } finally {
      setInitiating(null);
    }
  };

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const standard = await RiskProfileService.getAll();
      const custom = await RiskProfileService.listCustomAssessments();
      
      // Map custom assessments to match RiskAssessment interface for the table
      const legacyCustom = custom.map(a => ({
        id: a.id,
        client_id: a.client_id,
        client_name: a.client_name,
        client_code: a.client_code,
        calculated_score: a.total_score,
        assigned_risk_tier: a.category_name,
        form_name: a.portfolio_name,
        assessment_timestamp: a.submitted_at,
        created_at: a.submitted_at,
        is_custom: true
      }));

      const all = [...standard, ...legacyCustom].sort((a, b) => 
        new Date(b.assessment_timestamp).getTime() - new Date(a.assessment_timestamp).getTime()
      );
      
      setAssessments(all as any);
    } catch (error) {
      toast.error("Failed to load risk assessment history");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (item: any, type: 'PDF' | 'DOCX') => {
    setDownloading(`${item.id}-${type}`);
    try {
      if (item.is_custom) {
        if (type === 'PDF') {
          await RiskProfileService.downloadCustomPDF(item.id, `Risk_Profile_${item.client_code}.pdf`);
        } else {
          await RiskProfileService.downloadCustomDOCX(item.id, `Risk_Profile_${item.client_code}.docx`);
        }
      } else {
        if (type === 'PDF') {
          await RiskProfileService.downloadPDF(item.id, `Risk_Profile_${item.client_code}.pdf`);
        } else {
          await RiskProfileService.downloadDOCX(item.id, `Risk_Profile_${item.client_code}.docx`);
        }
      }
      toast.success(`${type} downloaded successfully`);
    } catch (error) {
      toast.error(`Failed to download ${type}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleEmail = async (item: any) => {
    setEmailing(item.id);
    try {
      await RiskProfileService.emailAssessment(item.id, !!item.is_custom);
      toast.success("Email sent to client successfully");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setEmailing(null);
    }
  };

  const filtered = assessments.filter(a => 
    a.client_code?.toLowerCase().includes(search.toLowerCase()) ||
    a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.assigned_risk_tier?.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    const t = tier?.toLowerCase() || "";
    if (t.includes("aggressive")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t.includes("moderate")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (t.includes("conservative")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase">Risk Profile Vault</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Historical Risk Assessments & Reporting</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
          <Input 
            placeholder="Search by Code or Name..." 
            className="pl-10 bg-card/50 border-primary/10 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-primary/10 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Client</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Risk Tier</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-center">Score</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Form</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-primary/5">
                    <TableCell colSpan={5} className="h-16 bg-muted/10" />
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium italic">
                    No risk assessments found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id} className="group hover:bg-primary/5 border-primary/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {a.client_name || "Unknown Client"}
                        </span>
                        <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                            {a.client_code || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`uppercase font-black text-[9px] tracking-tighter ${getTierColor(a.assigned_risk_tier)}`}>
                        {a.assigned_risk_tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black text-primary/80">
                      {a.calculated_score}
                    </TableCell>
                    <TableCell className="font-bold text-[10px] text-primary/70 uppercase tracking-tight">
                      {a.form_name}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {format(new Date(a.assessment_timestamp), "MMM dd, yyyy • HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all"
                          onClick={() => downloadFile(a, 'PDF')}
                          disabled={!!downloading}
                        >
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-[9px] font-black uppercase">PDF</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                          onClick={() => downloadFile(a, 'DOCX')}
                          disabled={!!downloading}
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[9px] font-black uppercase">Word</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 gap-1.5 border-primary/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                          onClick={() => handleEmail(a)}
                          disabled={!!emailing || !!downloading}
                        >
                          {emailing === a.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="text-[9px] font-black uppercase">Email</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 gap-1.5 border-amber-500/10 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                          onClick={() => handleInitiateRectification(a)}
                          disabled={!!initiating}
                        >
                          {initiating === a.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          ) : (
                            <RefreshCcw className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span className="text-[9px] font-black uppercase">Correct</span>
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

      <div className="flex justify-center pt-4">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-30">
          Showing {filtered.length} of {assessments.length} Secured Risk Records
        </p>
      </div>
    </div>
  );
}
