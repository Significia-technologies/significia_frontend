"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
 * Apply Brand Color Theme
 * Injects CSS custom properties to override the default primary color.
 */
function applyBrandColor(hex: string) {
  const hsl = hexToHSL(hex);
  if (!hsl) return;

  const root = document.documentElement;
  const isDark = root.classList.contains("dark");

  const lightL = hsl.l;
  const darkL = Math.min(hsl.l + 10, 75); // Slightly brighter in dark mode
  const activeLightness = isDark ? darkL : lightL;
  
  const primaryHsl = `hsl(${hsl.h} ${hsl.s}% ${activeLightness}%)`;
  
  // Calculate foreground: white for dark primary, dark for light primary
  const needsLightFg = activeLightness < 55;
  const fgHsl = needsLightFg ? "hsl(0 0% 98%)" : "hsl(0 0% 15%)";
  
  // Ring color with transparency
  const ringHsl = `hsl(${hsl.h} ${hsl.s}% ${activeLightness}% / 50%)`;
  
  // Set CSS variables
  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-foreground", fgHsl);
  root.style.setProperty("--ring", ringHsl);
  root.style.setProperty("--sidebar-primary", primaryHsl);
  root.style.setProperty("--sidebar-primary-foreground", fgHsl);
  root.style.setProperty("--sidebar-ring", ringHsl);
}

/**
 * Apply Brand Background Color
 * Injects CSS custom properties to override the default background, card,
 * muted, border, and foreground colors for the active theme.
 */
function applyBrandBackgroundColor(hex: string) {
  const hsl = hexToHSL(hex);
  if (!hsl) return;

  const root = document.documentElement;
  const { h, s, l } = hsl;

  // Background
  root.style.setProperty("--background", hex);
  root.style.setProperty("--sidebar", hex);
  root.style.setProperty("--sidebar-background", hex);

  // Card: slight lightness offset from background for visual depth
  const isLightBg = l >= 55;
  const cardL = isLightBg ? Math.max(l - 3, 0) : Math.min(l + 3, 100);
  root.style.setProperty("--card", `hsl(${h} ${s}% ${cardL}%)`);
  root.style.setProperty("--popover", `hsl(${h} ${s}% ${cardL}%)`);

  // Muted: medium offset
  const mutedL = isLightBg ? Math.max(l - 8, 0) : Math.min(l + 8, 100);
  const mutedS = Math.max(s - 10, 0);
  root.style.setProperty("--muted", `hsl(${h} ${mutedS}% ${mutedL}%)`);
  root.style.setProperty("--sidebar-accent", `hsl(${h} ${mutedS}% ${mutedL}%)`);

  // Border: larger offset
  const borderL = isLightBg ? Math.max(l - 12, 0) : Math.min(l + 10, 100);
  root.style.setProperty("--border", `hsl(${h} ${Math.max(s - 15, 0)}% ${borderL}%)`);
  root.style.setProperty("--sidebar-border", `hsl(${h} ${Math.max(s - 15, 0)}% ${borderL}%)`);

  // Foreground: ensure WCAG contrast
  const fgHsl = isLightBg ? "hsl(0 0% 15%)" : "hsl(0 0% 98%)";
  root.style.setProperty("--foreground", fgHsl);
  root.style.setProperty("--card-foreground", fgHsl);
  root.style.setProperty("--popover-foreground", fgHsl);
  root.style.setProperty("--sidebar-foreground", fgHsl);

  // Muted foreground
  const mutedFgL = isLightBg ? 40 : 65;
  root.style.setProperty("--muted-foreground", `hsl(${h} ${Math.max(s - 20, 0)}% ${mutedFgL}%)`);
  root.style.setProperty("--sidebar-accent-foreground", `hsl(${h} ${Math.max(s - 20, 0)}% ${mutedFgL}%)`);
}

/**
 * Reset Brand Background Color
 * Removes the custom background/card/muted/border/foreground/sidebar style property overrides
 * to fall back safely to standard Tailwind globals.css class configurations.
 */
function resetBrandBackgroundColor() {
  const root = document.documentElement;
  root.style.removeProperty("--background");
  root.style.removeProperty("--sidebar");
  root.style.removeProperty("--sidebar-background");
  root.style.removeProperty("--card");
  root.style.removeProperty("--popover");
  root.style.removeProperty("--muted");
  root.style.removeProperty("--sidebar-accent");
  root.style.removeProperty("--border");
  root.style.removeProperty("--sidebar-border");
  root.style.removeProperty("--foreground");
  root.style.removeProperty("--card-foreground");
  root.style.removeProperty("--popover-foreground");
  root.style.removeProperty("--sidebar-foreground");
  root.style.removeProperty("--muted-foreground");
  root.style.removeProperty("--sidebar-accent-foreground");
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
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { publicBranding, setPublicBranding, user } = useAppStore();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
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

  // ── White-Label Engine: Apply branding whenever it changes or theme changes ──
  useEffect(() => {
    if (!publicBranding) return;

    // 1. Brand Color → CSS Variables
    if (publicBranding.brand_color) {
      applyBrandColor(publicBranding.brand_color);
    }

    // 2. Background Color → CSS Variables (theme-aware)
    const isDark = resolvedTheme === "dark";
    const activeBg = isDark
      ? publicBranding.brand_background_color_dark
      : publicBranding.brand_background_color_light;
    if (activeBg) {
      applyBrandBackgroundColor(activeBg);
    } else {
      resetBrandBackgroundColor();
    }

    // 3. Favicon
    if (publicBranding.favicon_url) {
      applyFavicon(publicBranding.favicon_url);
    }

    // 4. Meta Description
    if (publicBranding.portal_description) {
      applyMetaDescription(publicBranding.portal_description);
    }

    // 5. Document Title
    if (publicBranding.portal_title) {
      document.title = publicBranding.portal_title;
    } else if (publicBranding.name) {
      document.title = `${publicBranding.name} Portal`;
    }
  }, [publicBranding, resolvedTheme, pathname]);

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
