"use client";

import { useRouter } from "next/navigation";
import { AllAdviceNotesList } from "@/features/investment-advice/AllAdviceNotesList";

export default function TargetInvestmentAdvicePage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      <AllAdviceNotesList
        onCreateNew={() => router.push("/investment-advice/target/new")}
        onSelectNote={(noteId) => router.push(`/investment-advice/target/${noteId}`)}
      />
    </div>
  );
}
