"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriceUploadType, AnyPriceRecord, PriceUploadService } from "@/core/services/product-master.service";
import { PriceExcelImportModal } from "./PriceExcelImportModal";
import { CustomCheckbox } from "@/components/ui/CustomCheckbox";
import { Download, Upload } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface Props {
  priceType: PriceUploadType;
}

type ColumnDef = { key: string; label: string };

const COLUMNS: Record<PriceUploadType, ColumnDef[]> = {
  "share-prices": [
    { key: "isin_code",   label: "ISIN Code" },
    { key: "symbol",      label: "Symbol" },
    { key: "price_date",  label: "Date" },
    { key: "share_price", label: "Share Price" },
  ],
  "nav-uploads": [
    { key: "scheme_code", label: "Scheme Code" },
    { key: "scheme_name", label: "Scheme Name" },
    { key: "price_date",  label: "Date" },
    { key: "nav",         label: "NAV" },
  ],
  "etf-prices": [
    { key: "isin_code",  label: "ISIN Code" },
    { key: "symbol",     label: "Symbol" },
    { key: "price_date", label: "Date" },
    { key: "etf_price",  label: "ETF Price" },
  ],
  "ulip-nav-uploads": [
    { key: "uin",         label: "UIN" },
    { key: "policy_name", label: "Policy Name" },
    { key: "policy_type", label: "Policy Type" },
    { key: "price_date",  label: "Date" },
    { key: "nav",         label: "NAV" },
  ],
};

const formatToDDMMYYYY = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-"); // yyyy-mm-dd
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`; // dd-mm-yyyy
};

export function PriceUploadList({ priceType }: Props) {
  const [items, setItems] = useState<AnyPriceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [excelOpen, setExcelOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const formattedFrom = formatToDDMMYYYY(fromDate);
      const formattedTo = formatToDDMMYYYY(toDate);
      const res = await PriceUploadService.list(
        priceType,
        search || undefined,
        formattedFrom || undefined,
        formattedTo || undefined
      );
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [priceType, search, fromDate, toDate]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleToggle(item: AnyPriceRecord) {
    const id = (item as { id: string }).id;
    setToggling(id);
    try {
      await PriceUploadService.toggle(priceType, id);
      fetchItems();
    } finally {
      setToggling(null);
    }
  }

  async function handleDownloadTemplate() {
    await PriceUploadService.downloadExcelTemplate(priceType);
  }

  const columns = COLUMNS[priceType];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48 text-sm"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{total} records</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From:</span>
          <DatePicker
            date={fromDate}
            onChange={setFromDate}
            placeholder="DD-MM-YYYY"
            className="w-36 [&_button]:h-8 [&_button]:text-xs [&_button_svg]:h-3.5 [&_button_svg]:w-3.5"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To:</span>
          <DatePicker
            date={toDate}
            onChange={setToDate}
            placeholder="DD-MM-YYYY"
            className="w-36 [&_button]:h-8 [&_button]:text-xs [&_button_svg]:h-3.5 [&_button_svg]:w-3.5"
          />
        </div>

        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => setExcelOpen(true)} className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Excel Import
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-8">
                  No records found.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => {
              const p = item as unknown as Record<string, unknown>;
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <PriceExcelImportModal
        open={excelOpen}
        onClose={() => setExcelOpen(false)}
        priceType={priceType}
        onImported={fetchItems}
      />
    </div>
  );
}
