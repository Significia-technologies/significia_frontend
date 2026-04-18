import React from "react";
import { Download, Database, Rocket } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Database,
    title: "Set up your own database",
    description:
      "You provision a PostgreSQL database on your own server or cloud account (AWS, Azure, GCP). It's your infrastructure — we have no involvement. This is exactly what SEBI requires.",
    note: "SEBI requirement satisfied",
  },
  {
    number: "02",
    icon: Download,
    title: "Install the Significia Bridge",
    description:
      "A lightweight Bridge application runs on your server alongside your database. It holds your database credentials locally — those credentials are never transmitted to Significia. We only know where to ask questions, not how to enter.",
    note: "Your password never leaves your server",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Your portal goes live",
    description:
      "Customize your portal with your logo, colors, and domain. Your clients visit bunty.com (your domain), they see your brand, and their data stays in your house. Significia is completely invisible.",
    note: "Fully live in minutes",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-card/20">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Three steps to your own portal
          </h2>
          <p className="text-muted-foreground text-lg">
            From zero to a fully branded, SEBI-compliant advisory platform — no technical degree required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                  {/* Step indicator */}
                  <div className="relative z-10 flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 mb-6 shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-mono text-primary/60 mb-1">{step.number}</div>
                    <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {step.note}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
