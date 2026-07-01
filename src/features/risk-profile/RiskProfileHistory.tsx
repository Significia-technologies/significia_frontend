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
  ChevronDown,
  Filter,
  ArrowUpDown,
  Send,
  Loader2,
  RefreshCcw,
  PlusCircle,
  Settings,
  MoreHorizontal,
  FolderInput,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
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
import { saveReportToDrawer } from "@/lib/save-to-drawer";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import { RectificationService } from "@/core/services/rectification.service";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface RiskProfileHistoryProps {
  onNewAssessment: () => void;
  onNewCustomAssessment: (id: string) => void;
  questionnaires: any[];
}

export function RiskProfileHistory({ onNewAssessment, onNewCustomAssessment, questionnaires }: RiskProfileHistoryProps) {
  const router = useRouter();
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    loadAssessments();
  }, []);

  const toggleRow = (clientKey: string) => {
    if (expandedClient === clientKey) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientKey);
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
        discussion_notes: a.discussion_notes,
        is_custom: true
      }));

      const all = [...standard, ...legacyCustom].sort((a, b) => 
        new Date(b.assessment_timestamp).getTime() - new Date(a.assessment_timestamp).getTime()
      );
      
      // Determine the latest assessment for each client dynamically (since it is sorted by newest first)
      const latestSeen = new Set<string>();
      const allWithLatest = all.map(item => {
        const clientKey = item.client_code || item.client_id;
        let isLatest = false;
        if (clientKey && !latestSeen.has(clientKey)) {
          latestSeen.add(clientKey);
          isLatest = true;
        }
        return {
          ...item,
          isLatest
        };
      });
      
      setAssessments(allWithLatest as any);
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

  const handleSaveToDrawer = async (item: any) => {
    setSaving(item.id);
    try {
      const dateLabel = format(new Date(item.assessment_timestamp), "dd MMM yyyy");
      await saveReportToDrawer({
        clientId: item.client_id,
        endpoint: item.is_custom
          ? API_ENDPOINTS.RISK_PROFILE.CUSTOM_PDF(item.id)
          : API_ENDPOINTS.RISK_PROFILE.PDF(item.id),
        fileName: `Risk_Profile_${item.client_code || item.id}_${dateLabel.replace(/ /g, "_")}.pdf`,
        documentType: `Risk Profile - ${item.assigned_risk_tier || "Assessment"} · ${dateLabel}`,
        category: "Risk Profile",
      });
      toast.success("Report saved to client drawer.");
    } catch {
      toast.error("Failed to save report to drawer.");
    } finally {
      setSaving(null);
    }
  };

  const filtered = assessments.filter(a => {
    const matchesSearch = 
      a.client_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_risk_tier?.toLowerCase().includes(search.toLowerCase());
      
    // Always show only the active (latest) assessment for each client on the main table
    return matchesSearch && (a as any).isLatest;
  });

  const getTierColor = (tier: string) => {
    const t = tier?.toLowerCase() || "";
    if (t.includes("aggressive")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t.includes("moderate")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (t.includes("conservative")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase truncate">Risk Profile Vault</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate">Historical Risk Assessments & Reporting</p>
        </div>
        <div className="flex flex-row items-center gap-2 w-full lg:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search Client..." 
              className="pl-10 h-10 bg-card/50 border-primary/10 font-medium w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {(user?.role === "owner" || user?.role === "partner") && (
            <Link href="/risk-profiles/manage" className="shrink-0">
              <Button variant="outline" className="h-10 gap-2 border-primary/20">
                <Settings className="w-4 h-4" />
                <span className="hidden xl:inline">Forms</span>
                <span className="xl:hidden">Forms</span>
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 gap-2 bg-primary hover:bg-primary/90 shrink-0">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden xl:inline">New Assessment</span>
                <span className="xl:hidden">New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-md border-primary/20">
              <DropdownMenuItem onClick={onNewAssessment} className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-3">
                System &quot;Sample&quot; Form
              </DropdownMenuItem>
              {questionnaires.length > 0 && <DropdownMenuSeparator className="bg-primary/10" />}
              {questionnaires.map((q) => (
                <DropdownMenuItem
                  key={q.id}
                  onClick={() => onNewCustomAssessment(q.id)}
                  className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-3"
                >
                  {q.portfolio_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
                filtered.map((a) => {
                  const clientKey = a.client_code || a.client_id;
                  const isExpanded = expandedClient === clientKey;
                  return (
                    <React.Fragment key={a.id}>
                      <TableRow className={`group hover:bg-primary/5 border-primary/5 transition-colors ${isExpanded ? "bg-primary/[0.02]" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => toggleRow(clientKey)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-bold text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                  onClick={() => toggleRow(clientKey)}
                                >
                                    {a.client_name || "Unknown Client"}
                                </span>
                                {(a as any).isLatest && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 text-[9px] uppercase font-black px-1.5 py-0 h-4 tracking-widest leading-none shrink-0">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] font-mono tracking-widest opacity-50 uppercase">
                                  {a.client_code || "N/A"}
                              </span>
                            </div>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 border border-primary/10 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-md border-primary/20">
                              <DropdownMenuItem 
                                onClick={() => downloadFile(a, 'PDF')}
                                disabled={!!downloading}
                                className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-2.5 flex items-center gap-2 hover:text-red-500 transition-colors"
                              >
                                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => downloadFile(a, 'DOCX')}
                                disabled={!!downloading}
                                className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-2.5 flex items-center gap-2 hover:text-blue-500 transition-colors"
                              >
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                <span>Download Word</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator className="bg-primary/10" />
                              
                              <DropdownMenuItem
                                onClick={() => handleEmail(a)}
                                disabled={!!emailing || !!downloading}
                                className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-2.5 flex items-center gap-2 hover:text-emerald-500 transition-colors"
                              >
                                {emailing === a.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                                ) : (
                                  <Send className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                <span>Email to Client</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-primary/10" />
                              <DropdownMenuItem
                                onClick={() => handleSaveToDrawer(a)}
                                disabled={!!saving}
                                className="cursor-pointer font-bold uppercase text-[10px] tracking-widest py-2.5 flex items-center gap-2 hover:text-teal-500 transition-colors"
                              >
                                {saving === a.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-teal-500 shrink-0" />
                                ) : (
                                  <FolderInput className="w-4 h-4 text-teal-500 shrink-0" />
                                )}
                                <span>Save to Drawer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="bg-primary/[0.01] hover:bg-transparent border-primary/5">
                          <TableCell colSpan={6} className="p-6 bg-card/5 backdrop-blur-md border-t border-b border-primary/5">
                            <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                              <div className="flex items-center justify-between border-b border-primary/5 pb-2 mb-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                  Assessment History Log — {a.client_name || "Client"} ({assessments.filter(item => (item.client_code && item.client_code === a.client_code) || (item.client_id && item.client_id === a.client_id)).length} Records)
                                </h4>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground">Click actions on any row to download past assessments</span>
                              </div>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {assessments
                                  .filter(item => (item.client_code && item.client_code === a.client_code) || (item.client_id && item.client_id === a.client_id))
                                  .map((historyItem, idx) => (
                                    <div 
                                      key={historyItem.id} 
                                      className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors ${
                                        historyItem.id === a.id 
                                          ? "bg-primary/10 border-primary/20 shadow-sm" 
                                          : "bg-card/20 border-primary/5 hover:bg-card/40"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] ${
                                          historyItem.id === a.id 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold">{format(new Date(historyItem.assessment_timestamp), "MMMM dd, yyyy • HH:mm")}</span>
                                            <span className="text-[10px] opacity-40">•</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{historyItem.form_name}</span>
                                            {historyItem.id === a.id && (
                                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] uppercase font-black px-1.5 py-0 h-4 leading-none tracking-widest shrink-0">
                                                Active
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className={`uppercase font-black text-[8px] px-1 py-0 h-3.5 tracking-tight ${getTierColor(historyItem.assigned_risk_tier)}`}>
                                              {historyItem.assigned_risk_tier}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-semibold">
                                              Score: <span className="text-primary font-black">{historyItem.calculated_score}</span>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Action buttons inside timeline */}
                                      <div className="flex items-center gap-1.5">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 px-2 gap-1 border border-primary/5 hover:bg-red-500/10 text-red-500 hover:border-red-500/20 rounded-md transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadFile(historyItem, 'PDF');
                                          }}
                                          disabled={!!downloading}
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span className="text-[9px] font-black uppercase tracking-tight">PDF</span>
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 px-2 gap-1 border border-primary/5 hover:bg-blue-500/10 text-blue-500 hover:border-blue-500/20 rounded-md transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadFile(historyItem, 'DOCX');
                                          }}
                                          disabled={!!downloading}
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          <span className="text-[9px] font-black uppercase tracking-tight">Word</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2 gap-1 border border-primary/5 hover:bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/20 rounded-md transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEmail(historyItem);
                                          }}
                                          disabled={!!emailing || !!downloading}
                                        >
                                          {emailing === historyItem.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Send className="w-3.5 h-3.5" />
                                          )}
                                          <span className="text-[9px] font-black uppercase tracking-tight">Email</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2 gap-1 border border-primary/5 hover:bg-teal-500/10 text-teal-500 hover:border-teal-500/20 rounded-md transition-all"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSaveToDrawer(historyItem);
                                          }}
                                          disabled={saving === historyItem.id}
                                        >
                                          {saving === historyItem.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <FolderInput className="w-3.5 h-3.5" />
                                          )}
                                          <span className="text-[9px] font-black uppercase tracking-tight">Drawer</span>
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
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
