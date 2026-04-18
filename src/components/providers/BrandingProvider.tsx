"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";
import { TenantNotFound } from "@/components/shared/TenantNotFound";

/**
 * BrandingProvider
 * ────────────────────────────────────────────────────────
 * Hydrates the global tenant branding info on initial load.
 * This ensures that even on hard refreshes within the dashboard,
 * the correct white-labeled identity is maintained.
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { publicBranding, setPublicBranding, user } = useAppStore();
  const [tenantNotFound, setTenantNotFound] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  useEffect(() => {
    // Only fetch if not already present to avoid redundant calls
    if (!publicBranding && !tenantNotFound) {
      const hydrateBranding = async () => {
        try {
          const storedSlug = localStorage.getItem("simulatedTenantSlug") || undefined;
          const branding = await AuthService.getPublicBranding(storedSlug);
          setPublicBranding(branding);
          
          // Update page title dynamically for SEO/White-labeling
          if (branding.name) {
            document.title = `${branding.name} Portal`;
          }
        } catch (err: any) {
          console.error("Critical: Failed to hydrate branding context", err);
          
          if (err?.response?.status === 404) {
             setTenantNotFound(true);
          } else {
             setIsError(true);
          }
        }
      };

      hydrateBranding();
    }
  }, [publicBranding, setPublicBranding, tenantNotFound]);

  if (tenantNotFound) {
    return <TenantNotFound />;
  }

  // Fallback UI for generic server errors during branding fetch
  if (isError && !publicBranding) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">Failed to connect to the administration server.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

