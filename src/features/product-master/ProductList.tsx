"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductType, AnyProduct, ProductMasterService } from "@/core/services/product-master.service";
import { ProductFormModal } from "./ProductFormModal";
import { ReportUploadPanel } from "./ReportUploadPanel";
import { ExcelImportModal } from "./ExcelImportModal";
import { FileText, Download, Plus, Upload } from "lucide-react";
import { CustomCheckbox } from "@/components/ui/CustomCheckbox";

interface Props {
  productType: ProductType;
}

type ColumnDef = {
  key: string;
  label: string;
};

const COLUMNS: Record<ProductType, ColumnDef[]> = {
  "shares": [
    { key: "isin_code", label: "ISIN Code" },
    { key: "symbol", label: "Symbol" },
    { key: "share_name", label: "Share Name" },
  ],
  "mutual-funds": [
    { key: "scheme_code", label: "Scheme Code" },
    { key: "fund_house_name", label: "Fund House" },
    { key: "scheme_name", label: "Scheme Name" },
    { key: "asset_category", label: "Category" },
  ],
  "etfs": [
    { key: "isin_code", label: "ISIN Code" },
    { key: "symbol", label: "Symbol" },
    { key: "etf_name", label: "ETF Name" },
  ],
  "life-insurance": [
    { key: "company_name", label: "Company Name" },
    { key: "policy_name", label: "Policy Name" },
    { key: "policy_type", label: "Policy Type" },
    { key: "uin", label: "UIN" },
  ],
  "health-insurance": [
    { key: "company_name", label: "Company Name" },
    { key: "policy_name", label: "Policy Name" },
    { key: "uin", label: "UIN" },
  ],
};

function getProductLabel(product: AnyProduct, productType: ProductType): string {
  const p = product as any;
  if (productType === "shares" || productType === "etfs") return p.share_name || p.etf_name || p.symbol;
  if (productType === "mutual-funds") return p.scheme_name;
  return `${p.company_name} — ${p.policy_name}`;
}

export function ProductList({ productType }: Props) {
  const [items, setItems] = useState<AnyProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [reportProduct, setReportProduct] = useState<AnyProduct | null>(null);
  const [excelOpen, setExcelOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductMasterService.list(productType, search || undefined);
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // silently fail — user can retry via search
    } finally {
      setLoading(false);
    }
  }, [productType, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleToggle(product: AnyProduct) {
    const id = (product as { id: string }).id;
    setToggling(id);
    try {
      await ProductMasterService.toggle(productType, id);
      fetchItems();
    } finally {
      setToggling(null);
    }
  }

  async function handleDownloadTemplate() {
    await ProductMasterService.downloadExcelTemplate(productType);
  }

  const columns = COLUMNS[productType];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56 text-sm"
        />
        <span className="text-xs text-muted-foreground">{total} records</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExcelOpen(true)} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Excel Import
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-sm text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} className="text-center text-sm text-muted-foreground py-8">
                  No records found.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const p = item as any;
              const id = p.id as string;
              return (
                <TableRow key={id} className={!p.is_active ? "opacity-50" : ""}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className="text-sm">{(p[c.key] as string) ?? ""}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CustomCheckbox
                        checked={!!p.is_active}
                        onChange={() => handleToggle(item)}
                        disabled={toggling === id}
                      />
                      <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setReportProduct(item)} title="Research Reports">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <ProductFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        productType={productType}
        onSaved={fetchItems}
      />
      {reportProduct && (
        <ReportUploadPanel
          open={!!reportProduct}
          onClose={() => setReportProduct(null)}
          productType={productType}
          productId={(reportProduct as { id: string }).id}
          productLabel={getProductLabel(reportProduct, productType)}
        />
      )}
      <ExcelImportModal
        open={excelOpen}
        onClose={() => setExcelOpen(false)}
        productType={productType}
        onImported={fetchItems}
      />
    </div>
  );
}
