"use client";

import React, { useState } from "react";
import {
  FolderOpen, UploadCloud, FileText, Download, Plus, Folder,
  ChevronLeft, ShieldAlert, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MasterDataService, ClientDocumentResponse } from "@/core/services/master.service";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";

interface DocumentVaultProps {
  clientId: string;
  documents: ClientDocumentResponse[];
  onUploadSuccess: () => void;
  readOnly?: boolean;
}

// Categories that are auto-populated — no upload allowed from drawer
const READ_ONLY_CATEGORIES = new Set(["KYC", "Rectification", "Reports"]);

// Categories available for free-form IA uploads
const UPLOAD_CATEGORIES = [
  "Risk Profile",
  "Asset Allocation",
  "Financial Goals",
  "IPS",
  "Compliance",
  "Agreements",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  KYC:                "border-amber-500/30 bg-amber-500/5",
  Rectification:      "border-blue-500/30 bg-blue-500/5",
  Reports:            "border-violet-500/30 bg-violet-500/5",
  "Risk Profile":     "border-emerald-500/30 bg-emerald-500/5",
  "Asset Allocation": "border-teal-500/30 bg-teal-500/5",
  "Financial Goals":  "border-cyan-500/30 bg-cyan-500/5",
  IPS:                "border-indigo-500/30 bg-indigo-500/5",
  Compliance:         "border-orange-500/30 bg-orange-500/5",
  Agreements:         "border-rose-500/30 bg-rose-500/5",
  Other:              "border-primary/20 bg-primary/5",
};

const FOLDER_CATEGORY_ORDER = ["KYC", "Rectification", "Reports", "Risk Profile", "Asset Allocation", "Financial Goals", "IPS", "Compliance", "Agreements", "Other"];

async function downloadViaProxy(filePath: string, docType: string) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const tenantSlug = typeof window !== "undefined" ? localStorage.getItem("simulatedTenantSlug") : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const url = `${baseUrl}/storage/file?key=${encodeURIComponent(filePath)}`;
    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenantSlug ? { "X-Tenant-Slug": tenantSlug } : {}),
      },
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filePath.split("/").pop() || docType;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    toast.error("Failed to download file");
  }
}

export function DocumentVault({ clientId, documents, onUploadSuccess, readOnly = false }: DocumentVaultProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [documentLabel, setDocumentLabel] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoriesMap = documents.reduce((acc, doc) => {
    const cat = doc.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<string, ClientDocumentResponse[]>);

  const availableCategories = FOLDER_CATEGORY_ORDER.filter((c) => categoriesMap[c]);

  const displayDocs = activeCategory ? (categoriesMap[activeCategory] || []) : [];
  const activeCategoryIsReadOnly = activeCategory ? READ_ONLY_CATEGORIES.has(activeCategory) : false;
  const canUpload = !readOnly && (!activeCategory || !activeCategoryIsReadOnly);

  const resetModal = () => {
    setSelectedFile(null);
    setSelectedCategory("");
    setDocumentLabel("");
    setIsModalOpen(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10MB limit."); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedCategory || !documentLabel.trim() || !selectedFile) {
      toast.error("Category, document label, and file are all required.");
      return;
    }
    setLoading(true);
    try {
      await MasterDataService.addDocument(clientId, selectedFile, documentLabel.trim(), selectedCategory);
      toast.success("Document uploaded successfully.");
      resetModal();
      onUploadSuccess();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary/10 pb-4">
        <div className="flex items-center gap-4">
          {activeCategory && (
            <Button variant="ghost" size="icon" onClick={() => setActiveCategory(null)} className="rounded-full h-8 w-8">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              {activeCategory ?? "Document Vault"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCategory
                ? activeCategoryIsReadOnly
                  ? `${displayDocs.length} files · read-only`
                  : `${displayDocs.length} files`
                : "Secure document repository"}
            </p>
          </div>
        </div>

        {canUpload && (
          <Button
            onClick={() => {
              if (activeCategory && !READ_ONLY_CATEGORIES.has(activeCategory)) {
                setSelectedCategory(activeCategory);
              }
              setIsModalOpen(true);
            }}
            className="gap-2 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </Button>
        )}

        {activeCategory && activeCategoryIsReadOnly && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            {activeCategory === "KYC"
              ? "KYC documents are updated via Data Rectification"
              : "Auto-populated — no manual uploads"}
          </div>
        )}
      </div>

      {/* Empty state */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 py-20 bg-primary/5 border border-primary/10 border-dashed rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-bold mb-2">The vault is empty</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            {readOnly ? "No registered documents found." : "Upload documents to get started."}
          </p>
          {!readOnly && (
            <Button variant="outline" onClick={() => setIsModalOpen(true)} className="gap-2 border-primary/20 bg-card">
              <UploadCloud className="w-4 h-4" /> Upload Document
            </Button>
          )}
        </div>
      ) : !activeCategory ? (
        // ── Folder grid ──
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableCategories.map((cat) => {
            const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
            const isRO = READ_ONLY_CATEGORIES.has(cat);
            return (
              <Card
                key={cat}
                className={`cursor-pointer group hover:shadow-md transition-all ${colorClass} border`}
                onClick={() => setActiveCategory(cat)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-background/60 flex items-center justify-center group-hover:bg-background/90 transition-colors">
                      <Folder className="w-6 h-6 text-foreground/60" />
                    </div>
                    <Badge variant="secondary" className="bg-background/60 text-foreground/70 border-0 tabular-nums">
                      {categoriesMap[cat].length} files
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base">{cat}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRO ? "Read-only" : "Upload enabled"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // ── File grid ──
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {displayDocs.map((doc) => (
            <Card
              key={doc.id}
              className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-card/50"
            >
              <CardContent className="p-0">
                <div className="h-24 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative border-b border-primary/5">
                  <FileText className="w-10 h-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadViaProxy(doc.file_path, doc.document_type)}
                      className="gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-card space-y-2">
                  <p className="font-semibold text-sm truncate" title={doc.document_type}>
                    {doc.document_type}
                  </p>
                  {doc.serial_no != null && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <Hash className="w-3 h-3" />
                      DOC-{String(doc.serial_no).padStart(4, "0")}
                      <span className="ml-1 text-[9px] truncate max-w-[80px]" title={doc.id}>
                        {doc.id.slice(0, 8)}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {doc.uploaded_by_name && ` · ${doc.uploaded_by_name}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) resetModal(); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Upload to Vault
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Document Label <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Risk Questionnaire 2025, Goal Statement"
                value={documentLabel}
                onChange={(e) => setDocumentLabel(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Used to identify this document in audit records.
              </p>
            </div>

            <div className="space-y-2">
              <Label>File <span className="text-red-500">*</span></Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-primary/5"
                onClick={() => document.getElementById("vaultFileUpload")?.click()}
              >
                <input
                  id="vaultFileUpload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10MB limit."); e.target.value = ""; return; }
                    setSelectedFile(file);
                  }}
                />
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <FileText className="w-10 h-10 text-primary mb-1" />
                    <p className="font-medium text-sm truncate w-full text-center px-2">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-10 h-10 text-primary/40 mb-2" />
                    <p className="font-medium text-sm text-muted-foreground">Click to browse or drag & drop</p>
                    <p className="text-[11px] text-muted-foreground mt-1">PDF, PNG, JPG (Max 10MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetModal}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={loading || !selectedCategory || !documentLabel.trim() || !selectedFile}
              className="gap-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                : <UploadCloud className="w-4 h-4" />}
              Upload File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
