import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Users, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Pricing — Significia",
  description:
    "Simple, client-count based pricing for SEBI-registered Investment Advisors.",
};

const TIERS = [
  {
    name: "Starter",
    clients: "Up to 5 clients",
    maxClients: 5,
    description: "Perfect for a solo advisor just getting started or testing the platform.",
    features: [
      "Full white-label portal",
      "Risk profiling & financial planning",
      "SEBI compliance dashboard",
      "Document vault",
      "Email support",
    ],
    popular: false,
    cta: "Get Pricing",
  },
  {
    name: "Growth",
    clients: "Up to 20 clients",
    maxClients: 20,
    description: "For growing practices ready to scale operations and serve more clients.",
    features: [
      "Everything in Starter",
      "Team management (up to 5 staff)",
      "Advanced analytics",
      "Custom risk questionnaires",
      "Priority support",
    ],
    popular: true,
    cta: "Get Pricing",
  },
  {
    name: "Pro",
    clients: "Up to 100 clients",
    maxClients: 100,
    description: "Built for established firms with a full advisory team and high client volume.",
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "Developer API access",
      "Custom report templates",
      "Dedicated account manager",
    ],
    popular: false,
    cta: "Get Pricing",
  },
  {
    name: "Enterprise",
    clients: "Unlimited clients",
    maxClients: null,
    description: "Custom deployment with SLA guarantees, white-glove onboarding, and dedicated support.",
    features: [
      "Everything in Pro",
      "Custom SLA",
      "White-glove onboarding",
      "Custom integrations",
      "On-premise deployment option",
    ],
    popular: false,
    cta: "Contact Us",
  },
];

const ALL_PLANS_INCLUDE = [
  "Full SEBI-compliant Bridge infrastructure",
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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Pay for what you use
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Simple, transparent pricing based on client count. No hidden fees.
            Contact us to get exact pricing for your firm size.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative glass flex flex-col transition-all duration-300 hover:shadow-lg ${
                tier.popular
                  ? "border-primary/50 shadow-xl shadow-primary/10"
                  : "hover:border-primary/20"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3 pt-7">
                <h2 className="text-xl font-bold">{tier.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                  <Users className="h-4 w-4" />
                  {tier.clients}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-5 leading-snug">{tier.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.popular ? "default" : "outline"}
                  className={`w-full mt-auto ${tier.popular ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" : ""}`}
                  asChild
                >
                  <Link href="/contact">
                    {tier.cta}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* All plans include */}
        <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-border/50 bg-card/30">
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

        {/* FAQ nudge */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Have questions about what's right for your firm?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Talk to us →
          </Link>
        </p>
      </div>
    </div>
  );
}
