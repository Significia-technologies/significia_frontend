import React from "react";
import {
  BarChart3,
  Target,
  ShieldCheck,
  Palette,
  Users,
  FolderOpen,
  TrendingUp,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Risk Profiling",
    description:
      "Dynamic questionnaires, automated scoring, and full audit history. Build custom risk profiles that match your advisory style.",
    highlight: "Fully customizable",
  },
  {
    icon: Target,
    title: "Financial Planning",
    description:
      "Goal-based planning tools with asset allocation, portfolio analysis, and scenario modelling — all in one place.",
    highlight: "Goal-based",
  },
  {
    icon: TrendingUp,
    title: "Portfolio Tracking",
    description:
      "Track client portfolios and asset allocation drift over time, with a security basket built for the Indian market.",
    highlight: "Always up to date",
  },
  {
    icon: ShieldCheck,
    title: "Regulatory Compliance",
    description:
      "Audit trails, version history, lock management, and auto-generated compliance reports. Stay audit-ready always.",
    highlight: "Always audit-ready",
  },
  {
    icon: Palette,
    title: "White-Label Portal",
    description:
      "Your logo, your colors, your domain. Clients only ever see your brand — Significia is completely invisible.",
    highlight: "100% your brand",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Onboard advisors, assign roles, and control permissions. Every team member sees exactly what they need.",
    highlight: "Role-based access",
  },
  {
    icon: FolderOpen,
    title: "Document Vault",
    description:
      "Client certificates, signed reports, and disclosures — securely stored in your own cloud storage bucket.",
    highlight: "Stored in your vault",
  },
  {
    icon: FileCheck2,
    title: "Audit Log",
    description:
      "Every change to every client record is logged with full version history — ready to produce whenever you need it.",
    highlight: "Full transparency",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything your advisory needs
          </h2>
          <p className="text-muted-foreground text-lg">
            A complete operating system for Investment Advisors — from client onboarding to compliance reports.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="glass group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                    {feature.highlight}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
