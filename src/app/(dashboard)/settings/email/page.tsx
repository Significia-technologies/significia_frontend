"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mail,
  Settings,
  FileText,
  History,
  Loader2,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  ArrowLeft,
  Shield,
  Zap,
  AlertTriangle,
  User,
  Cpu,
} from "lucide-react";
import {
  EmailService,
  type EmailSettings as EmailSettingsType,
  type EmailTemplate,
  type EmailLog,
  type Placeholder,
} from "@/core/services/email.service";

// ── Status Badge Component ─────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════

export default function EmailSettingsPage() {
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState("smtp");

  // ── SMTP State ───────────────────────────────────────────────
  const [settings, setSettings] = useState<EmailSettingsType | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    use_tls: true,
    use_ssl: false,
    from_email: "",
    from_name: "",
  });

  // ── Templates State ──────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [templateForm, setTemplateForm] = useState({
    template_name: "",
    template_type: "REPORT_DELIVERY",
    subject: "",
    body_html: "",
    is_default: false,
  });

  // ── Logs State ───────────────────────────────────────────────
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── Data Loading ─────────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const data = await EmailService.getSettings();
      setSettings(data);
      if (data) {
        setSmtpForm({
          smtp_host: data.smtp_host || "",
          smtp_port: data.smtp_port || 587,
          smtp_username: data.smtp_username || "",
          smtp_password: "",
          use_tls: data.use_tls ?? true,
          use_ssl: data.use_ssl ?? false,
          from_email: data.from_email || "",
          from_name: data.from_name || "",
        });
        setTestRecipient(user?.email || "");
      }
    } catch { /* ignore */ }
    setLoadingSettings(false);
  }, [user?.email]);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await EmailService.listTemplates();
      setTemplates(data || []);
    } catch { /* ignore */ }
    setLoadingTemplates(false);
  }, []);

  const loadPlaceholders = useCallback(async () => {
    try {
      const data = await EmailService.getPlaceholders();
      setPlaceholders(data || []);
    } catch { /* ignore */ }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await EmailService.getLogs(0, 100);
      setLogs(data.items || []);
      setLogsTotal(data.total || 0);
    } catch { /* ignore */ }
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (activeTab === "templates") {
      loadTemplates();
      loadPlaceholders();
    } else if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab, loadTemplates, loadPlaceholders, loadLogs]);

  // ── SMTP Handlers ────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setTestResult(null);
    try {
      const result = await EmailService.saveSettings(smtpForm);
      setSettings(result);
      setSmtpForm((prev) => ({ ...prev, smtp_password: "" }));
      setTestResult({ success: true, message: "Settings saved successfully!" });
    } catch (err: any) {
      setTestResult({ success: false, message: err?.response?.data?.detail || "Failed to save settings." });
    }
    setSavingSettings(false);
  };

  const handleTestEmail = async () => {
    if (!testRecipient) return;
    setTestingEmail(true);
    setTestResult(null);
    try {
      const result = await EmailService.testSettings(testRecipient, smtpForm);
      setTestResult(result);
      if (result.success) {
        // Reload settings to reflect verified status
        await loadSettings();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.response?.data?.detail || "Test failed." });
    }
    setTestingEmail(false);
  };

  // ── Template Handlers ────────────────────────────────────────

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      template_name: "",
      template_type: "REPORT_DELIVERY",
      subject: "",
      body_html: "",
      is_default: false,
    });
    setShowTemplateEditor(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      template_name: template.template_name,
      template_type: template.template_type,
      subject: template.subject,
      body_html: template.body_html,
      is_default: template.is_default,
    });
    setShowTemplateEditor(true);
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await EmailService.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await EmailService.createTemplate(templateForm);
      }
      setShowTemplateEditor(false);
      loadTemplates();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to save template.");
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await EmailService.deleteTemplate(id);
      loadTemplates();
    } catch { /* ignore */ }
  };

  const handleLoadDefault = async () => {
    try {
      const data = await EmailService.getDefaultTemplate(templateForm.template_type);
      setTemplateForm((prev) => ({
        ...prev,
        subject: data.subject,
        body_html: data.body_html,
      }));
    } catch { /* ignore */ }
  };

  const insertPlaceholder = (key: string) => {
    const tag = `{{ ${key} }}`;
    setTemplateForm((prev) => ({
      ...prev,
      body_html: prev.body_html + tag,
    }));
  };

  // ── Render ───────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Email Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Configure SMTP, design templates, and monitor delivery
            </p>
          </div>
        </div>
        {settings?.is_verified && (
          <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> SMTP Verified
          </Badge>
        )}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="smtp" className="gap-1.5">
            <Settings className="h-4 w-4" /> SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <History className="h-4 w-4" /> Logs
          </TabsTrigger>
        </TabsList>

        {/* ──────────────── SMTP TAB ──────────────── */}
        <TabsContent value="smtp" className="space-y-6">
          {loadingSettings ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {testResult && (
                <Alert className={testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                  : "bg-red-500/10 border-red-500/30 text-red-700"
                }>
                  {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    SMTP Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your email server to send reports and notifications to clients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Row 1: Host & Port */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpForm.smtp_host}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_host: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        placeholder="587"
                        value={smtpForm.smtp_port}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_port: parseInt(e.target.value) || 587 }))}
                      />
                    </div>
                  </div>

                  {/* Row 2: Username & Password */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">Username</Label>
                      <Input
                        id="smtp_username"
                        placeholder="your-email@domain.com"
                        value={smtpForm.smtp_username}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_username: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">Password</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        placeholder={settings ? "••••••• (leave blank to keep)" : "Enter password"}
                        value={smtpForm.smtp_password}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, smtp_password: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Row 3: Security */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpForm.use_tls}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, use_tls: e.target.checked, use_ssl: e.target.checked ? false : f.use_ssl }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Use TLS (STARTTLS)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpForm.use_ssl}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, use_ssl: e.target.checked, use_tls: e.target.checked ? false : f.use_tls }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">Use SSL</span>
                    </label>
                  </div>

                  <Separator />

                  {/* Row 4: Sender Identity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        placeholder="reports@yourcompany.com"
                        value={smtpForm.from_email}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, from_email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        placeholder="Bunty Wealth Management"
                        value={smtpForm.from_name}
                        onChange={(e) => setSmtpForm((f) => ({ ...f, from_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2">
                      {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {savingSettings ? "Saving…" : "Save Settings"}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Input
                        className="w-64"
                        placeholder="Test recipient email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={handleTestEmail}
                        disabled={testingEmail || !settings}
                        className="gap-2"
                      >
                        {testingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {testingEmail ? "Sending…" : "Send Test"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Setup Guide */}
              <Card className="bg-muted/30 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Quick Setup Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p><strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, TLS: On. Use an <a className="text-primary underline" href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">App Password</a>.</p>
                  <p><strong>Outlook / Office 365:</strong> Host: smtp.office365.com, Port: 587, TLS: On.</p>
                  <p><strong>SendGrid:</strong> Host: smtp.sendgrid.net, Port: 587, Username: apikey.</p>
                  <p><strong>Zoho:</strong> Host: smtp.zoho.in, Port: 465, SSL: On.</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ──────────────── TEMPLATES TAB ──────────────── */}
        <TabsContent value="templates" className="space-y-6">
          {showTemplateEditor ? (
            // ─── Template Editor ────────────────────────────
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {editingTemplate ? "Edit Template" : "Create Template"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplateEditor(false)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Template meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      placeholder="e.g. Financial Report Email"
                      value={templateForm.template_name}
                      onChange={(e) => setTemplateForm((f) => ({ ...f, template_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={templateForm.template_type}
                      onValueChange={(v) => setTemplateForm((f) => ({ ...f, template_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REPORT_DELIVERY">Report Delivery</SelectItem>
                        <SelectItem value="WELCOME_CLIENT">Welcome Client</SelectItem>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    placeholder="e.g. {{ report_type }} Report for {{ client_name }}"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>

                {/* Body & Placeholders */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label>Email Body (HTML)</Label>
                    <Textarea
                      className="min-h-[320px] font-mono text-xs"
                      placeholder="Write your HTML email template here..."
                      value={templateForm.body_html}
                      onChange={(e) => setTemplateForm((f) => ({ ...f, body_html: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Dynamic Tags</Label>
                    <div className="border rounded-lg p-3 space-y-1.5 bg-muted/20 max-h-[320px] overflow-y-auto">
                      {placeholders.map((p) => (
                        <TooltipProvider key={p.key}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="w-full text-left text-[11px] px-2 py-1.5 rounded hover:bg-primary/10 transition-colors font-mono text-primary"
                                onClick={() => insertPlaceholder(p.key)}
                              >
                                {`{{ ${p.key} }}`}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs">{p.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs mt-2"
                      onClick={handleLoadDefault}
                    >
                      Load Default Template
                    </Button>
                  </div>
                </div>

                {/* Default flag & actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.is_default}
                      onChange={(e) => setTemplateForm((f) => ({ ...f, is_default: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Set as default for this type</span>
                  </label>
                  <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-2">
                    {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingTemplate ? "Update Template" : "Create Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // ─── Templates List ─────────────────────────────
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Email Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Design reusable email templates with dynamic placeholders
                  </p>
                </div>
                <Button onClick={handleCreateTemplate} className="gap-2">
                  <Plus className="h-4 w-4" /> New Template
                </Button>
              </div>

              {loadingTemplates ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <h4 className="font-medium text-muted-foreground">No Templates Yet</h4>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Create your first email template to start sending professional communications.
                    </p>
                    <Button onClick={handleCreateTemplate} className="mt-4 gap-2" size="sm">
                      <Plus className="h-4 w-4" /> Create Template
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {templates.map((t) => (
                    <Card key={t.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{t.template_name}</h4>
                            <Badge variant="outline" className="text-[10px]">{t.template_type}</Badge>
                            {t.is_default && (
                              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Default</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{t.subject}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ──────────────── LOGS TAB ──────────────── */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Delivery History</h3>
              <p className="text-sm text-muted-foreground">
                Track every email sent from your account ({logsTotal} total)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={loadingLogs}>
              {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
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
                      <TableRow key={log.id} className="group">
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
                              <p className="text-[10px] text-primary font-medium">
                                Template: {log.template_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
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
                          </div>
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
                          {log.sent_at 
                            ? new Date(log.sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                            : new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
