"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductType, ResearchReport, ProductMasterService } from "@/core/services/product-master.service";
import { FileText, Upload, ExternalLink } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  open: boolean;
  onClose: () => void;
  productType: ProductType;
  productId: string;
  productLabel: string;
}

const BATCH_LIMITS: Record<ProductType, number> = {
  "shares": 5,
  "mutual-funds": 5,
  "etfs": 5,
  "life-insurance": 5,
  "health-insurance": 2,
};

export function ReportUploadPanel({ open, onClose, productType, productId, productLabel }: Props) {
  const { user } = useAppStore();
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchReports();
  }, [open, productId]);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await ProductMasterService.listReports(productType, productId);
      setReports(res.reports);
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const limit = BATCH_LIMITS[productType];
    if (files.length > limit) {
      setError(`Maximum ${limit} files per upload batch.`);
      return;
    }
    setError("");
    setSuccess("");
    setUploading(true);
    try {
      const uploaderName = user?.name || user?.email || undefined;
      const res = await ProductMasterService.uploadReports(productType, productId, files, uploaderName);
      setSuccess(`${res.uploaded} file(s) uploaded successfully.`);
      fetchReports();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(report: ResearchReport) {
    try {
      const res = await ProductMasterService.getReportDownloadUrl(report.id);
      window.open(res.download_url, "_blank");
    } catch {
      alert("Could not generate download link.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Research Reports — {productLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : `Upload Reports (max ${BATCH_LIMITS[productType]} per batch)`}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint, or plain text</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          {/* Report history */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Report History ({reports.length} files)</p>
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!loading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No reports uploaded yet.</p>
            )}
            {reports.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-all leading-snug">{r.original_filename}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.uploaded_by_name || r.uploaded_by || "Unknown"} &bull;{" "}
                      {new Date(r.uploaded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDownload(r)} className="shrink-0 gap-1 mt-0.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
