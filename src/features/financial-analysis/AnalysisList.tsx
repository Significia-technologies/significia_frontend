"use client";

import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileText,
  Eye,
  Download,
  TrendingUp,
  User,
  Calendar,
  ChevronRight,
  ChevronDown,
  Database,
  Mail,
  RefreshCcw,
  Loader2,
  FolderInput,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { FinancialAnalysisService, FinancialAnalysisResult } from "@/core/services/financial-analysis.service";
import { saveReportToDrawer } from "@/lib/save-to-drawer";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import { MasterDataService, Client } from "@/core/services/master.service";
import { RectificationService } from "@/core/services/rectification.service";
import { SEBIService } from "@/core/services/sebi.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface AnalysisListProps {
  clientId?: string;
  onSelectAnalysis: (resultId: string) => void;
  onCreateNew: () => void;
  onDownloadBlank?: () => void;
}

export function AnalysisList({ clientId, onSelectAnalysis, onCreateNew, onDownloadBlank }: AnalysisListProps) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<FinancialAnalysisResult[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const toggleRow = (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientId);
    }
  };

  const handleInitiateRectification = async (item: FinancialAnalysisResult) => {
    setInitiating(item.id);
    try {
      const draft = await RectificationService.initiate({
        client_id: item.client_id,
        module: "FINANCIAL",
        record_id: item.id,
        current_version: item.version_number || 1,
        proposed_changes: [],
        justification_details: { q1: "", q2: "", q3: "" },
        impact_declaration: { 
          financial: true, 
          risk: false,
          asset_allocation: false,
          portfolio: false,
          product_basket: false,
          target_portfolio: false,
          other: false
        },
        confirmation_mode: "Data Correction",
        is_investor_requested: false,
        initiation_reason: "Internal rectification initiated from Financial Goals vault"
      });

      toast.success("Rectification Draft Created (E-Serial No Assigned)");
      router.push(`/rectification/${draft.id}`);
    } catch (error) {
      toast.error("Failed to initiate rectification protocol");
    } finally {
      setInitiating(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analysisData, clientData] = await Promise.all([
          FinancialAnalysisService.list(),
          MasterDataService.listClients()
        ]);

        // Map clients for quick lookup
        const clientMap: Record<string, Client> = {};
        const clientsArray = Array.isArray(clientData) ? clientData : (clientData?.clients || []);
        clientsArray.forEach(c => {
          clientMap[c.id] = c;
        });
        setClients(clientMap);

        // Filter by clientId if provided
        let rawAnalyses = analysisData;
        if (clientId) {
          rawAnalyses = analysisData.filter(a => a.client_id === clientId);
        }

        // Sort analyses by date descending (newest first)
        const sorted = [...rawAnalyses].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Mark the latest run for each client
        const latestSeen = new Set<string>();
        const withLatest = sorted.map(item => {
          let isLatest = false;
          if (item.client_id && !latestSeen.has(item.client_id)) {
            latestSeen.add(item.client_id);
            isLatest = true;
          }
          return {
            ...item,
            isLatest
          };
        });

        setAnalyses(withLatest as any);
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load financial analyses");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleDownload = async (id: string, format: 'pdf' | 'word', clientName: string) => {
    setDownloading(`${id}-${format}`);
    try {
      if (format === 'pdf') {
        await FinancialAnalysisService.downloadPDF(id, clientName);
      } else {
        await FinancialAnalysisService.downloadWord(id, clientName);
      }
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setDownloading(null);
    }
  };

  const handleEmailReport = async (analysisId: string) => {
    try {
      setDelivering(analysisId);
      await SEBIService.emailAnalysisReport(analysisId);
      toast.success("Financial Analysis report has been sent to client via email.");
    } catch (err: any) {
      console.error("Email error:", err);
      toast.error(err.response?.data?.detail || "Failed to send email. Please check SMTP settings.");
    } finally {
      setDelivering(null);
    }
  };

  const handleSaveToDrawer = async (analysis: FinancialAnalysisResult, clientName: string) => {
    setSaving(analysis.id);
    try {
      await saveReportToDrawer({
        clientId: analysis.client_id,
        endpoint: API_ENDPOINTS.FINANCIAL_ANALYSIS.PDF(analysis.id),
        fileName: `Financial_Analysis_${clientName.replace(/\s+/g, "_")}.pdf`,
        documentType: `Financial Analysis v${(analysis as any).version_number || "1"}`,
        category: "Financial Goals",
      });
      toast.success("Report saved to client drawer.");
    } catch {
      toast.error("Failed to save report to drawer.");
    } finally {
      setSaving(null);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const client = clients[analysis.client_id];
    if (!client) return false;
    const matchesSearch = client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.client_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (analysis as any).isLatest;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase truncate">Financial Goals Vault</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 truncate">Analyze client portfolios and generate professional reports</p>
        </div>
        <div className="flex flex-row items-center gap-2 w-full lg:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search Client..." 
              className="pl-10 h-10 bg-card/50 border-primary/10 font-medium w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {onDownloadBlank && (
            <Button variant="outline" onClick={onDownloadBlank} className="h-10 gap-2 border-primary/20 shrink-0">
              <FileText className="w-4 h-4" />
              <span className="hidden xl:inline">Download Form</span>
              <span className="xl:hidden">Form</span>
            </Button>
          )}

          <Button className="h-10 gap-2 bg-primary hover:bg-primary/90 shrink-0" onClick={onCreateNew}>
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xl:inline">New Goals</span>
            <span className="xl:hidden">New</span>
          </Button>
        </div>
      </div>

      <Card className="border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-none">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Client</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Analysis Date</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Version</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Net Worth (Calc)</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">HLV Gap (Income)</TableHead>
                  <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAnalyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                          <TrendingUp className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">No financial analyses found</p>
                        <p className="text-sm">Start by creating a new analysis for your clients.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnalyses.map((analysis) => {
                    const client = clients[analysis.client_id];
                    const isExpanded = expandedClient === analysis.client_id;
                    return (
                      <React.Fragment key={analysis.id}>
                        <TableRow className={`hover:bg-primary/5 transition-colors group ${isExpanded ? "bg-primary/[0.02]" : ""}`}>
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-[180px]">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => toggleRow(analysis.client_id)}
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
                                    className="font-bold text-foreground cursor-pointer group-hover:text-primary transition-colors"
                                    onClick={() => toggleRow(analysis.client_id)}
                                  >
                                    {client?.client_name || "Unknown"}
                                  </span>
                                  {(analysis as any).isLatest && (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 text-[9px] uppercase font-black px-1.5 py-0 h-4 tracking-widest leading-none shrink-0">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{client?.client_code || "N/A"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(analysis.created_at), "dd MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                              v{analysis.version_number || 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm whitespace-nowrap">
                              ₹{new Intl.NumberFormat('en-IN').format(analysis.calculations?.net_worth || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 whitespace-nowrap">
                              ₹{new Intl.NumberFormat('en-IN').format(analysis.hlv_data?.additional_life_cover_needed_income || 0)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 gap-1.5 hover:bg-primary/10 text-primary"
                                onClick={() => onSelectAnalysis(analysis.id)}
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 border-primary/20">
                                  <DropdownMenuItem className="gap-2" onClick={() => handleDownload(analysis.id, 'pdf', client?.client_name || 'Client')}>
                                    {downloading === `${analysis.id}-pdf` ? (
                                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2" onClick={() => handleDownload(analysis.id, 'word', client?.client_name || 'Client')}>
                                    {downloading === `${analysis.id}-word` ? (
                                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                    Download Word
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 text-blue-600 focus:text-blue-600 focus:bg-blue-50"
                                    onClick={() => handleEmailReport(analysis.id)}
                                  >
                                    {delivering === analysis.id ? (
                                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Mail className="w-4 h-4" />
                                    )}
                                    Send via Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                                    onClick={() => handleSaveToDrawer(analysis, client?.client_name || "Client")}
                                    disabled={!!saving}
                                  >
                                    {saving === analysis.id ? (
                                      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <FolderInput className="w-4 h-4" />
                                    )}
                                    Save to Drawer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>                        {isExpanded && (
                          <TableRow className="bg-primary/[0.005] hover:bg-transparent border-primary/5">
                            <TableCell colSpan={6} className="p-6 bg-gradient-to-r from-primary/[0.01] via-card/10 to-transparent backdrop-blur-md border-t border-b border-primary/5">
                              <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                                <div className="flex items-center justify-between border-b border-primary/5 pb-2 mb-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                    Analysis History Log — {client?.client_name || "Client"} ({analyses.filter(item => item.client_id === analysis.client_id).length} Records)
                                  </h4>
                                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Click Actions on any row to view or download past analyses</span>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                                  {analyses
                                    .filter(item => item.client_id === analysis.client_id)
                                    .map((historyItem, idx) => {
                                      return (
                                        <div 
                                          key={historyItem.id} 
                                          className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border text-xs gap-4 transition-all duration-300 ${
                                            historyItem.id === analysis.id 
                                              ? "bg-primary/[0.08] border-primary/30 shadow-md shadow-primary/5" 
                                              : "bg-card/40 border-primary/5 hover:bg-card/80 hover:border-primary/20"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 ${
                                              historyItem.id === analysis.id 
                                                ? "bg-primary text-primary-foreground" 
                                                : "bg-muted/30 text-muted-foreground"
                                            }`}>
                                              {idx + 1}
                                            </div>
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-foreground/90">{format(new Date(historyItem.created_at), "MMMM dd, yyyy • HH:mm")}</span>
                                                <span className="text-[10px] opacity-40">•</span>
                                                <span className="text-[10px] font-mono font-bold text-primary/80 bg-primary/15 px-1.5 py-0.5 rounded border border-primary/20 leading-none">
                                                  v{historyItem.version_number || 1}
                                                </span>
                                                {historyItem.id === analysis.id && (
                                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[8px] uppercase font-black px-1.5 py-0 h-4 leading-none tracking-widest shrink-0">
                                                    Active
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                  Net Worth: <span className="font-mono font-black text-foreground bg-primary/5 px-1 rounded">₹{new Intl.NumberFormat('en-IN').format(historyItem.calculations?.net_worth || 0)}</span>
                                                </span>
                                                <span className="opacity-30">•</span>
                                                <span className="flex items-center gap-1">
                                                  HLV Gap: <span className="font-mono font-black text-orange-500 bg-orange-500/5 px-1 rounded border border-orange-500/10">₹{new Intl.NumberFormat('en-IN').format(historyItem.hlv_data?.additional_life_cover_needed_income || 0)}</span>
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Action buttons inside timeline */}
                                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                            {/* View Analysis */}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 px-2.5 gap-1.5 border border-primary/10 hover:bg-primary/10 text-primary rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
                                              onClick={() => onSelectAnalysis(historyItem.id)}
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              <span>View</span>
                                            </Button>

                                            {/* Download PDF */}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 px-2.5 gap-1.5 border border-red-500/10 hover:bg-red-500/10 text-red-500 hover:border-red-500/20 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(historyItem.id, 'pdf', client?.client_name || 'Client');
                                              }}
                                              disabled={downloading === `${historyItem.id}-pdf`}
                                            >
                                              {downloading === `${historyItem.id}-pdf` ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <FileText className="w-3.5 h-3.5" />
                                              )}
                                              <span>PDF</span>
                                            </Button>

                                            {/* Download Word */}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 px-2.5 gap-1.5 border border-blue-500/10 hover:bg-blue-500/10 text-blue-500 hover:border-blue-500/20 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(historyItem.id, 'word', client?.client_name || 'Client');
                                              }}
                                              disabled={downloading === `${historyItem.id}-word`}
                                            >
                                              {downloading === `${historyItem.id}-word` ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <FileText className="w-3.5 h-3.5" />
                                              )}
                                              <span>Word</span>
                                            </Button>

                                            {/* Email to Client */}
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-8 px-2.5 gap-1.5 border border-emerald-500/10 hover:bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/20 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEmailReport(historyItem.id);
                                              }}
                                              disabled={delivering === historyItem.id}
                                            >
                                              {delivering === historyItem.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                              ) : (
                                                <Mail className="w-3.5 h-3.5" />
                                              )}
                                              <span>Email</span>
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {!loading && analyses.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <p>Displaying {filteredAnalyses.length} analysis records in your private repository.</p>
          <div className="flex items-center gap-1 p-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-600 font-bold uppercase tracking-widest px-2">
            <Database className="w-3 h-3" />
            Vault Secured
          </div>
        </div>
      )}
    </div>
  );
}
