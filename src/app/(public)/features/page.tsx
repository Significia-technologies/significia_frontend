import React from "react";
import {
  BarChart3, Target, ShieldCheck, Palette, Users, FolderOpen,
  FileText, Sliders, ClipboardList, AlertTriangle, Settings2, Key,
  TrendingUp, Archive,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Features — Significia",
  description: "A full breakdown of every module in the Significia platform for Investment Advisors.",
};

const FEATURE_GROUPS = [
  {
    group: "Client Management",
    description: "Everything you need to onboard, manage, and serve clients.",
    features: [
      {
        icon: Users,
        title: "Client Registry",
        description:
          "Full client profiles with personal details, KYC documents, relationship history, and version tracking. Every change is logged for compliance.",
      },
      {
        icon: ClipboardList,
        title: "Client Self-Service Portal",
        description:
          "Clients log in to their own portal (under your brand) to view their risk profile, financial plan, and generated reports.",
      },
      {
        icon: FolderOpen,
        title: "Document Vault",
        description:
          "All certificates, signed reports, disclosures, and client documents stored securely in your own cloud storage bucket.",
      },
    ],
  },
  {
    group: "Risk & Planning",
    description: "Tools to assess, plan, and document your advisory work.",
    features: [
      {
        icon: BarChart3,
        title: "Risk Profiling Engine",
        description:
          "Build custom questionnaires, auto-score responses, and generate risk profiles. Full version history and comparison across assessments.",
      },
      {
        icon: Sliders,
        title: "Asset Allocation",
        description:
          "Slider-based allocation tool with history tracking. Set target allocations and track drift over time.",
      },
      {
        icon: TrendingUp,
        title: "Portfolio Tracking",
        description:
          "Track client portfolios with a security basket built for the Indian market, alongside performance over time.",
      },
      {
        icon: Target,
        title: "Financial Goals",
        description:
          "Goal-based planning that connects client objectives to asset recommendations. Track progress toward each goal.",
      },
      {
        icon: FileText,
        title: "Financial Analysis",
        description:
          "Comprehensive analysis forms with data rectification workflows. Supports portfolio, cashflow, and scenario modelling.",
      },
    ],
  },
  {
    group: "Compliance & Audit",
    description: "Stay audit-ready without manual effort.",
    features: [
      {
        icon: ShieldCheck,
        title: "Compliance Dashboard",
        description:
          "One-stop view of audit trails, version history, lock management, and compliance status across all clients.",
      },
      {
        icon: AlertTriangle,
        title: "Audit Trail",
        description:
          "Every action on every client record is logged with timestamp, user, and change detail. Full transparency for regulators.",
      },
      {
        icon: ClipboardList,
        title: "Compliance Report Generation",
        description:
          "Automatically generate regulator-ready reports with your digital signature and firm details applied.",
      },
      {
        icon: Archive,
        title: "Document Drawers",
        description:
          "Organized storage for certificates, signatures, and firm documents — kept ready for whenever you need them.",
      },
    ],
  },
  {
    group: "White-Label & Team",
    description: "Your brand. Your team. Your platform.",
    features: [
      {
        icon: Palette,
        title: "Full White-Labeling",
        description:
          "Your logo, colors, firm name, and custom domain. Clients only ever see your brand — Significia is completely invisible.",
      },
      {
        icon: Users,
        title: "Team Management",
        description:
          "Invite advisors and staff, assign roles (IA Master, Employee, Read-Only), and control per-user permissions.",
      },
      {
        icon: Settings2,
        title: "Developer Settings",
        description:
          "API key management for programmatic integrations. Build custom workflows on top of your Significia portal.",
      },
      {
        icon: Key,
        title: "Bridge Status & Control",
        description:
          "Real-time visibility into your Bridge connection. Kill switch available at any time to instantly cut all access.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            Platform Features
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Every tool your advisory needs
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A complete operating system for Investment Advisors — from client onboarding
            to compliance reports, all under your brand.
          </p>
        </div>

        {/* Feature groups */}
        <div className="space-y-20">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.group}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">{group.group}</h2>
                <p className="text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} className="glass hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
