"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductList } from "./ProductList";
import { PriceUploadList } from "./PriceUploadList";
import { ProductType, PriceUploadType } from "@/core/services/product-master.service";

type AnyTabType = ProductType | PriceUploadType;

const PRODUCT_TABS: { value: ProductType; label: string }[] = [
  { value: "shares",           label: "Shares" },
  { value: "mutual-funds",     label: "Mutual Funds" },
  { value: "etfs",             label: "ETFs" },
  { value: "life-insurance",   label: "Life Insurance" },
  { value: "health-insurance", label: "Health Insurance" },
];

const PRICE_TABS: { value: PriceUploadType; label: string }[] = [
  { value: "share-prices", label: "Share Price Upload" },
  { value: "nav-uploads",  label: "NAV Upload" },
  { value: "etf-prices",   label: "ETF Price Upload" },
];

const PRICE_TYPE_SET = new Set<string>(PRICE_TABS.map((t) => t.value));

export function ProductMasterPage() {
  const [activeTab, setActiveTab] = useState<AnyTabType>("shares");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Master</h1>
        <p className="text-sm text-muted-foreground">
          Manage your investment products, insurance policies, and daily price data.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnyTabType)}>
        <TabsList className="w-full justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {PRODUCT_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="shrink-0">
              {t.label}
            </TabsTrigger>
          ))}
          {PRICE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="shrink-0">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PRODUCT_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <ProductList productType={t.value} />
          </TabsContent>
        ))}

        {PRICE_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <PriceUploadList priceType={t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export { PRICE_TYPE_SET };
