"use client";

import { FileText } from "lucide-react";

export default function RegularInvestmentAdvicePage() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
      <FileText className="h-12 w-12 opacity-30" />
      <p className="text-lg font-medium">Regular Investment Advice</p>
      <p className="text-sm">Coming soon</p>
    </div>
  );
}
