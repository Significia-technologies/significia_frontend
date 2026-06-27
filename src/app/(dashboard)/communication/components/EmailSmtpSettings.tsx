"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
} from "lucide-react";
import {
  EmailService,
  type EmailSettings as EmailSettingsType,
} from "@/core/services/email.service";

export function EmailSmtpSettings() {
  const { user } = useAppStore();

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

  useEffect(() => { loadSettings(); }, [loadSettings]);

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
      if (result.success) await loadSettings();
    } catch (err: any) {
      setTestResult({ success: false, message: err?.response?.data?.detail || "Test failed." });
    }
    setTestingEmail(false);
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SMTP Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure your email server to send notifications to clients
          </p>
        </div>
        {settings?.is_verified && (
          <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> SMTP Verified
          </Badge>
        )}
      </div>

      {testResult && (
        <Alert
          className={
            testResult.success
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
              : "bg-red-500/10 border-red-500/30 text-red-700"
          }
        >
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

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpForm.use_tls}
                onChange={(e) =>
                  setSmtpForm((f) => ({ ...f, use_tls: e.target.checked, use_ssl: e.target.checked ? false : f.use_ssl }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Use TLS (STARTTLS)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpForm.use_ssl}
                onChange={(e) =>
                  setSmtpForm((f) => ({ ...f, use_ssl: e.target.checked, use_tls: e.target.checked ? false : f.use_tls }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Use SSL</span>
            </label>
          </div>

          <Separator />

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

      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Gmail:</strong> Host: smtp.gmail.com, Port: 587, TLS: On. Use an{" "}
            <a className="text-primary underline" href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">
              App Password
            </a>.
          </p>
          <p><strong>Outlook / Office 365:</strong> Host: smtp.office365.com, Port: 587, TLS: On.</p>
          <p><strong>SendGrid:</strong> Host: smtp.sendgrid.net, Port: 587, Username: apikey.</p>
          <p><strong>Zoho:</strong> Host: smtp.zoho.in, Port: 465, SSL: On.</p>
        </CardContent>
      </Card>
    </div>
  );
}
