import React from "react";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroSection } from "@/components/public/sections/HeroSection";
import { TrustBar } from "@/components/public/sections/TrustBar";
import { FeaturesGrid } from "@/components/public/sections/FeaturesGrid";
import { HowItWorksSection } from "@/components/public/sections/HowItWorksSection";
import { DataPrivacySection } from "@/components/public/sections/DataPrivacySection";
import { ComparisonTable } from "@/components/public/sections/ComparisonTable";
import { PricingTeaser } from "@/components/public/sections/PricingTeaser";
import { CtaSection } from "@/components/public/sections/CtaSection";

export const metadata = {
  title: "Significia — White-Label Platform for Investment Advisors",
  description:
    "A fully SEBI-compliant, white-label SaaS platform for Indian Investment Advisors. Your data stays on your server. Your brand, your clients, your control.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <FeaturesGrid />
        <HowItWorksSection />
        <DataPrivacySection />
        <ComparisonTable />
        <PricingTeaser />
        <CtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
