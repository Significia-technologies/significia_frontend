"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PriceUploadType, PriceUploadService } from "@/core/services/product-master.service";

interface Props {
  open: boolean;
  onClose: () => void;
  priceType: PriceUploadType;
  onSaved: () => void;
}

type FormState = Record<string, string>;

const INITIAL: Record<PriceUploadType, FormState> = {
  "share-prices": { isin_code: "", symbol: "", price_date: "", share_price: "" },
  "nav-uploads":  { scheme_code: "", scheme_name: "", price_date: "", nav: "" },
  "etf-prices":   { isin_code: "", symbol: "", price_date: "", etf_price: "" },
};

// ── Date helpers ────────────────────────────────────────────────────

function autoFormatDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function validateDate(dateStr: string): string | null {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return "Enter a complete date in DD-MM-YYYY format.";
  const [dd, mm, yyyy] = dateStr.split("-").map(Number);
  if (mm < 1 || mm > 12) return `Month "${mm}" is invalid — must be 01 to 12.`;
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > daysInMonth) {
    const monthName = new Date(yyyy, mm - 1, 1).toLocaleString("en-IN", { month: "long" });
    return `${monthName} ${yyyy} only has ${daysInMonth} days.`;
  }
  return null;
}

function parseDDMMYYYY(dateStr: string): Date | undefined {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return undefined;
  const [dd, mm, yyyy] = dateStr.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy) return undefined;
  return d;
}

// ── DateField component — text input + calendar popover ─────────────

function DateField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => parseDDMMYYYY(value), [value]);

  function handleCalendarSelect(date: Date | undefined) {
    if (date) {
      onChange(format(date, "dd-MM-yyyy"));
      setOpen(false);
    }
  }

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => onChange(autoFormatDate(e.target.value))}
            placeholder="e.g. 15-01-2025"
            className={error ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent side="bottom" align="end" sideOffset={6} className="w-auto p-0 z-[200]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={new Date().getFullYear() + 5}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Main modal ──────────────────────────────────────────────────────

export function PriceUploadFormModal({ open, onClose, priceType, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL[priceType]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ ...INITIAL[priceType] });
    setError("");
    setDateError(null);
  }, [open, priceType]);

  function handleChange(field: string, raw: string) {
    let val = raw;
    if (field === "isin_code") val = raw.replace(/\D/g, "");
    else if (field === "symbol") val = raw.toUpperCase();
    else if (field === "scheme_code") val = raw.toUpperCase();
    else if (field === "scheme_name") val = raw.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleDateChange(val: string) {
    setForm((prev) => ({ ...prev, price_date: val }));
    // Show inline error only once user has typed a full date
    if (val.length === 10) setDateError(validateDate(val));
    else setDateError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    for (const [k, v] of Object.entries(form)) {
      if (!v.trim()) {
        setError(`Field "${k.replace(/_/g, " ")}" is required.`);
        return;
      }
    }

    const dateValidation = validateDate(form.price_date);
    if (dateValidation) {
      setDateError(dateValidation);
      return;
    }

    setLoading(true);
    try {
      await PriceUploadService.create(priceType, form);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save record.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const title = `Add ${priceType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {priceType === "share-prices" && (
            <>
              <Field label="ISIN Code" required hint="Numeric only">
                <Input value={form.isin_code} onChange={(e) => handleChange("isin_code", e.target.value)} placeholder="e.g. 1234567890" />
              </Field>
              <Field label="Symbol" required hint="Auto uppercase">
                <Input value={form.symbol} onChange={(e) => handleChange("symbol", e.target.value)} placeholder="e.g. RELIANCE" />
              </Field>
              <Field label="Date" required hint="Auto-formats DD-MM-YYYY">
                <DateField value={form.price_date} onChange={handleDateChange} error={dateError} />
              </Field>
              <Field label="Share Price" required>
                <Input type="number" step="any" min="0" value={form.share_price} onChange={(e) => handleChange("share_price", e.target.value)} placeholder="e.g. 2850.50" />
              </Field>
            </>
          )}

          {priceType === "nav-uploads" && (
            <>
              <Field label="Scheme Code" required hint="Auto uppercase">
                <Input value={form.scheme_code} onChange={(e) => handleChange("scheme_code", e.target.value)} placeholder="e.g. 120503" />
              </Field>
              <Field label="Scheme Name" required hint="Auto title case">
                <Input value={form.scheme_name} onChange={(e) => handleChange("scheme_name", e.target.value)} placeholder="e.g. Hdfc Mid-Cap Opportunities Fund" />
              </Field>
              <Field label="Date" required hint="Auto-formats DD-MM-YYYY">
                <DateField value={form.price_date} onChange={handleDateChange} error={dateError} />
              </Field>
              <Field label="NAV" required>
                <Input type="number" step="any" min="0" value={form.nav} onChange={(e) => handleChange("nav", e.target.value)} placeholder="e.g. 145.23" />
              </Field>
            </>
          )}

          {priceType === "etf-prices" && (
            <>
              <Field label="ISIN Code" required hint="Numeric only">
                <Input value={form.isin_code} onChange={(e) => handleChange("isin_code", e.target.value)} placeholder="e.g. 1234567890" />
              </Field>
              <Field label="Symbol" required hint="Auto uppercase">
                <Input value={form.symbol} onChange={(e) => handleChange("symbol", e.target.value)} placeholder="e.g. NIFTYBEES" />
              </Field>
              <Field label="Date" required hint="Auto-formats DD-MM-YYYY">
                <DateField value={form.price_date} onChange={handleDateChange} error={dateError} />
              </Field>
              <Field label="ETF Price" required>
                <Input type="number" step="any" min="0" value={form.etf_price} onChange={(e) => handleChange("etf_price", e.target.value)} placeholder="e.g. 248.75" />
              </Field>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
        {hint && <span className="ml-2 text-xs text-muted-foreground">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}
