"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

const DATE_REGEX = /^\d{2}-\d{2}-\d{4}$/;

export function PriceUploadFormModal({ open, onClose, priceType, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL[priceType]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ ...INITIAL[priceType] });
    setError("");
  }, [open, priceType]);

  function handleChange(field: string, raw: string) {
    let val = raw;
    if (field === "isin_code") val = raw.replace(/\D/g, "");
    else if (field === "symbol") val = raw.toUpperCase();
    else if (field === "scheme_code") val = raw.toUpperCase();
    else if (field === "scheme_name") val = raw.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    setForm((prev) => ({ ...prev, [field]: val }));
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

    if (!DATE_REGEX.test(form.price_date)) {
      setError("Date must be in DD-MM-YYYY format (e.g. 15-01-2025).");
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
              <Field label="Date" required hint="DD-MM-YYYY">
                <Input value={form.price_date} onChange={(e) => handleChange("price_date", e.target.value)} placeholder="e.g. 15-01-2025" maxLength={10} />
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
              <Field label="Date" required hint="DD-MM-YYYY">
                <Input value={form.price_date} onChange={(e) => handleChange("price_date", e.target.value)} placeholder="e.g. 15-01-2025" maxLength={10} />
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
              <Field label="Date" required hint="DD-MM-YYYY">
                <Input value={form.price_date} onChange={(e) => handleChange("price_date", e.target.value)} placeholder="e.g. 15-01-2025" maxLength={10} />
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
