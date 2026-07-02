import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Rocket, ArrowRight, Lock, Eye, Power } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "How It Works — Significia",
  description:
    "Understand the Significia Bridge model — how your data stays on your server while we power your portal.",
};

const ONBOARDING_STEPS = [
  {
    number: "01",
    icon: Database,
    title: "Significia creates your tenant",
    who: "Significia team",
    description:
      "Our team provisions your account on the platform. You receive a Bridge Registration Token — a one-time code that will allow your Bridge to identify itself.",
  },
  {
    number: "02",
    icon: Database,
    title: "You set up your own database",
    who: "You (or your IT team)",
    description:
      "You provision a PostgreSQL database on your own server or cloud account (AWS RDS, Azure Database, GCP Cloud SQL, etc.). This is your infrastructure — we have no involvement in this step. Indian advisory regulations require this.",
  },
  {
    number: "03",
    icon: Database,
    title: "You set up your own file storage",
    who: "You (or your IT team)",
    description:
      "Create a cloud storage bucket (AWS S3, Google Cloud Storage, etc.) on your own account. All client documents, PDFs, and reports will be stored here — in your house.",
  },
  {
    number: "04",
    icon: Download,
    title: "Install the Significia Bridge",
    who: "You (one command)",
    description:
      "Run one Docker command (or use our Windows/Linux installer) to install the Bridge on your server. During setup, provide your database credentials and storage credentials. These are stored locally — never sent to us.",
  },
  {
    number: "05",
    icon: ArrowRight,
    title: "Bridge registers with Significia",
    who: "Automatic",
    description:
      "The Bridge sends a one-time \"I am ready\" signal to Significia. It provides its public URL and your registration token. Significia stores only: where to send questions. It does not know how to enter your database.",
  },
  {
    number: "06",
    icon: Rocket,
    title: "Your portal goes live",
    who: "You",
    description:
      "Customize your portal: upload your logo, set your brand color, configure your custom domain. Your clients visit bunty.com (your domain), they see your brand, and their data stays in your database.",
  },
];

const DAILY_FLOW_STEPS = [
  { label: "Bunty clicks 'Generate Risk Report'", detail: "bunty.com browser action" },
  { label: "Significia Backend receives the request", detail: "Identifies tenant from domain" },
  { label: "Backend sends query to Bridge", detail: "HTTPS encrypted, to Bridge URL only" },
  { label: "Bridge validates and queries local DB", detail: "Pre-approved query types only" },
  { label: "Bridge returns only the result", detail: "No raw DB access, no credentials" },
  { label: "Backend formats the result into a PDF", detail: "Processed in RAM, never stored" },
  { label: "PDF saved to your own S3 bucket", detail: "Bunty's cloud storage" },
  { label: "Browser downloads from your storage", detail: "Request ends. Significia forgets everything." },
];

export default function HowItWorksPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            The Bridge Model
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            How Significia works
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Your data lives in your house. We send questions to your Bridge. Your Bridge answers
            from inside your house. We never have a copy of your key.
          </p>
        </div>

        {/* Onboarding flow */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-2">Onboarding in 6 steps</h2>
          <p className="text-muted-foreground mb-10">From zero to a live, branded portal.</p>
          <div className="space-y-6">
            {ONBOARDING_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{step.number}</span>
                    </div>
                    {index < ONBOARDING_STEPS.length - 1 && (
                      <div className="flex-1 w-px bg-border/50 mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{step.title}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {step.who}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily request flow */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-2">What happens on every request</h2>
          <p className="text-muted-foreground mb-10">
            When Bunty clicks "Generate Risk Report for Client X" — here is exactly what happens:
          </p>
          <div className="space-y-2">
            {DAILY_FLOW_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30"
              >
                <span className="text-xs font-mono text-primary/60 pt-0.5 shrink-0 w-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              At no point does Significia: directly connect to your database, know your DB password,
              store the report in Significia's own storage, or retain any client data after the request ends.
            </p>
          </div>
        </div>

        {/* Security guarantees */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-8">Your security guarantees</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Query allowlist",
                description:
                  "The Bridge only answers pre-approved query types. No bulk exports. No unauthorized access patterns.",
              },
              {
                icon: Eye,
                title: "Full query log",
                description:
                  "Every request and response is logged on your own server. You have complete auditability — we have none of it.",
              },
              {
                icon: Power,
                title: "Kill switch",
                description:
                  "Stop the Bridge at any time — instantly cutting Significia's access to your data. No delay, no process.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-5 rounded-xl border border-border/50 bg-card/30">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Ready to see the Bridge in action?
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" asChild>
            <Link href="/contact">Book a Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
