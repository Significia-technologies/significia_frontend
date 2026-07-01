"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  RefreshCw,
  Download,
  ChevronDown,
  Loader2,
  Inbox,
  Lock,
  Unlock,
  StickyNote,
  UserCircle2,
  Building2,
  Clock,
  CheckCheck,
  Paperclip,
  X,
  FileText,
  Mail,
  Settings,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  CommunicationService,
  ConversationThread,
  ThreadDetail,
  CommunicationStats,
  ThreadStatus,
  ThreadType,
  SenderType,
  CreateThreadPayload,
} from "@/core/services/communication.service";
import { EmailService, type EmailTemplate } from "@/core/services/email.service";
import { IAMasterService, type IAMaster } from "@/core/services/ia-master.service";
import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import { EmailSmtpSettings } from "./components/EmailSmtpSettings";
import { EmailTemplates } from "./components/EmailTemplates";
import { EmailLogs } from "./components/EmailLogs";

type CommTab = "inbox" | "templates" | "sent-emails" | "settings";

// ── Helpers ────────────────────────────────────────────────────────────

const THREAD_TYPE_LABELS: Record<ThreadType, string> = {
  GENERAL: "General",
  ADVISORY: "Advisory",
  COMPLIANCE: "Compliance",
  COMPLAINT: "Complaint",
};

const THREAD_TYPE_COLORS: Record<ThreadType, string> = {
  GENERAL: "bg-blue-500/10 text-blue-600 border-blue-200",
  ADVISORY: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  COMPLIANCE: "bg-amber-500/10 text-amber-600 border-amber-200",
  COMPLAINT: "bg-red-500/10 text-red-600 border-red-200",
};

const STATUS_COLORS: Record<ThreadStatus, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  PENDING_IA: "bg-amber-500/10 text-amber-600 border-amber-200",
  PENDING_CLIENT: "bg-blue-500/10 text-blue-600 border-blue-200",
  CLOSED: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<ThreadStatus, string> = {
  OPEN: "Open",
  PENDING_IA: "Awaiting IA",
  PENDING_CLIENT: "Awaiting Client",
  CLOSED: "Closed",
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────

export default function CommunicationPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<CommTab>(
    (searchParams.get("tab") as CommTab) || "inbox"
  );

  // ── State ────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [totalThreads, setTotalThreads] = useState(0);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [stats, setStats] = useState<CommunicationStats | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Compose
  const [messageBody, setMessageBody] = useState("");
  const [senderType, setSenderType] = useState<SenderType>("IA");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send email dialog attachments
  const [emailAttachedFiles, setEmailAttachedFiles] = useState<File[]>([]);
  const emailFileInputRef = useRef<HTMLInputElement>(null);

  // New thread dialog
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; client_name: string; client_code: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientInputValue, setClientInputValue] = useState("");
  const [newThread, setNewThread] = useState<CreateThreadPayload>({
    client_id: "",
    subject: "",
    body: "",
    thread_type: "GENERAL",
  });
  const [creatingThread, setCreatingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // IA Master (for template placeholder substitution)
  const [iaMaster, setIaMaster] = useState<IAMaster | null>(null);

  // Templates (lazy-loaded, shared by both features)
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Send Email dialog (Gap 2)
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [sendEmailForm, setSendEmailForm] = useState({ templateId: "", subject: "" });
  const [sendEmailPreview, setSendEmailPreview] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    try {
      const data = await CommunicationService.getStats();
      setStats(data);
    } catch {
      // non-fatal
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
        const data = await CommunicationService.listThreads({
        limit: 100,
        offset: 0,
        ...(search && { search }),
        ...(filterStatus && filterStatus !== "all" && { status: filterStatus }),
        ...(filterType && filterType !== "all" && { thread_type: filterType }),
      });
      setThreads(data.items);
      setTotalThreads(data.total);
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoadingThreads(false);
    }
  }, [search, filterStatus, filterType]);

  const loadThreadDetail = useCallback(async (threadId: string) => {
    setLoadingDetail(true);
    try {
      const data = await CommunicationService.getThread(threadId);
      setThreadDetail(data);
      // Mark client messages as read silently
      if ((data.unread_count ?? 0) > 0) {
        await CommunicationService.markRead(threadId);
        loadStats();
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t))
        );
      }
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setLoadingDetail(false);
    }
  }, [loadStats]);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const res = await httpClient.get(API_ENDPOINTS.MASTER.CLIENTS.LIST, {
        params: { limit: 500, offset: 0 },
      });
      setClients(res.data?.clients ?? res.data?.items ?? []);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadThreads();
    IAMasterService.getLatest().then((data) => setIaMaster(data)).catch(() => {});
  }, [loadStats, loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId, loadThreadDetail]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [threadDetail?.messages]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleSelectThread = (thread: ConversationThread) => {
    setSelectedThreadId(thread.id);
    setMessageBody("");
    setSenderType("IA");
    setIsInternalNote(false);
    setAttachedFiles([]);
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId || (!messageBody.trim() && attachedFiles.length === 0)) return;
    setSendingMessage(true);
    try {
      await CommunicationService.addMessage(
        selectedThreadId,
        {
          body: messageBody.trim() || "(attachment)",
          sender_type: senderType,
          source: senderType === "CLIENT" ? "MANUALLY_LOGGED" : "COMPOSED",
          is_internal_note: isInternalNote,
        },
        attachedFiles.length > 0 ? attachedFiles : undefined
      );
      setMessageBody("");
      setAttachedFiles([]);
      setIsInternalNote(false);
      setSenderType("IA");
      await loadThreadDetail(selectedThreadId);
      loadThreads();
      loadStats();
      toast.success(
        isInternalNote
          ? "Internal note saved"
          : senderType === "CLIENT"
          ? "Client reply logged"
          : "Message sent"
      );
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (status: ThreadStatus) => {
    if (!selectedThreadId) return;
    try {
      await CommunicationService.updateStatus(selectedThreadId, status);
      setThreadDetail((prev) => prev ? { ...prev, status } : prev);
      setThreads((prev) =>
        prev.map((t) => (t.id === selectedThreadId ? { ...t, status } : t))
      );
      toast.success(`Thread marked as ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleExport = async () => {
    if (!selectedThreadId) return;
    try {
      const data = await CommunicationService.exportThread(selectedThreadId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thread-${selectedThreadId}-audit.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit export downloaded");
    } catch {
      toast.error("Failed to export thread");
    }
  };

  const handleCreateThread = async () => {
    if (!newThread.client_id || !newThread.subject.trim() || !newThread.body.trim()) {
      toast.error("Client, subject, and message are required");
      return;
    }
    setCreatingThread(true);
    try {
      const result = await CommunicationService.createThread(newThread);
      setNewThreadOpen(false);
      setNewThread({ client_id: "", subject: "", body: "", thread_type: "GENERAL" });
      setClientInputValue("");
      setClientDropdownOpen(false);
      await loadThreads();
      loadStats();
      setSelectedThreadId(result.thread_id);
      toast.success("Conversation started");
    } catch {
      toast.error("Failed to create conversation");
    } finally {
      setCreatingThread(false);
    }
  };

  const handleOpenNewThread = () => {
    setNewThreadOpen(true);
    loadClients();
  };

  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return;
    setLoadingTemplates(true);
    try {
      const data = await EmailService.listTemplates();
      setTemplates(data || []);
    } catch { /* ignore */ }
    setLoadingTemplates(false);
  }, [templates.length]);

  const renderPreview = (html: string) => {
    return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const contactDetails = [
        iaMaster?.registered_contact_number,
        iaMaster?.office_contact_number,
        iaMaster?.registered_email_id,
      ].filter(Boolean).join(" | ");

      const vars: Record<string, string> = {
        client_name: threadDetail?.client_name ?? "",
        client_email: threadDetail?.client_email ?? "",
        subject: threadDetail?.subject ?? "",
        ia_name: iaMaster?.name_of_ia ?? "",
        ia_reg_no: iaMaster?.ia_registration_number ?? "",
        ia_firm_name: iaMaster?.name_of_entity ?? iaMaster?.name_of_ia ?? "",
        ia_contact_details: contactDetails,
      };
      return vars[key] ?? `{{ ${key} }}`;
    });
  };

  const handleSelectSendTemplate = (tpl: EmailTemplate) => {
    setSendEmailForm({ templateId: tpl.id, subject: tpl.subject });
    setSendEmailPreview(renderPreview(tpl.body_html));
  };

  const handleSendEmail = async () => {
    if (!threadDetail?.client_email || !sendEmailForm.templateId) return;
    setSendingEmail(true);
    try {
      const selectedTemplate = templates.find((t) => t.id === sendEmailForm.templateId);
      await EmailService.sendEmail({
        recipient_email: threadDetail.client_email,
        recipient_name: threadDetail.client_name ?? undefined,
        template_id: sendEmailForm.templateId,
        subject: sendEmailForm.subject,
        template_variables: {
          client_name: threadDetail.client_name ?? "",
          client_email: threadDetail.client_email ?? "",
        },
        context_type: "COMMUNICATION",
        context_id: threadDetail.id,
      }, emailAttachedFiles.length > 0 ? emailAttachedFiles : undefined);

      // Log the email send as a thread message for full audit trail
      const auditBody = `Formal email sent to client.\nSubject: ${sendEmailForm.subject}\nTemplate: ${selectedTemplate?.template_name ?? sendEmailForm.templateId}`;
      await CommunicationService.addMessage(threadDetail.id, {
        body: auditBody,
        sender_type: "IA",
        source: "COMPOSED",
        is_internal_note: true,
      });

      toast.success("Email sent to client");
      setSendEmailOpen(false);
      setSendEmailForm({ templateId: "", subject: "" });
      setSendEmailPreview("");
      setEmailAttachedFiles([]);
      await loadThreadDetail(threadDetail.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to send email");
    }
    setSendingEmail(false);
  };

  // ── Render ────────────────────────────────────────────────────

  const TAB_ITEMS: { id: CommTab; label: string; icon: React.ElementType }[] = [
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "sent-emails", label: "Sent Emails", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Communication</h1>
            <p className="text-xs text-muted-foreground">
              SEBI-compliant IA–Investor communication records
            </p>
          </div>
          {stats && stats.total_unread_messages > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">
              {stats.total_unread_messages} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Tab navigation */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border">
            {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activeTab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {activeTab === "inbox" && (
            <Button size="sm" onClick={handleOpenNewThread}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Conversation
            </Button>
          )}
        </div>
      </div>

      {/* ── Non-inbox tabs: scrollable container ── */}
      {activeTab !== "inbox" && (
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full pb-20">
          {activeTab === "templates" && <EmailTemplates />}
          {activeTab === "sent-emails" && <EmailLogs />}
          {activeTab === "settings" && <EmailSmtpSettings />}
        </div>
      )}

      {/* ── Inbox tab only ── */}
      {activeTab === "inbox" && (
        <>
          {/* Stats Row */}
          {stats && (
            <div className="flex gap-4 px-6 py-2.5 border-b border-border bg-muted/30 shrink-0">
              {(
                [
                  { label: "Open", value: stats.open_count, color: "text-emerald-600" },
                  { label: "Awaiting IA", value: stats.pending_ia_count, color: "text-amber-600" },
                  { label: "Awaiting Client", value: stats.pending_client_count, color: "text-blue-600" },
                  { label: "Closed", value: stats.closed_count, color: "text-muted-foreground" },
                ] as const
              ).map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <span className={cn("font-semibold text-sm", color)}>{value}</span>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-border mx-1">·</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Two-pane Layout ── */}
          <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Thread List ── */}
        <div className="w-80 shrink-0 flex flex-col border-r border-border bg-card">
          {/* Filters */}
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-xs"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-7 text-[11px] flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PENDING_IA">Awaiting IA</SelectItem>
                  <SelectItem value="PENDING_CLIENT">Awaiting Client</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-7 text-[11px] flex-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ADVISORY">Advisory</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="COMPLAINT">Complaint</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={loadThreads}
                disabled={loadingThreads}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loadingThreads && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  Start one with a client
                </p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-border transition-colors",
                    "hover:bg-accent",
                    selectedThreadId === thread.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium truncate flex-1">
                      {thread.client_name ?? "Unknown Client"}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(thread.last_message_at)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-foreground/90 truncate mb-1.5">
                    {thread.subject}
                  </p>
                  {thread.last_message_preview && (
                    <p className="text-[11px] text-muted-foreground truncate mb-1.5">
                      {thread.last_message_preview}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] h-4 px-1.5 font-normal", STATUS_COLORS[thread.status])}
                    >
                      {STATUS_LABELS[thread.status]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] h-4 px-1.5 font-normal", THREAD_TYPE_COLORS[thread.thread_type])}
                    >
                      {THREAD_TYPE_LABELS[thread.thread_type]}
                    </Badge>
                    {(thread.unread_count ?? 0) > 0 && (
                      <span className="ml-auto h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-semibold">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {totalThreads > 0 && (
            <div className="px-3 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                {totalThreads} conversation{totalThreads !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Thread Detail ── */}
        {!selectedThreadId ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-center p-8">
            <div className="p-4 bg-primary/5 rounded-2xl mb-4">
              <MessageSquare className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="font-medium text-muted-foreground">Select a conversation</h3>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Choose a thread from the left or start a new conversation with a client
            </p>
          </div>
        ) : loadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : threadDetail ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Thread header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{threadDetail.subject}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {threadDetail.client_name}
                    </span>
                    {threadDetail.client_email && (
                      <span className="text-[11px] text-muted-foreground/60">
                        · {threadDetail.client_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5", STATUS_COLORS[threadDetail.status])}
                >
                  {STATUS_LABELS[threadDetail.status]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5", THREAD_TYPE_COLORS[threadDetail.thread_type])}
                >
                  {THREAD_TYPE_LABELS[threadDetail.thread_type]}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Send email using template"
                  onClick={() => { setSendEmailOpen(true); loadTemplates(); }}
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport} title="Export for SEBI audit">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      Actions <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {threadDetail.status !== "OPEN" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("OPEN")}>
                        <Unlock className="mr-2 h-3.5 w-3.5" />
                        Reopen
                      </DropdownMenuItem>
                    )}
                    {threadDetail.status !== "PENDING_CLIENT" && threadDetail.status !== "CLOSED" && (
                      <DropdownMenuItem onClick={() => handleStatusChange("PENDING_CLIENT")}>
                        <Clock className="mr-2 h-3.5 w-3.5" />
                        Awaiting Client
                      </DropdownMenuItem>
                    )}
                    {threadDetail.status !== "CLOSED" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusChange("CLOSED")}
                          className="text-muted-foreground"
                        >
                          <Lock className="mr-2 h-3.5 w-3.5" />
                          Close Thread
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {threadDetail.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs text-muted-foreground">No messages yet</p>
                </div>
              ) : (
                threadDetail.messages.map((msg) => {
                  const isIA = msg.sender_type === "IA";
                  const isNote = msg.is_internal_note;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-1",
                        isIA ? "items-end" : "items-start"
                      )}
                    >
                      {/* Sender label */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] text-muted-foreground",
                          isIA ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        {isIA ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <UserCircle2 className="h-3 w-3" />
                        )}
                        <span>{isIA ? (msg.sender_name ?? "IA") : (threadDetail.client_name ?? "Client")}</span>
                        {isNote && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-amber-500/10 text-amber-600 border-amber-200">
                            <StickyNote className="h-2.5 w-2.5 mr-0.5" />
                            Note
                          </Badge>
                        )}
                        {!isIA && msg.source === "MANUALLY_LOGGED" && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                            logged
                          </Badge>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isNote
                            ? "bg-amber-500/10 border border-amber-200/50 text-foreground rounded-tl-sm"
                            : isIA
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted text-foreground rounded-tl-sm"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        {(() => {
                          let attachments: { name: string; key: string; content_type: string; size: number }[] = [];
                          try { attachments = msg.attachments_info ? JSON.parse(msg.attachments_info as string) : []; } catch { /* ignore */ }
                          if (!attachments.length) return null;
                          return (
                            <div className="mt-2 space-y-1.5 pt-2 border-t border-current/10">
                              {attachments.map((att, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const url = await CommunicationService.getAttachmentUrl(att.key);
                                      window.open(url, "_blank");
                                    } catch { /* ignore */ }
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                                    isIA
                                      ? "bg-white/10 hover:bg-white/20 text-primary-foreground"
                                      : "bg-background/60 hover:bg-background/80 text-foreground border border-border/50"
                                  )}
                                >
                                  <FileText className="h-4 w-4 shrink-0 opacity-70" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium truncate">{att.name}</p>
                                    <p className="text-[10px] opacity-60">
                                      {att.size < 1024 * 1024
                                        ? `${Math.round(att.size / 1024)} KB`
                                        : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                                    </p>
                                  </div>
                                  <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatMessageTime(msg.sent_at)}
                        {isIA && msg.is_read && (
                          <CheckCheck className="inline ml-1 h-3 w-3 text-primary/60" />
                        )}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose area */}
            {threadDetail.status !== "CLOSED" ? (
              <div className="shrink-0 border-t border-border bg-card p-4 space-y-3">
                {/* Mode toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSenderType("IA"); setIsInternalNote(false); }}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      senderType === "IA" && !isInternalNote
                        ? "bg-primary/10 border-primary/30 text-primary font-medium"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Building2 className="h-3 w-3" />
                    Send to Client
                  </button>
                  <button
                    onClick={() => { setSenderType("CLIENT"); setIsInternalNote(false); }}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      senderType === "CLIENT" && !isInternalNote
                        ? "bg-blue-500/10 border-blue-300 text-blue-600 font-medium"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <UserCircle2 className="h-3 w-3" />
                    Log Client Reply
                  </button>
                  <button
                    onClick={() => { setIsInternalNote(true); setSenderType("IA"); }}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      isInternalNote
                        ? "bg-amber-500/10 border-amber-300 text-amber-600 font-medium"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <StickyNote className="h-3 w-3" />
                    Internal Note
                  </button>

                </div>

                {/* Helper text */}
                {senderType === "CLIENT" && !isInternalNote && (
                  <p className="text-[11px] text-blue-600/70 bg-blue-500/5 border border-blue-200/50 rounded px-2.5 py-1.5">
                    This will be stored as a client reply. No email will be sent.
                  </p>
                )}
                {isInternalNote && (
                  <p className="text-[11px] text-amber-600/70 bg-amber-500/5 border border-amber-200/50 rounded px-2.5 py-1.5">
                    Internal note — visible to IA staff only. Not sent to client.
                  </p>
                )}

                {/* Input row */}
                <div className="flex gap-2">
                  <Textarea
                    className="flex-1 min-h-[72px] max-h-40 text-sm resize-none"
                    placeholder={
                      isInternalNote
                        ? "Add an internal note..."
                        : senderType === "CLIENT"
                        ? "Type the client's reply to log..."
                        : "Type a message to send to client..."
                    }
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1.5 self-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-2.5"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={(!messageBody.trim() && attachedFiles.length === 0) || sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Attached files */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attachedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-[11px] bg-muted rounded px-2 py-1 border border-border"
                      >
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="max-w-[160px] truncate">{file.name}</span>
                        <span className="text-muted-foreground">
                          {file.size < 1024 * 1024
                            ? `${Math.round(file.size / 1024)}KB`
                            : `${(file.size / (1024 * 1024)).toFixed(1)}MB`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    setAttachedFiles((prev) => [...prev, ...selected]);
                    e.target.value = "";
                  }}
                />

                <p className="text-[10px] text-muted-foreground/50">Ctrl+Enter to send</p>
              </div>
            ) : (
              <div className="shrink-0 border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">This thread is closed.</p>
                <Button variant="outline" size="sm" onClick={() => handleStatusChange("OPEN")}>
                  <Unlock className="h-3.5 w-3.5 mr-1.5" />
                  Reopen
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
        </>
      )}

      {/* ── Send Email Dialog (Gap 2) ── */}
      <Dialog open={sendEmailOpen} onOpenChange={(open) => {
        setSendEmailOpen(open);
        if (!open) { setSendEmailForm({ templateId: "", subject: "" }); setSendEmailPreview(""); setEmailAttachedFiles([]); }
      }}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Send Email to {threadDetail?.client_name}
            </DialogTitle>
            <DialogDescription>
              Pick a template, review the preview, then send directly to{" "}
              <span className="font-medium text-foreground">{threadDetail?.client_email}</span>. This is logged in Sent Emails.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template picker */}
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <Select
                value={sendEmailForm.templateId}
                onValueChange={(id) => {
                  const tpl = templates.find((t) => t.id === id);
                  if (tpl) handleSelectSendTemplate(tpl);
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingTemplates ? "Loading templates…" : "Select a template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      <span>{tpl.template_name}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{tpl.template_type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input
                className="h-9 text-sm"
                placeholder="Email subject"
                value={sendEmailForm.subject}
                onChange={(e) => setSendEmailForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>

            {/* HTML Preview */}
            {sendEmailPreview && (
              <div className="space-y-1.5">
                <Label className="text-xs">Preview</Label>
                <div className="border border-border rounded-md overflow-hidden max-h-64 overflow-y-auto bg-white">
                  <iframe
                    srcDoc={sendEmailPreview}
                    className="w-full"
                    style={{ height: "240px", border: "none" }}
                    sandbox="allow-same-origin"
                    title="Email preview"
                  />
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Attachments (optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => emailFileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Add Files
                </Button>
              </div>
              {emailAttachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {emailAttachedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-[11px] bg-muted rounded px-2 py-1 border border-border"
                    >
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <span className="text-muted-foreground">
                        {file.size < 1024 * 1024
                          ? `${Math.round(file.size / 1024)}KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)}MB`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEmailAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={emailFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  setEmailAttachedFiles((prev) => [...prev, ...selected]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={!sendEmailForm.templateId || !sendEmailForm.subject || sendingEmail}
              className="gap-2"
            >
              {sendingEmail ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> Send Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Thread Dialog ── */}
      <Dialog open={newThreadOpen} onOpenChange={(open) => {
        setNewThreadOpen(open);
        if (!open) { setClientInputValue(""); setClientDropdownOpen(false); }
      }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a new SEBI-recorded thread with a client. An email notification will be sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Client</Label>
              <div className="relative">
                <Input
                  className="h-9 text-sm pr-8"
                  placeholder={loadingClients ? "Loading clients..." : "Search by name or client code..."}
                  disabled={loadingClients}
                  value={clientInputValue}
                  onChange={(e) => {
                    setClientInputValue(e.target.value);
                    setClientDropdownOpen(true);
                    if (newThread.client_id) {
                      setNewThread((p) => ({ ...p, client_id: "" }));
                    }
                  }}
                  onFocus={() => setClientDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                {clientDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                      {clients
                        .filter((c) => {
                          const q = clientInputValue.toLowerCase();
                          return (
                            !q ||
                            c.client_name?.toLowerCase().includes(q) ||
                            c.client_code?.toLowerCase().includes(q)
                          );
                        })
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewThread((p) => ({ ...p, client_id: c.id }));
                              setClientInputValue(c.client_name);
                              setClientDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                              "hover:bg-accent transition-colors",
                              newThread.client_id === c.id && "bg-primary/5 text-primary font-medium"
                            )}
                          >
                            <span>{c.client_name}</span>
                            {c.client_code && (
                              <span className="text-muted-foreground text-xs">#{c.client_code}</span>
                            )}
                          </button>
                        ))}
                      {clients.filter((c) => {
                        const q = clientInputValue.toLowerCase();
                        return !q || c.client_name?.toLowerCase().includes(q) || c.client_code?.toLowerCase().includes(q);
                      }).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">No clients found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Subject</Label>
              <Input
                className="h-9 text-sm"
                placeholder="e.g. Portfolio Review Q4 2025"
                value={newThread.subject}
                onChange={(e) => setNewThread((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Thread Type</Label>
              <Select
                value={newThread.thread_type}
                onValueChange={(v) => setNewThread((p) => ({ ...p, thread_type: v as ThreadType }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ADVISORY">Advisory</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="COMPLAINT">Complaint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                className="min-h-[100px] text-sm resize-none"
                placeholder="Write your opening message to the client..."
                value={newThread.body}
                onChange={(e) => setNewThread((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewThreadOpen(false)} disabled={creatingThread}>
              Cancel
            </Button>
            <Button onClick={handleCreateThread} disabled={creatingThread}>
              {creatingThread ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send &amp; Start Thread
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
