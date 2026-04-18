import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About — Significia",
  description:
    "Why we built Significia — a SEBI-compliant, white-label platform for Indian Investment Advisors.",
};

const VALUES = [
  {
    title: "Your data, your responsibility",
    description:
      "We believe IAs should own their client data — not rent access to it. Every architecture decision we made reinforces this belief.",
  },
  {
    title: "SEBI compliance by design",
    description:
      "The regulations aren't a checklist we tick at the end. They shaped the entire architecture. The Bridge model was born from SEBI's requirements, not around them.",
  },
  {
    title: "The advisor's brand, not ours",
    description:
      "Your clients trust you, not Significia. They should never see our name. We are infrastructure — invisible, reliable, and out of the way.",
  },
  {
    title: "No lock-in, ever",
    description:
      "You own the database. You can export, migrate, or delete your data at any time without asking us. That's not just a feature — it's a promise.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-20 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary mb-4">
            About Significia
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Built for advisors who take SEBI seriously
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Significia started from a simple observation: most SaaS platforms for Investment Advisors
            in India put client data in the vendor's database — which is neither SEBI-compliant nor
            something IAs are comfortable with.
          </p>
        </div>

        {/* Origin story */}
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-20">
          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <p>
              SEBI's guidelines for Investment Advisors are clear: you must host your own data,
              maintain your own records, and be able to produce them independently of any third-party.
              A standard SaaS model — where the vendor hosts everything — makes this nearly impossible
              without complex contractual arrangements.
            </p>
            <p>
              We built Significia to solve this properly, not patch it. The Bridge model means every
              IA's database runs on their own server. The Bridge software runs on their server too.
              The database credentials never leave their infrastructure. We send structured queries
              to the Bridge; the Bridge answers from inside the IA's own environment.
            </p>
            <p>
              At the same time, we wanted IAs to have a fully branded, professional portal —
              the kind of product experience that builds client trust. No "powered by Significia"
              watermarks. No shared interfaces. Just bunty.com, looking and feeling exactly how
              Bunty's firm should look.
            </p>
            <p className="font-medium text-foreground">
              The result is a platform that is simultaneously a complete SaaS product and a
              fully client-controlled infrastructure. That tension is what we're proud of.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-8">What we stand for</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((value) => (
              <div key={value.title} className="p-5 rounded-xl border border-border/50 bg-card/30">
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SEBI note */}
        <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex gap-4 mb-16">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm mb-1">SEBI Registered Investment Advisors</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Significia is built specifically for SEBI-registered IAs in India. Our architecture
              is designed to satisfy SEBI's data hosting, record-keeping, and independence requirements
              without requiring you to understand the technical details.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Want to see the platform?</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" asChild>
            <Link href="/contact">
              Book a Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
