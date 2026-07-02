import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(191,149,63,0.12),transparent_70%)]" />
        <div className="absolute top-0 right-0 h-[400px] w-[400px] bg-primary/6 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] bg-amber-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
          Ready to go live?
        </h2>
        <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
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
            className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link href="/how-it-works">Learn how it works</Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-slate-600">
          The brain for your advisory. The vault stays yours.
        </p>
      </div>
    </section>
  );
}
