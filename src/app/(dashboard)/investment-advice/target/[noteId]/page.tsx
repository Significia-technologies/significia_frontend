"use client";

import { useParams, useRouter } from "next/navigation";
import { AdviceNoteDetail } from "@/features/investment-advice/AdviceNoteDetail";

export default function TargetAdviceNoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const router = useRouter();

  const handleBack = () => router.push("/investment-advice/target");

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6">
      <AdviceNoteDetail noteId={noteId} onBack={handleBack} />
    </div>
  );
}
