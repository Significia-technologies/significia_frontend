"use client";

import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  FileText, 
  Eye, 
  Download, 
  Lock, 
  Unlock,
  Calendar,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  History,
  CheckCircle2,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InvestmentAdviceService, InvestmentAdviceNote } from "@/core/services/investment-advice.service";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdviceNoteListProps {
  clientId: string;
  clientName: string;
  onSelectNote: (noteId: string) => void;
  onCreateNew: () => void;
}

export function AdviceNoteList({ clientId, clientName, onSelectNote, onCreateNew }: AdviceNoteListProps) {
  const [notes, setNotes] = useState<InvestmentAdviceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lockingNote, setLockingNote] = useState<InvestmentAdviceNote | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await InvestmentAdviceService.list(clientId);
      // Sort by date descending
      const sorted = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotes(sorted);
    } catch (error) {
      console.error("Failed to fetch advice notes", error);
      toast.error("Failed to load investment advice notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [clientId]);

  const handleDownload = async (noteId: string, adviceNoteNo: string, formatType: 'pdf') => {
    setDownloading(`${noteId}-${formatType}`);
    try {
      await InvestmentAdviceService.downloadPDF(noteId, adviceNoteNo);
      toast.success(`${formatType.toUpperCase()} generated successfully.`);
    } catch (error) {
      console.error("Failed to export note", error);
      toast.error(`Failed to download ${formatType.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleLockConfirm = async () => {
    if (!lockingNote) return;
    setIsLocking(true);
    try {
      await InvestmentAdviceService.lock(lockingNote.id);
      toast.success("Advice Note successfully locked and registered for SEBI compliance.");
      setLockingNote(null);
      fetchNotes();
    } catch (error) {
      console.error("Failed to lock advice note", error);
      toast.error("Failed to lock advice note. Verify all required details are completed.");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-primary uppercase">Investment Advice Notes</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            SEBI-regulated advice history and compliance logs
          </p>
        </div>
        <Button 
          className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/10 shrink-0" 
          onClick={onCreateNew}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Advice Note</span>
        </Button>
      </div>

      <Card className="border-primary/10 overflow-hidden bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-none">
            <Table>
              <TableHeader className="bg-primary/5">
                <TableRow>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Advice Note No</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Date of Issue</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Principal Officer</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Category</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Validity</TableHead>
                  <TableHead className="font-semibold text-primary whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right font-semibold text-primary whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="h-12"><div className="h-4 bg-muted animate-pulse rounded w-36" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-24" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-28" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-32" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-28" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded w-16" /></TableCell>
                      <TableCell><div className="h-8 bg-muted animate-pulse rounded w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : notes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                          <FileText className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">No advice notes found</p>
                        <p className="text-sm">Create a new Investment Advice Note to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((note) => {
                    const isLocked = note.is_locked;
                    return (
                      <TableRow key={note.id} className="hover:bg-primary/5 transition-colors group">
                        <TableCell className="font-bold text-foreground max-w-[200px] truncate">
                          {note.advice_note_no}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(note.date_of_issue), "dd MMM yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {note.principal_officer_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {note.advice_category}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {note.advice_validity_custom_text || `${note.advice_validity_days} days`}
                        </TableCell>
                        <TableCell>
                          {isLocked ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest gap-1 flex w-fit items-center">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black uppercase tracking-widest gap-1 flex w-fit items-center">
                              <Unlock className="w-2.5 h-2.5" /> Draft
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 gap-1.5 hover:bg-primary/10 text-primary"
                              onClick={() => onSelectNote(note.id)}
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
                              <DropdownMenuContent align="end" className="w-48 border-primary/20 bg-background/95 backdrop-blur-md">
                                <DropdownMenuItem 
                                  className="gap-2 cursor-pointer" 
                                  onClick={() => handleDownload(note.id, note.advice_note_no, 'pdf')}
                                  disabled={downloading === `${note.id}-pdf`}
                                >
                                  {downloading === `${note.id}-pdf` ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <Download className="w-4 h-4 text-red-500" />
                                  )}
                                  Download PDF
                                </DropdownMenuItem>
                                
                                {!isLocked && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="gap-2 text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer font-semibold" 
                                      onClick={() => setLockingNote(note)}
                                    >
                                      <Lock className="w-4 h-4" />
                                      Lock & Deliver
                                    </DropdownMenuItem>
                                  </>
                                )}
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

      {!loading && notes.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <p>Displaying {notes.length} advice notes in compliance repository.</p>
          <div className="flex items-center gap-1 p-1 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-600 font-bold uppercase tracking-widest px-2">
            <Database className="w-3 h-3" />
            Audit Lock Enabled
          </div>
        </div>
      )}

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={!!lockingNote} onOpenChange={(open) => !open && setLockingNote(null)}>
        <AlertDialogContent className="max-w-md border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" /> Confirm SEBI Lock & Delivery
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-foreground">
              <p>
                You are locking Advice Note <strong>{lockingNote?.advice_note_no}</strong>.
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs leading-relaxed">
                <strong>CRITICAL REGULATORY COMPLIANCE:</strong> Under SEBI (Investment Advisers) Regulations, 2013, 
                once an advice note is delivered to the client, it must be locked to prevent any future modifications.
                This forms an immutable record retained for a mandatory period of 5 years.
              </div>
              <p className="text-sm font-bold text-destructive">
                This action is irreversible. You will not be able to edit this note after locking.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleLockConfirm();
              }}
              disabled={isLocking}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLocking ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Locking...
                </span>
              ) : (
                "Lock Advice Note"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
