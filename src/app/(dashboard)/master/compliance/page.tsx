"use client";

import { SEBIComplianceDashboard } from "@/features/master/compliance/SEBIComplianceDashboard";

export default function CompliancePage() {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6 pb-20 overflow-x-hidden">
      <SEBIComplianceDashboard />
    </div>
  );
}
