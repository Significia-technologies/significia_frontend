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
  Database,
  Mail,
  RefreshCcw
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
  const [delivering, setDelivering] = useState<string | null>(null);
  const [initiating, setInitiating] = useState<string | null>(null);

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
        initiation_reason: "Internal rectification initiated from Financial Analysis vault"
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
        if (clientId) {
          setAnalyses(analysisData.filter(a => a.client_id === clientId));
        } else {
          setAnalyses(analysisData);
        }
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

  const filteredAnalyses = analyses.filter(analysis => {
    const client = clients[analysis.client_id];
    if (!client) return false;
    return client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.client_code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase truncate">Financial Analysis Vault</h2>
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
            <span className="hidden xl:inline">New Analysis</span>
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
                    return (
                      <TableRow key={analysis.id} className="hover:bg-primary/5 transition-colors group">
                        <TableCell>
                          <div className="flex flex-col min-w-[150px]">
                            <span className="font-bold text-foreground">{client?.client_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{client?.client_code || "N/A"}</span>
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
                                  className="gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50" 
                                  onClick={() => handleInitiateRectification(analysis)}
                                  disabled={!!initiating}
                                >
                                  {initiating === analysis.id ? (
                                    <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <RefreshCcw className="w-4 h-4" />
                                  )}
                                  Initiate Data Rectification
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
