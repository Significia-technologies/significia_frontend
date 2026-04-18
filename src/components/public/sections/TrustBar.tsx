import React from "react";
import { Shield, Lock, Paintbrush, Unlink } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: Shield,
    label: "SEBI Compliant",
    description: "Fully aligned with SEBI infrastructure guidelines",
  },
  {
    icon: Lock,
    label: "Data Stays With You",
    description: "Your database lives on your own server",
  },
  {
    icon: Paintbrush,
    label: "Fully White-Labeled",
    description: "Your brand, your domain, your clients",
  },
  {
    icon: Unlink,
    label: "Zero Lock-In",
    description: "Own your data — migrate or export any time",
  },
];

export function TrustBar() {
  return (
    <section className="border-y border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
