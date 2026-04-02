"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";

/**
 * BrandingProvider
 * ────────────────────────────────────────────────────────
 * Hydrates the global tenant branding info on initial load.
 * This ensures that even on hard refreshes within the dashboard,
 * the correct white-labeled identity is maintained.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { publicBranding, setPublicBranding, user } = useAppStore();
  const displayName = publicBranding?.name || user?.company_name || "Financial Portal";

  useEffect(() => {
    // Only fetch if not already present to avoid redundant calls
    if (!publicBranding) {
      const hydrateBranding = async () => {
        try {
          const storedSlug = localStorage.getItem("simulatedTenantSlug") || undefined;
          const branding = await AuthService.getPublicBranding(storedSlug);
          setPublicBranding(branding);
          
          // Update page title dynamically for SEO/White-labeling
          if (branding.name) {
            document.title = `${branding.name} Portal`;
          }
        } catch (err) {
          console.error("Critical: Failed to hydrate branding context", err);
        }
      };

      hydrateBranding();
    }
  }, [publicBranding, setPublicBranding]);

  return <>{children}</>;
}
