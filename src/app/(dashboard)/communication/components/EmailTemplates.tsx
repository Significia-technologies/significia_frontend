"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Save,
  FileText,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  EmailService,
  type EmailTemplate,
  type Placeholder,
} from "@/core/services/email.service";

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
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

  useEffect(() => {
    loadTemplates();
    loadPlaceholders();
  }, [loadTemplates, loadPlaceholders]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setTemplateForm({ template_name: "", template_type: "REPORT_DELIVERY", subject: "", body_html: "", is_default: false });
    setShowEditor(true);
  };

  const handleEdit = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      template_name: t.template_name,
      template_type: t.template_type,
      subject: t.subject,
      body_html: t.body_html,
      is_default: t.is_default,
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await EmailService.updateTemplate(editingTemplate.id, templateForm);
      } else {
        await EmailService.createTemplate(templateForm);
      }
      setShowEditor(false);
      loadTemplates();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to save template.");
    }
    setSavingTemplate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await EmailService.deleteTemplate(id);
      loadTemplates();
    } catch { /* ignore */ }
  };

  const handleLoadDefault = async () => {
    try {
      const data = await EmailService.getDefaultTemplate(templateForm.template_type);
      setTemplateForm((prev) => ({ ...prev, subject: data.subject, body_html: data.body_html }));
    } catch { /* ignore */ }
  };

  const insertPlaceholder = (key: string) => {
    setTemplateForm((prev) => ({ ...prev, body_html: prev.body_html + `{{ ${key} }}` }));
  };

  if (showEditor) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {editingTemplate ? "Edit Template" : "Create Template"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
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
                  <SelectItem value="REPORT_DELIVERY">Report Delivery (Generic)</SelectItem>
                  <SelectItem value="FINANCIAL_ANALYSIS_DELIVERY">Financial Analysis Delivery</SelectItem>
                  <SelectItem value="RISK_PROFILE_DELIVERY">Risk Profile Delivery</SelectItem>
                  <SelectItem value="ASSET_ALLOCATION_DELIVERY">Asset Allocation Delivery</SelectItem>
                  <SelectItem value="GOAL_PLAN_DELIVERY">Goal Plan Delivery</SelectItem>
                  <SelectItem value="WELCOME_CLIENT">Welcome Client</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              placeholder="e.g. {{ report_type }} Report for {{ client_name }}"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </div>

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
              <Button variant="outline" size="sm" className="w-full text-xs mt-2" onClick={handleLoadDefault}>
                Load Default Template
              </Button>
            </div>
          </div>

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
            <Button onClick={handleSave} disabled={savingTemplate} className="gap-2">
              {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">
            Design reusable email templates with dynamic placeholders
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
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
            <Button onClick={handleCreate} className="mt-4 gap-2" size="sm">
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
                    <Badge className="text-[10px] bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent">
                      {t.version || "v1.0"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-muted/20">
                      ID: {t.audit_id || "------"}
                    </Badge>
                    {t.is_default && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Default</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-xl">{t.subject}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
