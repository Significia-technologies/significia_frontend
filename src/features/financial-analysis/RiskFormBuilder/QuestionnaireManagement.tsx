"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  Edit3, 
  Printer, 
  Eye, 
  Power, 
  PowerOff,
  MoreVertical,
  Layers,
  CheckCircle2,
  Clock,
  Archive,
  Search,
  LayoutGrid,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskProfileService } from "@/core/services/risk-profile.service";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuestionnaireManagementProps {
  
  onEdit: (questionnaire: any) => void;
  onView: (questionnaire: any) => void;
  onAddNew: () => void;
  onBack: () => void;
}

export function QuestionnaireManagement({ onEdit, onView, onAddNew, onBack }: QuestionnaireManagementProps) {
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadQuestionnaires = async () => {
    setLoading(true);
    try {
      const data = await RiskProfileService.listQuestionnaires();
      // Prepend Sample Protocol (Hardcoded System Default)
      const sampleProtocol = {
        id: "sample-form",
        portfolio_name: "Strategic Risk Assessment (Sample)",
        status: "active",
        is_system: true,
        questions: Array(16).fill(0), // Dummy count for UI
        created_at: new Date().toISOString()
      };
      setQuestionnaires([sampleProtocol, ...data]);
    } catch (error) {
      toast.error("Failed to load questionnaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const handleStatusChange = async (qId: string, newStatus: string) => {
    try {
      await RiskProfileService.updateQuestionnaire(qId, { status: newStatus });
      toast.success(`Form status updated to ${newStatus}`);
      loadQuestionnaires();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePrint = async (qId: string, name: string) => {
    try {
      toast.info("Preparing printable version...");
      await RiskProfileService.downloadBlankPDF(qId, `Risk_Form_${name.replace(/\s+/g, '_')}.pdf`);
      toast.success("Printable form downloaded");
    } catch (error) {
      toast.error("Failed to generate printable form");
    }
  };

  const filtered = questionnaires.filter(q => 
    q.portfolio_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 gap-1.5 font-bold uppercase text-[8px] tracking-widest"><CheckCircle2 className="w-2.5 h-2.5" /> Active</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5 gap-1.5 font-bold uppercase text-[8px] tracking-widest"><Clock className="w-2.5 h-2.5" /> Draft</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20 bg-muted/5 gap-1.5 font-bold uppercase text-[8px] tracking-widest"><Archive className="w-2.5 h-2.5" /> Archived</Badge>;
      case 'system':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 gap-1.5 font-bold uppercase text-[8px] tracking-widest pl-2 pr-1.5"><Layers className="w-2.5 h-2.5" /> System</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Actions Bar (Consolidated Navigation) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 p-4 rounded-xl border border-primary/10 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-muted-foreground hover:text-primary">
             <ChevronLeft className="w-5 h-5" />
           </Button>
           <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest pl-1">System Protocol Registry</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Filter by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-64 bg-background/50 border-primary/10 rounded-lg text-[10px] font-bold tracking-tight focus-visible:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <Button onClick={onAddNew} className="h-9 px-4 gap-2 bg-primary/90 hover:bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-primary/10 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Protocol
          </Button>
        </div>
      </div>

      {/* Form Grid/List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-primary/10 rounded-3xl flex flex-col items-center justify-center gap-6 bg-primary/[0.01]">
          <div className="p-5 rounded-3xl bg-primary/5 text-primary/30 border border-primary/10">
            <Layers className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-black uppercase text-foreground/50 tracking-widest">No protocols defined</h4>
            <p className="text-[10px] font-bold uppercase text-muted-foreground/30 mt-2">Initialize your first strategic risk assessment form to begin.</p>
          </div>
          <Button onClick={onAddNew} variant="outline" className="h-9 px-6 border-primary/20 hover:bg-primary/5 text-[9px] font-black uppercase tracking-widest rounded-xl">
            Create First Form
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/10 bg-card/20 backdrop-blur-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
          <Table>
            <TableHeader className="bg-primary/[0.03]">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="w-[400px] h-12 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 pl-6">Strategic Protocol Management</TableHead>
                <TableHead className="h-12 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Status</TableHead>
                <TableHead className="h-12 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Scope</TableHead>
                <TableHead className="h-12 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Archival Date</TableHead>
                <TableHead className="h-12 text-right pr-6 text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Registry Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id} className="group border-primary/5 hover:bg-primary/[0.02] transition-colors">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-black uppercase tracking-tight text-white/90 group-hover:text-primary transition-colors">{q.portfolio_name}</p>
                        <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-tighter">{q.is_system ? 'Immutable Protocol' : `System ID: ${q.id.substring(0, 8)}`}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={q.is_system ? 'system' : q.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <LayoutGrid className="w-3 h-3 text-primary/40" />
                       <span className="text-[10px] font-black text-muted-foreground/80 uppercase">{q.questions?.length || 0} Dimensions</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Clock className="w-3 h-3 text-muted-foreground/30" />
                       <span className="text-[10px] font-bold text-white/60">{q.created_at ? format(new Date(q.created_at), 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => !q.is_system && onEdit(q)}
                        disabled={q.is_system}
                        className={`h-8 px-4 font-black uppercase text-[8px] tracking-widest transition-all shadow-sm ${
                          q.is_system 
                          ? 'border-white/5 bg-white/5 text-white/20 cursor-not-allowed' 
                          : 'border-primary/30 bg-primary/10 hover:bg-primary text-primary hover:text-white'
                        }`}
                      >
                        {q.is_system ? 'System Lock' : 'Configure'}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:bg-primary/20 hover:text-primary rounded-lg transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-primary/10 p-1.5 shadow-2xl rounded-xl">
                          {!q.is_system && (
                            <DropdownMenuItem onClick={() => onEdit(q)} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary">
                              <Edit3 className="w-4 h-4" /> Edit Definition
                            </DropdownMenuItem>
                          )}
                          {!q.is_system && (
                            <DropdownMenuItem onClick={() => onView(q)} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary">
                              <Eye className="w-4 h-4" /> Preview Form
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handlePrint(q.id, q.portfolio_name)} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg focus:bg-primary/10 focus:text-primary">
                            <Printer className="w-4 h-4" /> Print (Blank PDF)
                          </DropdownMenuItem>
                          {!q.is_system && (
                            <>
                              <DropdownMenuSeparator className="bg-primary/5" />
                              {q.status !== 'active' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'active')} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500">
                                  <Power className="w-4 h-4" /> Activate Form
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'draft')} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg text-amber-500 focus:bg-amber-500/10 focus:text-amber-500">
                                  <PowerOff className="w-4 h-4" /> Set as Draft
                                </DropdownMenuItem>
                              )}
                              {q.status !== 'archived' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(q.id, 'archived')} className="gap-2.5 text-xs font-bold uppercase tracking-tight py-2.5 rounded-lg text-destructive/60 focus:bg-destructive/10 focus:text-destructive">
                                  <Archive className="w-4 h-4" /> Archive Form
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
