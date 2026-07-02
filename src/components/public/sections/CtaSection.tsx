import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[700px] bg-primary/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
          Ready to go live?
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
          Join Investment Advisors who run their practice on a platform
          where their data truly stays theirs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95"
            asChild
          >
            <Link href="/contact">
              Book a Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base"
            asChild
          >
            <Link href="/how-it-works">Learn how it works</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground/70">
          The brain for your advisory. The vault stays yours.
        </p>
      </div>
    </section>
  );
}
