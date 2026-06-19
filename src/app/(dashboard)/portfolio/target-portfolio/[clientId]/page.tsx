"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataService, Client } from "@/core/services/master.service";
import { InvestorMasterService, InvestorMember } from "@/core/services/investor-master.service";
import { TargetPortfolioPage } from "@/features/portfolio/TargetPortfolioPage";
import { toast } from "sonner";

export default function TargetPortfolioClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [members, setMembers] = useState<InvestorMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    Promise.all([
      MasterDataService.getClient(clientId),
      InvestorMasterService.listMembers(clientId, "active"),
    ])
      .then(([clientData, membersData]) => {
        setClient(clientData as unknown as Client);
        setMembers(membersData.members);
      })
      .catch(() => toast.error("Failed to load client data."))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.push("/portfolio/target-portfolio")} className="gap-2 text-xs uppercase font-bold tracking-widest mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to client list
        </Button>
        <p className="text-muted-foreground text-sm">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TargetPortfolioPage
        clientId={client.id}
        clientCode={client.client_code}
        clientName={client.client_name}
        members={members}
      />
    </div>
  );
}
