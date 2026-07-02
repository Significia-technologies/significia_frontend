import React from "react";
import { FileWarning, Clock, DatabaseZap } from "lucide-react";

const PAIN_POINTS = [
  {
    icon: Clock,
    title: "Hours lost to paperwork",
    description:
      "Every risk profile, advice note, and compliance record built by hand, client by client, review after review.",
  },
  {
    icon: DatabaseZap,
    title: "Client data in someone else's hands",
    description:
      "Most advisory software puts your clients' data in the vendor's shared database — out of your control, and a regulatory grey area.",
  },
  {
    icon: FileWarning,
    title: "Compliance as an afterthought",
    description:
      "Audit trails and version history bolted on after the fact, instead of built into how the platform works from day one.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
          The Problem
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Running an advisory shouldn't feel like this
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto mb-16">
          Most Investment Advisors in India are still stitching together spreadsheets,
          Word documents, and third-party SaaS tools — spending more time on admin
          than on advising.
        </p>

        <div className="grid sm:grid-cols-3 gap-6 text-left">
          {PAIN_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="p-6 rounded-xl border border-border/50 bg-card/30">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
