"use client";

import React, { useEffect } from "react";
import ClientRegistrationForm from "@/features/master/ClientRegistration";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";

/**
 * New Client Page — Bridge Architecture
 * No connector lookup needed. The Bridge handles DB access server-side.
 */
export default function NewClientPage() {
  const { user } = useAppStore();
  const router = useRouter();

  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const canCreateClient = isIAOwner || isIAPartner || isSuperAdmin || 
    !!user?.permissions?.find((p: any) => p.module === "Clients")?.can_create;

  useEffect(() => {
    if (user && !canCreateClient) {
      router.replace("/clients");
    }
  }, [user, canCreateClient, router]);

  if (!user || !canCreateClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <ClientRegistrationForm />;
}
