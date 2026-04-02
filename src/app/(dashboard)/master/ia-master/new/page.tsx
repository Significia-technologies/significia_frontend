"use client";

import React, { useEffect, useState } from "react";
import { IAMasterForm } from "@/features/master/IAMasterForm";
import { Skeleton } from "@/components/ui/skeleton";
import { IAMaster, IAMasterService } from "@/core/services/ia-master.service";

/**
 * IA Master Profile Page — Bridge Architecture
 * No connector gate needed — Bridge handles DB access transparently.
 */
export default function NewIAMasterPage() {
  const [initialData, setInitialData] = useState<IAMaster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    IAMasterService.getLatest()
      .then((data) => {
        if (data) setInitialData(data);
      })
      .catch(() => {
        // 404 = no existing data, first time setup
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  return <IAMasterForm initialData={initialData} />;
}
