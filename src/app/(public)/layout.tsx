"use client";

import React, { useEffect, useState } from "react";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { DomainNotFound } from "@/components/shared/DomainNotFound";

const ROOT_DOMAINS = ["localhost", "127.0.0.1", "significia.com", "www.significia.com", "app.significia.com"];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checked, setChecked] = useState(false);
  const [blockedOnSubdomain, setBlockedOnSubdomain] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const simulatedSlug = localStorage.getItem("simulatedTenantSlug");
    const hasSimulatedSlug = !!simulatedSlug && simulatedSlug !== "master";
    const isRootDomain = (ROOT_DOMAINS.includes(hostname) || hostname.endsWith(".vercel.app")) && !hasSimulatedSlug;

    setBlockedOnSubdomain(!isRootDomain);
    setChecked(true);
  }, []);

  if (!checked) {
    return null;
  }

  // Marketing pages (features, pricing, about, etc.) only make sense on the
  // root domain — a tenant subdomain has no use for them.
  if (blockedOnSubdomain) {
    return <DomainNotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
