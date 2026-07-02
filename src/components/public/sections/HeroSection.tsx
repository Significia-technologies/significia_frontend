"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";

const STATS = [
  { value: "Bridge Model", label: "DB isolated on your server" },
  { value: "White-Label", label: "Your brand, zero Significia branding" },
  { value: "Compliance-Ready", label: "Built into the architecture" },
];

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-background px-4 pt-[120px] pb-24">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Central glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[900px] bg-primary/12 blur-[160px] rounded-full animate-glow-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Announcement pill */}
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary/90 hover:bg-primary/15 hover:border-primary/40 transition-all duration-200 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Now accepting early-access advisors</span>
          <ChevronRight className="h-3 w-3 opacity-60" />
        </Link>

        {/* Headline */}
        <h1 className="text-[44px] sm:text-[58px] lg:text-[68px] font-semibold tracking-tight text-foreground leading-[1.08] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
          Your advisory, finally
          <br />
          running like{" "}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-primary to-amber-500">
              a real business
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-[17px] sm:text-[18px] text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
          Significia gives every Investment Advisor a fully white-labeled client
          portal — powered by the Bridge model so your database runs on{" "}
          <span className="text-foreground font-medium">your infrastructure</span>, not ours.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/45 transition-all duration-200 hover:-translate-y-px"
          >
            Request a Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-6 py-3 text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-card hover:border-primary/30 transition-all duration-200"
          >
            How the Bridge works
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 animate-in fade-in duration-700 delay-500 fill-mode-both">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <div className="text-center">
                <div className="text-[15px] font-semibold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden sm:block h-8 w-px bg-border" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
