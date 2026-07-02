import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Palette, Database } from "lucide-react";

const INCLUDED = [
  { icon: Database, label: "Your own database and storage" },
  { icon: Palette, label: "Complete white-labeling" },
  { icon: ShieldCheck, label: "Compliance-ready infrastructure" },
];

export function PricingTeaser() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/40 glass p-10 sm:p-14 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(191,149,63,0.10),transparent_70%)] pointer-events-none" />

          <div className="relative z-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Pricing built around your firm
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              We tailor pricing to the size and needs of your advisory practice.
              Tell us about your firm and we'll get back to you with a plan that fits.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
              {INCLUDED.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {item.label}
                  </div>
                );
              })}
            </div>

            <Button
              size="lg"
              className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
              asChild
            >
              <Link href="/contact">
                Request Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
