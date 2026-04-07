"use client";

import React from "react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface TenantLogoProps {
  logoType?: "significia" | "shield" | "custom";
  logoUrl?: string | null;
  className?: string;
  iconClassName?: string;
}

/**
 * TenantLogo Component
 * ────────────────────────────────────────────────────────
 * Renders the appropriate branding logo based on the tenant context.
 * - significia: Default Significia icon.
 * - shield: Premium fallback shield for IA tenants.
 * - custom: Custom logo from the Bridge (IA's local DB).
 */
export const TenantLogo: React.FC<TenantLogoProps> = ({
  logoType = "shield",
  logoUrl,
  className,
  iconClassName,
}) => {
  if (logoType === "significia") {
    return (
      <div className={cn("flex items-center justify-center rounded-lg overflow-hidden bg-primary", className)}>
        <img src="/favicon-32x32.png" alt="Significia Logo" className="h-full w-full object-cover" />
      </div>
    );
  }

  if (logoType === "custom" && logoUrl) {
    return (
      <div className={cn("flex items-center justify-center rounded-lg overflow-hidden", className)}>
        <img src={logoUrl} alt="Organization Logo" className="h-full w-full object-contain" />
      </div>
    );
  }

  // Premium Shield Fallback
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/20 via-primary/10 to-[#D4AF37]/5 border border-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5",
        className
      )}
    >
      <Shield className={cn("h-5 w-5 text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]", iconClassName)} />
    </div>
  );
};
