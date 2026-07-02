import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Pricing — Significia",
  description:
    "Pricing tailored to your firm — request a quote for Investment Advisors.",
};

const ALL_PLANS_INCLUDE = [
  "Full Bridge infrastructure",
  "Your own database — no shared data",
  "Your own file storage (S3/GCS)",
  "Complete white-labeling",
  "Kill switch (instant access revocation)",
  "SSL certificate auto-provisioned",
  "Audit trails & compliance logs",
];

export default function PricingPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Pricing built around your firm
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We haven't gone one-size-fits-all with pricing — every advisory practice is different.
            Tell us about your firm and we'll put together a plan that fits.
          </p>
        </div>

        {/* Every plan includes */}
        <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-border/50 bg-card/30 mb-10">
          <h2 className="text-lg font-bold mb-6 text-center">Every plan includes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ALL_PLANS_INCLUDE.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm">
                <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" asChild>
            <Link href="/contact">
              Request Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Have questions about what's right for your firm?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Talk to us →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
