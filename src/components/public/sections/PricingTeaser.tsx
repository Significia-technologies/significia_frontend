import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users } from "lucide-react";

const TIERS = [
  {
    name: "Starter",
    clients: "Up to 5 clients",
    description: "Perfect for a solo advisor just getting started.",
    badge: null,
  },
  {
    name: "Growth",
    clients: "Up to 20 clients",
    description: "For growing practices ready to scale their operations.",
    badge: "Most Popular",
  },
  {
    name: "Pro",
    clients: "Up to 100 clients",
    description: "Built for established firms with a full advisory team.",
    badge: null,
  },
  {
    name: "Enterprise",
    clients: "Unlimited clients",
    description: "Custom deployment, SLA guarantees, and white-glove onboarding.",
    badge: "Custom",
  },
];

export function PricingTeaser() {
  return (
    <section className="py-24 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, client-count based pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Pay for the number of clients you serve. No hidden fees. Contact us for exact pricing.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative glass transition-all duration-300 hover:shadow-lg ${
                tier.badge === "Most Popular"
                  ? "border-primary/50 shadow-lg shadow-primary/10"
                  : "hover:border-primary/20"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">
                    {tier.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-6">
                <h3 className="font-bold text-lg">{tier.name}</h3>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-sm text-primary font-medium mb-3">
                  <Users className="h-4 w-4" />
                  {tier.clients}
                </div>
                <p className="text-sm text-muted-foreground leading-snug mb-5">
                  {tier.description}
                </p>
                <Button
                  variant={tier.badge === "Most Popular" ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <Link href="/contact">
                    Get Pricing
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          All plans include SEBI-compliant infrastructure, white-labeling, and the Bridge model.{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            View full pricing details →
          </Link>
        </p>
      </div>
    </section>
  );
}
