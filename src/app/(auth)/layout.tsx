"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { TenantLogo } from "@/components/shared/TenantLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Animated Mesh Gradient Background (Full Page) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(191,149,63,0.12),transparent_60%)]" />
        <div className="absolute top-0 left-0 h-[800px] w-[800px] bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[800px] w-[800px] bg-amber-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-100 contrast-150" />
      </div>

      {/* Auth Content Card */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-700">
        {children}
      </div>
    </div>
  );
}
