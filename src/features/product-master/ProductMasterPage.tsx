"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductList } from "./ProductList";
import { ProductType } from "@/core/services/product-master.service";

const TABS: { value: ProductType; label: string }[] = [
  { value: "shares", label: "Shares" },
  { value: "mutual-funds", label: "Mutual Funds" },
  { value: "etfs", label: "ETFs" },
  { value: "life-insurance", label: "Life Insurance" },
  { value: "health-insurance", label: "Health Insurance" },
];

export function ProductMasterPage() {
  const [activeTab, setActiveTab] = useState<ProductType>("shares");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Master</h1>
        <p className="text-sm text-muted-foreground">
          Manage your investment products and insurance policies across all categories.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProductType)}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="shrink-0">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <ProductList productType={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
