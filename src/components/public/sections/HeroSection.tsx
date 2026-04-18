"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";

const STATS = [
  { value: "Bridge Model", label: "DB isolated on your server" },
  { value: "White-Label", label: "Your brand, zero Significia branding" },
  { value: "SEBI-Ready", label: "Compliance built into the architecture" },
];

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[#030712] px-4 pt-[120px] pb-0">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Central glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[900px] bg-primary/12 blur-[160px] rounded-full" />
        {/* Top edge line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Announcement pill */}
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary/90 hover:bg-primary/15 hover:border-primary/40 transition-all duration-200 mb-8"
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>Now accepting early-access advisors</span>
          <ChevronRight className="h-3 w-3 opacity-60" />
        </Link>

        {/* Headline */}
        <h1 className="text-[44px] sm:text-[58px] lg:text-[68px] font-semibold tracking-tight text-white leading-[1.08] mb-6">
          The complete platform
          <br />
          for{" "}
          <span className="relative">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-primary to-amber-500">
              SEBI-compliant advisors
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-[17px] sm:text-[18px] text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Significia gives every registered Investment Advisor a fully white-labeled client
          portal — powered by the Bridge model so your database runs on{" "}
          <span className="text-slate-300 font-medium">your infrastructure</span>, not ours.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/45 transition-all duration-200 hover:-translate-y-px"
          >
            Request a Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-6 py-3 text-[14px] font-medium text-white/75 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            How the Bridge works
          </Link>
        </div>

        {/* Stats strip */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-16">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.value}>
              <div className="text-center">
                <div className="text-[15px] font-semibold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden sm:block h-8 w-px bg-white/10" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Product mockup */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Outer glow ring */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-sm pointer-events-none" />

        <div className="relative rounded-xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl shadow-black/60">
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 h-10 border-b border-white/8 bg-[#0d1117]">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
            <div className="ml-4 flex-1 max-w-xs">
              <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 h-6">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                <div className="h-1.5 w-24 rounded-full bg-slate-600" />
              </div>
            </div>
          </div>

          {/* Mock dashboard layout */}
          <div className="flex h-[200px] sm:h-[320px] lg:h-[380px] overflow-hidden">
            {/* Sidebar */}
            <div className="hidden sm:flex w-[200px] shrink-0 flex-col gap-1 border-r border-white/6 bg-[#0a0f1a] p-3">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                <div className="h-6 w-6 rounded bg-primary/30" />
                <div className="h-3 w-20 rounded-full bg-white/20" />
              </div>
              {["Dashboard", "Clients", "Risk Profiles", "Reports", "Compliance"].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${i === 0 ? "bg-primary/15 border border-primary/25" : ""}`}
                >
                  <div className={`h-3.5 w-3.5 rounded ${i === 0 ? "bg-primary/70" : "bg-white/15"}`} />
                  <div className={`h-2 rounded-full ${i === 0 ? "w-16 bg-primary/80" : "w-14 bg-white/15"}`} />
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 bg-[#070d1a] p-4 sm:p-5 overflow-hidden">
              {/* Topbar */}
              <div className="flex items-center justify-between mb-5">
                <div className="space-y-1">
                  <div className="h-3 w-32 rounded-full bg-white/20" />
                  <div className="h-2 w-20 rounded-full bg-white/8" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-24 rounded-lg bg-primary/20 border border-primary/25" />
                  <div className="h-7 w-7 rounded-full bg-white/10" />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[
                  { accent: "bg-primary/20 border-primary/25", bar: "bg-primary/60", w: "w-3/4" },
                  { accent: "bg-emerald-500/10 border-emerald-500/20", bar: "bg-emerald-500/50", w: "w-1/2" },
                  { accent: "bg-blue-500/10 border-blue-500/20", bar: "bg-blue-500/50", w: "w-2/3" },
                  { accent: "bg-violet-500/10 border-violet-500/20", bar: "bg-violet-500/50", w: "w-4/5" },
                ].map((card, i) => (
                  <div key={i} className={`rounded-lg border p-3 ${card.accent}`}>
                    <div className="h-2 w-12 rounded-full bg-white/15 mb-2" />
                    <div className="h-4 w-16 rounded-full bg-white/25 mb-1.5" />
                    <div className={`h-1.5 ${card.w} rounded-full ${card.bar}`} />
                  </div>
                ))}
              </div>

              {/* Chart area */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 rounded-lg border border-white/6 bg-white/3 p-3">
                  <div className="h-2 w-24 rounded-full bg-white/15 mb-3" />
                  <div className="flex items-end gap-1.5 h-16 sm:h-24">
                    {[40, 60, 45, 80, 55, 90, 70, 85, 65, 95, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          background: i === 11
                            ? "oklch(0.68 0.12 75 / 0.8)"
                            : `oklch(0.68 0.12 75 / ${0.15 + i * 0.04})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="h-2 w-16 rounded-full bg-primary/40 mb-2" />
                  <div className="space-y-1.5">
                    {[80, 60, 45, 90].map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <div
                          className="h-1.5 rounded-full bg-primary/30"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
      </div>

      {/* Extra bottom space so fade looks right */}
      <div className="h-16 w-full relative z-10" />
    </section>
  );
}
