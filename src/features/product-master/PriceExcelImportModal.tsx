"use client";

import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceUploadType, PriceExcelPreviewRow, PriceUploadService } from "@/core/services/product-master.service";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  priceType: PriceUploadType;
  onImported: () => void;
}

type Step = "upload" | "preview" | "done";

export function PriceExcelImportModal({ open, onClose, priceType, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<PriceExcelPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep("upload");
    setRows([]);
    setError("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const preview = await PriceUploadService.excelPreview(priceType, file);
      setRows(preview.rows);
      setStep("preview");
    } catch {
      setError("Could not parse the file. Please ensure it matches the template format.");
    } finally {
      setLoading(false);
    }
  }

  function handleCellEdit(rowIndex: number, field: string, value: string) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        const updated = { ...row, data: { ...row.data, [field]: value } };
        // Clear date_error once user has typed a valid DD-MM-YYYY date
        if (field === "price_date" && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
          updated.date_error = false;
        }
        return updated;
      })
    );
  }

  async function handleImport() {
    setLoading(true);
    setError("");
    try {
      const res = await PriceUploadService.excelImport(priceType, rows);
      setResult(res);
      setStep("done");
      onImported();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const newCount = rows.filter((r) => r.status === "new").length;
  const existingCount = rows.filter((r) => r.status === "existing").length;
  const notInMasterCount = rows.filter((r) => r.status === "not_in_master").length;
  const dateErrorCount = rows.filter((r) => r.date_error).length;
  const columns = rows.length > 0 ? Object.keys(rows[0].data) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-[95vw] max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="capitalize">
            Excel Import — {priceType.replace(/-/g, " ")}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {loading ? "Parsing file..." : "Select Excel File (.xlsx)"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Download the template first to ensure correct column format.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 text-sm shrink-0">
              <span className="text-muted-foreground">{rows.length} rows found</span>
              <Badge variant="default">{newCount} New</Badge>
              <Badge variant="secondary">{existingCount} Existing (will be skipped)</Badge>
              {notInMasterCount > 0 && (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">{notInMasterCount} Not in Product Master (will be skipped)</Badge>
              )}
              {dateErrorCount > 0 && (
                <Badge variant="destructive">{dateErrorCount} Invalid Date (fix before importing)</Badge>
              )}
              <span className="text-xs text-muted-foreground italic">You can edit any cell before importing.</span>
            </div>

            <div className="overflow-auto rounded-md border border-border flex-1 min-h-0 w-full">
              <table className="text-sm border-collapse" style={{ minWidth: `${columns.length * 180 + 100}px` }}>
                <thead className="sticky top-0 bg-muted z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap w-24">Status</th>
                    {columns.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground capitalize whitespace-nowrap" style={{ minWidth: 160 }}>
                        {col.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-t border-border ${
                        row.status === "existing" ? "bg-muted/40" :
                        row.status === "not_in_master" ? "bg-amber-500/10" : ""
                      }`}
                    >
                      <td className="px-3 py-1.5 w-32 whitespace-nowrap">
                        {row.status === "new" && <Badge variant="default" className="text-[10px]">New</Badge>}
                        {row.status === "existing" && <Badge variant="secondary" className="text-[10px]">Existing</Badge>}
                        {row.status === "not_in_master" && (
                          <Badge className="text-[10px] bg-amber-500 text-white hover:bg-amber-500">Not in Master</Badge>
                        )}
                      </td>
                      {columns.map((col) => {
                        const isDateCol = col === "price_date";
                        const hasDateError = isDateCol && row.date_error;
                        return (
                          <td key={col} className="px-1.5 py-1" style={{ minWidth: 160 }}>
                            {row.status === "new" ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={row.data[col] ?? ""}
                                  onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)}
                                  className={`w-full rounded border px-2 py-0.5 text-sm outline-none transition-colors hover:border-border focus:bg-background ${
                                    hasDateError
                                      ? "border-destructive bg-destructive/10 text-destructive focus:border-destructive placeholder:text-destructive/60"
                                      : "border-transparent bg-transparent text-foreground focus:border-primary"
                                  }`}
                                  placeholder={hasDateError ? "Fix: DD-MM-YYYY" : undefined}
                                />
                                {hasDateError && (
                                  <span className="absolute -bottom-4 left-0 text-[10px] text-destructive whitespace-nowrap">
                                    Use DD-MM-YYYY format
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="block px-2 py-0.5 text-muted-foreground truncate" style={{ maxWidth: 200 }}>
                                {row.data[col] ?? ""}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p className="text-sm text-destructive shrink-0">{error}</p>}

            <DialogFooter className="shrink-0 pt-1">
              <Button variant="outline" onClick={reset} disabled={loading}>Back</Button>
              <Button onClick={handleImport} disabled={loading || newCount === 0}>
                {loading ? "Importing..." : `Import ${newCount} New Record${newCount !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 py-4 text-center">
            <div className="text-5xl">✓</div>
            <div>
              <p className="text-lg font-semibold">{result.created} record{result.created !== 1 ? "s" : ""} imported</p>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">{result.skipped} duplicate{result.skipped !== 1 ? "s" : ""} skipped</p>
              )}
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
