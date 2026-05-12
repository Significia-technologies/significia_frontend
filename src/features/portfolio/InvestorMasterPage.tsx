"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  UserPlus, ToggleLeft, ToggleRight, Loader2, RefreshCcw, FileText,
  CalendarIcon, X, Upload, FileCheck, History, ExternalLink, MoreHorizontal,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  InvestorMasterService, InvestorMember, InvestorMemberCreate, InvestorRelation,
} from "@/core/services/investor-master.service";
import { InvestorIpsService, IpsDocument } from "@/core/services/investor-ips.service";

// ── Fixed DatePicker — floats over the dialog aligned with the trigger ─
function InlineDatePicker({
  value, onChange, placeholder = "Select date", toYear = new Date().getFullYear(),
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  toYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const selected = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
  const CAL_H = 310;

  const handleToggle = () => {
    if (!open && wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow >= CAL_H + 8 ? r.bottom + 4 : r.top - CAL_H - 4;
      setPos({ position: "fixed", top, left: r.left, zIndex: 9999, width: r.width });
    }
    setOpen((p) => !p);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
        wrapperRef.current && !wrapperRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="w-full">
      <Button
        type="button"
        variant="outline"
        onClick={handleToggle}
        className={cn("w-full justify-start text-left font-normal h-10", !value && "text-muted-foreground")}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
        {selected ? format(selected, "dd MMM yyyy") : placeholder}
        {value && (
          <X
            className="ml-auto h-3.5 w-3.5 opacity-50 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }}
          />
        )}
      </Button>
      {open && (
        <div ref={calendarRef} style={pos} className="rounded-md border bg-popover shadow-xl overflow-hidden">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => { onChange(d && isValid(d) ? format(d, "yyyy-MM-dd") : ""); setOpen(false); }}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={toYear}
            initialFocus
            className="[--cell-size:--spacing(7)] p-2 text-xs w-full"
          />
        </div>
      )}
    </div>
  );
}

// ── IPS Upload Modal — version history + upload for a single member ──
function IpsModal({
  open, onClose, clientId, member,
}: {
  open: boolean;
  onClose: (uploaded: boolean) => void;
  clientId: string;
  member: InvestorMember;
}) {
  const [docs, setDocs] = useState<IpsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await InvestorIpsService.listDocuments(clientId, member.id);
      setDocs(res.documents);
    } catch {
      toast.error("Failed to load IPS documents.");
    } finally {
      setLoading(false);
    }
  }, [clientId, member.id]);

  useEffect(() => {
    if (open) fetchDocs();
  }, [open, fetchDocs]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }
    setUploading(true);
    try {
      await InvestorIpsService.uploadDocument(clientId, member.id, file);
      toast.success("IPS document uploaded successfully.");
      await fetchDocs();
      onClose(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const latestDoc = docs[0];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(false); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Investment Policy Statement — {member.full_name}
            <span className="ml-2 text-xs font-mono text-muted-foreground">({member.investor_code})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Current / latest version */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Current IPS</p>
            {loading ? (
              <Skeleton className="h-14 w-full rounded-md" />
            ) : latestDoc ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2.5 space-y-2">
                <div className="flex items-start gap-2">
                  <FileCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-all">{latestDoc.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Version {latestDoc.version_number} &middot;{" "}
                      {new Date(latestDoc.uploaded_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 gap-1 text-xs justify-center"
                  onClick={() => InvestorIpsService.openDocument(clientId, member.id, latestDoc.id).catch(() => toast.error("Could not open document."))}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Document
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                No IPS document uploaded yet.
              </div>
            )}
          </div>

          {/* Version history */}
          {!loading && docs.length > 1 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Version History
              </p>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {docs.slice(1).map((doc) => (
                  <div key={doc.id} className="flex items-start gap-2 rounded px-2.5 py-1.5 text-xs hover:bg-muted/50">
                    <div className="text-muted-foreground flex-1 min-w-0">
                      <span className="font-medium">v{doc.version_number}</span>
                      <span className="mx-1">&middot;</span>
                      <span className="break-all">{doc.file_name}</span>
                      <span className="mx-1">&middot;</span>
                      <span className="whitespace-nowrap">
                        {new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => InvestorIpsService.openDocument(clientId, member.id, doc.id).catch(() => toast.error("Could not open document."))}
                      className="shrink-0 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {latestDoc ? "Re-upload IPS (PDF)" : "Upload IPS (PDF)"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : latestDoc ? "Re-upload PDF" : "Upload PDF"}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Compact IPS button for table cell ──
function IpsCellButton({
  clientId, member, onUploaded,
}: {
  clientId: string;
  member: InvestorMember;
  onUploaded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hasIps, setHasIps] = useState<boolean | null>(null);

  useEffect(() => {
    InvestorIpsService.listDocuments(clientId, member.id)
      .then((res) => setHasIps(res.total > 0))
      .catch(() => setHasIps(false));
  }, [clientId, member.id]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1 text-xs"
        onClick={() => setOpen(true)}
      >
        {hasIps === null ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : hasIps ? (
          <FileCheck className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {hasIps ? "IPS" : "Upload"}
      </Button>
      {open && (
        <IpsModal
          open={open}
          onClose={(uploaded) => {
            setOpen(false);
            if (uploaded) {
              setHasIps(true);
              onUploaded();
            }
          }}
          clientId={clientId}
          member={member}
        />
      )}
    </>
  );
}

interface InvestorMasterPageProps {
  clientId: string;
  clientCode: string;
  clientName: string;
}

const RELATIONS: InvestorRelation[] = ["Spouse", "Son", "Daughter", "HUF"];
const GENDERS = ["Male", "Female", "Other"];

const EMPTY_FORM: InvestorMemberCreate = {
  full_name: "",
  relation: "Spouse",
  gender: "",
  date_of_birth: "",
  pan_number: "",
  ckyc_number: "",
};

export function InvestorMasterPage({ clientId, clientCode, clientName }: InvestorMasterPageProps) {
  const [members, setMembers] = useState<InvestorMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"full" | "active">("full");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<InvestorMemberCreate>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // IPS state for Self member
  const [selfIpsModal, setSelfIpsModal] = useState(false);
  const [selfHasIps, setSelfHasIps] = useState<boolean | null>(null);
  const [selfIpsDoc, setSelfIpsDoc] = useState<IpsDocument | null>(null);

  const selfMember = members.find((m) => m.relation === "Self") ?? null;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await InvestorMasterService.listMembers(clientId, reportType);
      setMembers(res.members);
    } catch {
      toast.error("Failed to load investor members.");
    } finally {
      setLoading(false);
    }
  }, [clientId, reportType]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Fetch Self IPS status whenever selfMember changes
  const fetchSelfIps = useCallback(async (memberId: string) => {
    try {
      const res = await InvestorIpsService.listDocuments(clientId, memberId);
      setSelfHasIps(res.total > 0);
      setSelfIpsDoc(res.documents[0] ?? null);
    } catch {
      setSelfHasIps(false);
      setSelfIpsDoc(null);
    }
  }, [clientId]);

  useEffect(() => {
    if (selfMember) fetchSelfIps(selfMember.id);
  }, [selfMember, fetchSelfIps]);

  const handleAddMember = async () => {
    if (!formData.full_name.trim()) return toast.error("Full name is required.");
    if (!formData.date_of_birth) return toast.error("Date of birth is required.");
    if (!formData.pan_number.trim()) return toast.error("PAN number is required.");
    if (!formData.ckyc_number.trim()) return toast.error("CKYC Number is required.");
    if (formData.relation !== "HUF" && !formData.gender) return toast.error("Gender is required.");

    setSubmitting(true);
    try {
      const payload: InvestorMemberCreate = {
        ...formData,
        pan_number: formData.pan_number.toUpperCase().trim(),
        gender: formData.relation === "HUF" ? undefined : formData.gender,
      };
      await InvestorMasterService.createMember(clientId, payload);
      toast.success("Member added successfully.");
      setShowAddDialog(false);
      setFormData(EMPTY_FORM);
      fetchMembers();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to add member.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (member: InvestorMember) => {
    setTogglingId(member.id);
    try {
      await InvestorMasterService.toggleMember(clientId, member.id);
      toast.success(`${member.full_name} ${member.is_active ? "deactivated" : "activated"}.`);
      fetchMembers();
    } catch {
      toast.error("Failed to update member status.");
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const canAddMember = selfHasIps === true;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header — stacks on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Investor Master</h2>
            <p className="text-sm text-muted-foreground">{clientName} &mdash; {clientCode}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={reportType} onValueChange={(v) => setReportType(v as "full" | "active")}>
              <SelectTrigger className="w-36 shrink-0">
                <FileText className="h-4 w-4 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Report</SelectItem>
                <SelectItem value="active">Active Report</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchMembers} disabled={loading} className="shrink-0">
              <RefreshCcw className="h-4 w-4" />
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={canAddMember ? -1 : 0} className="shrink-0">
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    disabled={!canAddMember || loading}
                    className="w-full sm:w-auto"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </span>
              </TooltipTrigger>
              {!canAddMember && selfHasIps !== null && (
                <TooltipContent side="bottom">
                  Upload the client&apos;s IPS document before adding family members.
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Self IPS Banner */}
        {!loading && selfMember && (
          <Card className={cn(
            "border",
            selfHasIps === false && "border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800",
            selfHasIps === true && "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
          )}>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Investment Policy Statement (IPS) — {selfMember.full_name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {selfHasIps === null ? (
                    <Skeleton className="h-4 w-48" />
                  ) : selfHasIps && selfIpsDoc ? (
                    <div>
                      <span className="font-medium text-green-700 dark:text-green-400 text-sm">IPS uploaded</span>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        v{selfIpsDoc.version_number} &middot; {selfIpsDoc.file_name} &middot;{" "}
                        {new Date(selfIpsDoc.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                      IPS not uploaded &mdash; required before adding family members
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 self-start sm:self-auto"
                  onClick={() => setSelfIpsModal(true)}
                >
                  {selfHasIps ? <><History className="h-3.5 w-3.5" /> Manage IPS</> : <><Upload className="h-3.5 w-3.5" /> Upload IPS</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Desktop Table (md+) ── */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor Full Name</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>PAN Number</TableHead>
                  <TableHead>CKYC Number</TableHead>
                  <TableHead>Investor Code</TableHead>
                  <TableHead>IPS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      No investor members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => (
                    <TableRow key={m.id} className={!m.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell>
                        <Badge variant={m.relation === "Self" ? "secondary" : "outline"}>{m.relation}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(m.date_of_birth)}</TableCell>
                      <TableCell className="font-mono text-xs">{m.pan_number}</TableCell>
                      <TableCell className="font-mono text-xs">{m.ckyc_number}</TableCell>
                      <TableCell className="font-mono font-semibold">{m.investor_code}</TableCell>
                      <TableCell>
                        {m.relation === "Self" ? (
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => setSelfIpsModal(true)}>
                            {selfHasIps === null ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : selfHasIps ? <FileCheck className="h-3.5 w-3.5 text-green-600" />
                              : <Upload className="h-3.5 w-3.5 text-muted-foreground" />}
                            {selfHasIps ? "IPS" : "Upload"}
                          </Button>
                        ) : (
                          <IpsCellButton clientId={clientId} member={m} onUploaded={fetchMembers} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.is_active ? "default" : "secondary"}>
                          {m.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={togglingId === m.id}>
                              {togglingId === m.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggle(m)}>
                              {m.is_active
                                ? <><ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate</>
                                : <><ToggleRight className="h-4 w-4 mr-2 text-green-600" /> Activate</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Mobile Cards (< md) ── */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent></Card>
            ))
          ) : members.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No investor members found.
            </div>
          ) : (
            members.map((m) => (
              <Card key={m.id} className={cn(!m.is_active && "opacity-60")}>
                <CardContent className="p-4 space-y-3">
                  {/* Row 1: Name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.full_name}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{m.investor_code}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                      <Badge variant={m.relation === "Self" ? "secondary" : "outline"} className="text-xs">{m.relation}</Badge>
                      <Badge variant={m.is_active ? "default" : "secondary"} className="text-xs">
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {/* Row 2: DOB */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Date of Birth</span>
                      <p className="font-medium mt-0.5">{formatDate(m.date_of_birth)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PAN Number</span>
                      <p className="font-mono font-medium mt-0.5">{m.pan_number}</p>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-muted-foreground">CKYC Number</span>
                      <p className="font-mono font-medium mt-0.5">{m.ckyc_number}</p>
                    </div>
                  </div>

                  {/* Row 3: Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    {/* IPS */}
                    {m.relation === "Self" ? (
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs flex-1" onClick={() => setSelfIpsModal(true)}>
                        {selfHasIps === null ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : selfHasIps ? <FileCheck className="h-3.5 w-3.5 text-green-600" />
                          : <Upload className="h-3.5 w-3.5" />}
                        {selfHasIps ? "View IPS" : "Upload IPS"}
                      </Button>
                    ) : (
                      <div className="flex-1">
                        <IpsCellButton clientId={clientId} member={m} onUploaded={fetchMembers} />
                      </div>
                    )}

                    {/* Toggle */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs flex-1" disabled={togglingId === m.id}>
                          {togglingId === m.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MoreHorizontal className="h-3.5 w-3.5" />}
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggle(m)}>
                          {m.is_active
                            ? <><ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" /> Deactivate</>
                            : <><ToggleRight className="h-4 w-4 mr-2 text-green-600" /> Activate</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Self IPS Modal */}
        {selfMember && (
          <IpsModal
            open={selfIpsModal}
            onClose={(uploaded) => {
              setSelfIpsModal(false);
              if (uploaded) fetchSelfIps(selfMember.id);
            }}
            clientId={clientId}
            member={selfMember}
          />
        )}

        {/* Add Member Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setFormData(EMPTY_FORM); } }}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Family Member / HUF</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Row 1: Relation + Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Relation <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.relation}
                    onValueChange={(v) =>
                      setFormData((p) => ({ ...p, relation: v as InvestorRelation, gender: "" }))
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                    <SelectContent>
                      {RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {formData.relation !== "HUF" ? (
                  <div className="space-y-1.5">
                    <Label>Gender <span className="text-destructive">*</span></Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(v) => setFormData((p) => ({ ...p, gender: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : <div className="hidden sm:block" />}
              </div>

              {/* Row 2: Full Name */}
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="As per PAN card"
                />
              </div>

              {/* Row 3: DOB + PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date of Birth <span className="text-destructive">*</span></Label>
                  <InlineDatePicker
                    value={formData.date_of_birth}
                    onChange={(v) => setFormData((p) => ({ ...p, date_of_birth: v }))}
                    placeholder="Select date of birth"
                    toYear={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>PAN Number <span className="text-destructive">*</span></Label>
                  <Input
                    value={formData.pan_number}
                    onChange={(e) => setFormData((p) => ({ ...p, pan_number: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="uppercase"
                  />
                </div>
              </div>

              {/* Row 4: CKYC */}
              <div className="space-y-1.5">
                <Label>CKYC Number <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.ckyc_number}
                  onChange={(e) => setFormData((p) => ({ ...p, ckyc_number: e.target.value }))}
                  placeholder="14-digit CKYC number"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setFormData(EMPTY_FORM); }}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
