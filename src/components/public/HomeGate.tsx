"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroSection } from "@/components/public/sections/HeroSection";
import { ProblemSection } from "@/components/public/sections/ProblemSection";
import { FeaturesGrid } from "@/components/public/sections/FeaturesGrid";
import { HowItWorksSection } from "@/components/public/sections/HowItWorksSection";
import { TrustBar } from "@/components/public/sections/TrustBar";
import { ComparisonTable } from "@/components/public/sections/ComparisonTable";
import { DataPrivacySection } from "@/components/public/sections/DataPrivacySection";
import { PricingTeaser } from "@/components/public/sections/PricingTeaser";
import { CtaSection } from "@/components/public/sections/CtaSection";

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <FeaturesGrid />
        <HowItWorksSection />
        <TrustBar />
        <ComparisonTable />
        <DataPrivacySection />
        <PricingTeaser />
        <CtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
