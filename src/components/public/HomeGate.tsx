"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MaintenanceMode } from "@/components/public/MaintenanceMode";

/**
 * "/" is the marketing homepage only on the root domain. On a tenant
 * subdomain (or when simulating one locally) it redirects to /dashboard,
 * whose own auth gate sends unauthenticated visitors to /login.
 */
export function HomeGate() {
  const router = useRouter();
  const [isRootDomain, setIsRootDomain] = useState<boolean | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const rootDomains = ["localhost", "127.0.0.1", "significia.com", "www.significia.com", "app.significia.com"];
    const simulatedSlug = localStorage.getItem("simulatedTenantSlug");
    const hasSimulatedSlug = !!simulatedSlug && simulatedSlug !== "master";
    const onRoot = (rootDomains.includes(hostname) || hostname.endsWith(".vercel.app")) && !hasSimulatedSlug;

    setIsRootDomain(onRoot);
    if (!onRoot) {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!isRootDomain) {
    return null;
  }

  return <MaintenanceMode />;
}
