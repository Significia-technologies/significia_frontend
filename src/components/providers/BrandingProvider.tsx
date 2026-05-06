"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";
import { TenantNotFound } from "@/components/shared/TenantNotFound";

/**
 * Hex → HSL Converter
 * Converts a hex color string to HSL components for CSS variable injection.
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * HSL → OKLCH approximation
 * Converts HSL to an approximate OKLCH string for CSS variable injection.
 * This preserves compatibility with the existing oklch-based theme.
 */
function hslToOklch(h: number, s: number, l: number): string {
  // Convert percentages to 0-1 range
  const sNorm = s / 100;
  const lNorm = l / 100;
  
  // Map to OKLCH approximation
  // L (lightness): roughly maps from HSL L
  const oklchL = lNorm * 0.85 + 0.1; // Scale to ~0.1-0.95 range
  // C (chroma): roughly maps from saturation
  const oklchC = sNorm * 0.2; // Max chroma ~0.2
  // H (hue): direct mapping
  const oklchH = h;
  
  return `oklch(${oklchL.toFixed(3)} ${oklchC.toFixed(3)} ${oklchH})`;
}

/**
 * Apply Brand Color Theme
 * Injects CSS custom properties to override the default primary color.
 */
function applyBrandColor(hex: string) {
  const hsl = hexToHSL(hex);
  if (!hsl) return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  // Light mode: use the color as-is
  // Dark mode: boost lightness slightly for better visibility on dark backgrounds
  const lightL = hsl.l;
  const darkL = Math.min(hsl.l + 10, 75); // Slightly brighter in dark mode
  
  const activeLightness = isDark ? darkL : lightL;
  
  // Generate OKLCH values
  const primaryOklch = hslToOklch(hsl.h, hsl.s, activeLightness);
  
  // Calculate foreground: white for dark primary, dark for light primary
  const needsLightFg = activeLightness < 55;
  const fgOklch = isDark
    ? (needsLightFg ? "oklch(0.985 0 0)" : "oklch(0.145 0 0)")
    : (needsLightFg ? "oklch(0.985 0 0)" : "oklch(0.145 0 0)");
  
  // Ring color with transparency
  const ringOklch = hslToOklch(hsl.h, hsl.s, activeLightness).replace(")", " / 50%)");
  
  // Set CSS variables
  root.style.setProperty("--primary", primaryOklch);
  root.style.setProperty("--primary-foreground", fgOklch);
  root.style.setProperty("--ring", ringOklch);
  root.style.setProperty("--sidebar-primary", primaryOklch);
  root.style.setProperty("--sidebar-primary-foreground", fgOklch);
  root.style.setProperty("--sidebar-ring", ringOklch);
}

/**
 * Apply Favicon
 * Swaps the browser favicon link tag.
 */
function applyFavicon(faviconUrl: string) {
  // Update existing favicon link if it exists, otherwise create it
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  
  link.href = faviconUrl;

  // Also update apple-touch-icon
  let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!appleLink) {
    appleLink = document.createElement("link");
    appleLink.rel = "apple-touch-icon";
    document.head.appendChild(appleLink);
  }
  appleLink.href = faviconUrl;
}

/**
 * Apply Meta Tags
 * Updates or creates meta description tag.
 */
function applyMetaDescription(description: string) {
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
}

/**
 * BrandingProvider
 * ────────────────────────────────────────────────────────
 * Hydrates the global tenant branding info on initial load.
 * This ensures that even on hard refreshes within the dashboard,
 * the correct white-labeled identity is maintained.
 *
 * White-Label Engine:
 * - Injects custom CSS variables for brand colors
 * - Swaps favicon
 * - Updates document title and meta description
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { publicBranding, setPublicBranding, user } = useAppStore();
  const pathname = usePathname();
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
          if (branding.portal_title) {
            document.title = branding.portal_title;
          } else if (branding.name) {
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

  // ── White-Label Engine: Apply branding whenever it changes ──
  useEffect(() => {
    if (!publicBranding) return;

    // 1. Brand Color → CSS Variables
    if (publicBranding.brand_color) {
      applyBrandColor(publicBranding.brand_color);
    }

    // 2. Favicon
    if (publicBranding.favicon_url) {
      applyFavicon(publicBranding.favicon_url);
    }

    // 3. Meta Description
    if (publicBranding.portal_description) {
      applyMetaDescription(publicBranding.portal_description);
    }

    // 4. Document Title
    if (publicBranding.portal_title) {
      document.title = publicBranding.portal_title;
    } else if (publicBranding.name) {
      document.title = `${publicBranding.name} Portal`;
    }
  }, [publicBranding, pathname]);

  // ── Re-apply brand color on theme change (light/dark toggle) ──
  useEffect(() => {
    if (!publicBranding?.brand_color) return;

    const observer = new MutationObserver(() => {
      if (publicBranding.brand_color) {
        applyBrandColor(publicBranding.brand_color);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [publicBranding?.brand_color]);

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
