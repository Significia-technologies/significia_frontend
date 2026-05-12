"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ProductType, AnyProduct,
  ASSET_CATEGORIES, LIFE_INSURANCE_POLICY_TYPES,
  ProductMasterService,
} from "@/core/services/product-master.service";

interface Props {
  open: boolean;
  onClose: () => void;
  productType: ProductType;
  editProduct?: AnyProduct | null;
  onSaved: () => void;
}

type FormState = Record<string, string>;

const INITIAL: Record<ProductType, FormState> = {
  "shares":           { isin_code: "", symbol: "", share_name: "" },
  "mutual-funds":     { scheme_code: "", fund_house_name: "", scheme_name: "", asset_category: "" },
  "etfs":             { isin_code: "", symbol: "", etf_name: "" },
  "life-insurance":   { company_name: "", policy_name: "", policy_type: "", uin: "" },
  "health-insurance": { company_name: "", policy_name: "", uin: "" },
};

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
function toUpperCase(s: string) {
  return s.toUpperCase();
}

const TITLE_CASE_FIELDS = ["symbol", "share_name", "etf_name", "scheme_name", "fund_house_name", "asset_category"];
const UPPER_CASE_FIELDS = ["company_name", "policy_name", "uin", "scheme_code"];
const NUMERIC_ONLY_FIELDS = ["isin_code"];

export function ProductFormModal({ open, onClose, productType, editProduct, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL[productType]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editProduct) {
      const base = { ...INITIAL[productType] };
      Object.keys(base).forEach((k) => {
        base[k] = (editProduct as Record<string, unknown>)[k] as string ?? "";
      });
      setForm(base);
    } else {
      setForm({ ...INITIAL[productType] });
    }
    setError("");
  }, [open, editProduct, productType]);

  function handleChange(field: string, raw: string) {
    let val = raw;
    if (TITLE_CASE_FIELDS.includes(field)) val = toTitleCase(raw);
    else if (UPPER_CASE_FIELDS.includes(field)) val = toUpperCase(raw);
    else if (NUMERIC_ONLY_FIELDS.includes(field)) val = raw.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate all fields are filled
    for (const [k, v] of Object.entries(form)) {
      if (!v.trim()) {
        setError(`Field "${k.replace(/_/g, " ")}" is required.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (editProduct) {
        await ProductMasterService.update(productType, (editProduct as { id: string }).id, form);
      } else {
        await ProductMasterService.create(productType, form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save product.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const title = editProduct
    ? `Edit ${productType.replace(/-/g, " ")}`
    : `Add ${productType.replace(/-/g, " ")}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {productType === "shares" && (
            <>
              <Field label="ISIN Code" required hint="Numeric only">
                <Input value={form.isin_code} onChange={(e) => handleChange("isin_code", e.target.value)} placeholder="e.g. 1234567890" />
              </Field>
              <Field label="Symbol" required>
                <Input value={form.symbol} onChange={(e) => handleChange("symbol", e.target.value)} placeholder="e.g. Reliance" />
              </Field>
              <Field label="Share Name" required>
                <Input value={form.share_name} onChange={(e) => handleChange("share_name", e.target.value)} placeholder="e.g. Reliance Industries Limited" />
              </Field>
            </>
          )}

          {productType === "mutual-funds" && (
            <>
              <Field label="Scheme Code" required>
                <Input value={form.scheme_code} onChange={(e) => handleChange("scheme_code", e.target.value)} placeholder="e.g. 120503" />
              </Field>
              <Field label="Fund House Name" required>
                <Input value={form.fund_house_name} onChange={(e) => handleChange("fund_house_name", e.target.value)} placeholder="e.g. Hdfc Amc" />
              </Field>
              <Field label="Scheme Name" required>
                <Input value={form.scheme_name} onChange={(e) => handleChange("scheme_name", e.target.value)} placeholder="e.g. Hdfc Mid-Cap Opportunities Fund" />
              </Field>
              <Field label="Asset Category" required>
                <Select value={form.asset_category} onValueChange={(v) => handleChange("asset_category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {productType === "etfs" && (
            <>
              <Field label="ISIN Code" required hint="Numeric only">
                <Input value={form.isin_code} onChange={(e) => handleChange("isin_code", e.target.value)} placeholder="e.g. 1234567890" />
              </Field>
              <Field label="Symbol" required>
                <Input value={form.symbol} onChange={(e) => handleChange("symbol", e.target.value)} placeholder="e.g. Niftybees" />
              </Field>
              <Field label="ETF Name" required>
                <Input value={form.etf_name} onChange={(e) => handleChange("etf_name", e.target.value)} placeholder="e.g. Nippon India Etf Nifty Bees" />
              </Field>
            </>
          )}

          {productType === "life-insurance" && (
            <>
              <Field label="Company Name" required hint="Auto uppercase">
                <Input value={form.company_name} onChange={(e) => handleChange("company_name", e.target.value)} placeholder="e.g. LIC OF INDIA" />
              </Field>
              <Field label="Policy Name" required hint="Auto uppercase">
                <Input value={form.policy_name} onChange={(e) => handleChange("policy_name", e.target.value)} placeholder="e.g. JEEVAN ANAND" />
              </Field>
              <Field label="Policy Type" required>
                <Select value={form.policy_type} onValueChange={(v) => handleChange("policy_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select policy type" /></SelectTrigger>
                  <SelectContent>
                    {LIFE_INSURANCE_POLICY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="UIN" required hint="Alphanumeric, auto uppercase">
                <Input value={form.uin} onChange={(e) => handleChange("uin", e.target.value)} placeholder="e.g. 101L048V03" />
              </Field>
            </>
          )}

          {productType === "health-insurance" && (
            <>
              <Field label="Company Name" required hint="Auto uppercase">
                <Input value={form.company_name} onChange={(e) => handleChange("company_name", e.target.value)} placeholder="e.g. STAR HEALTH" />
              </Field>
              <Field label="Policy Name" required hint="Auto uppercase">
                <Input value={form.policy_name} onChange={(e) => handleChange("policy_name", e.target.value)} placeholder="e.g. FAMILY HEALTH OPTIMA" />
              </Field>
              <Field label="UIN" required hint="Alphanumeric, auto uppercase">
                <Input value={form.uin} onChange={(e) => handleChange("uin", e.target.value)} placeholder="e.g. SHAHLGP23001V012223" />
              </Field>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : editProduct ? "Update" : "Add"}</Button>
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
