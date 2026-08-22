"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Wrench, LogIn, ArrowRight, ShieldCheck } from "lucide-react";

export function MaintenanceMode() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background text-foreground px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header / Logo */}
      <header className="w-full max-w-7xl flex items-center justify-between py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Significia"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Significia
          </span>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="my-auto max-w-xl w-full text-center px-4 py-12 flex flex-col items-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
          <Wrench className="h-3.5 w-3.5 animate-pulse" />
          <span>System Maintenance</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Under Maintenance
        </h1>

        {/* Subtitle / Description */}
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-md">
          Our site is currently undergoing scheduled updates and maintenance. We will be back online shortly.
        </p>

        {/* CTA Cards / Actions */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Portal Access</h3>
              <p className="text-xs text-muted-foreground">Admin & Client login remains active.</p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all duration-150 shrink-0"
          >
            <span>Go to Portal Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl pt-6 border-t border-border/50 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} Significia. All rights reserved.</p>
        <p className="text-muted-foreground/80">
          Need immediate assistance? Contact system administrator.
        </p>
      </footer>
    </div>
  );
}
