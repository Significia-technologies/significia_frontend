import React from "react";
import { Check, X } from "lucide-react";

const ROWS = [
  { aspect: "Data location", traditional: "Vendor's shared database", significia: "Your own database, on your server" },
  { aspect: "Credential ownership", traditional: "Vendor holds your DB credentials", significia: "You hold credentials inside the Bridge" },
  { aspect: "Regulatory compliance", traditional: "Uncertain / requires custom work", significia: "Fully compliant by architecture" },
  { aspect: "Data liability", traditional: "Vendor is responsible (and a risk)", significia: "You own and control your data" },
  { aspect: "Access control", traditional: "Vendor controls access", significia: "You have a kill switch" },
  { aspect: "Branding", traditional: "Vendor's brand visible to your clients", significia: "100% your brand, Significia invisible" },
  { aspect: "Data portability", traditional: "Locked in — migration is painful", significia: "Own the DB, migrate any time" },
];

export function ComparisonTable() {
  return (
    <section className="py-24 px-4 bg-card/20">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Why Significia
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Not your typical SaaS
          </h2>
          <p className="text-muted-foreground text-lg">
            Traditional SaaS puts your client data in the vendor's house. Significia puts it in yours.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/50 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-card/80 border-b border-border/50">
            <div className="p-4 text-sm font-medium text-muted-foreground" />
            <div className="p-4 text-center">
              <span className="text-sm font-semibold text-muted-foreground">Traditional SaaS</span>
            </div>
            <div className="p-4 text-center bg-primary/5 border-l border-primary/20">
              <span className="text-sm font-semibold text-primary">Significia</span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.aspect}
              className={`grid grid-cols-3 border-b border-border/30 last:border-b-0 ${
                i % 2 === 0 ? "bg-background/20" : "bg-transparent"
              }`}
            >
              <div className="p-4 text-sm font-medium">{row.aspect}</div>
              <div className="p-4 flex items-start gap-2 text-sm text-muted-foreground">
                <X className="h-4 w-4 text-destructive/70 mt-0.5 shrink-0" />
                {row.traditional}
              </div>
              <div className="p-4 flex items-start gap-2 text-sm bg-primary/5 border-l border-primary/20">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {row.significia}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
