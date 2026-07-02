"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DomainNotFound } from "@/components/shared/DomainNotFound";

// Public marketing routes — no auth wrapper
const PUBLIC_PATHS = ["/", "/features", "/how-it-works", "/pricing", "/about", "/contact"];

const ROOT_DOMAINS = ["localhost", "127.0.0.1", "significia.com", "www.significia.com", "app.significia.com"];

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  const [checked, setChecked] = useState(false);
  const [blockedOnRootDomain, setBlockedOnRootDomain] = useState(false);

  useEffect(() => {
    if (isPublicPath) return;

    const hostname = window.location.hostname;
    const simulatedSlug = localStorage.getItem("simulatedTenantSlug");
    const hasSimulatedSlug = !!simulatedSlug && simulatedSlug !== "master";
    const isRootDomain = (ROOT_DOMAINS.includes(hostname) || hostname.endsWith(".vercel.app")) && !hasSimulatedSlug;

    setBlockedOnRootDomain(isRootDomain);
    setChecked(true);
  }, [pathname, isPublicPath]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (!checked) {
    return null;
  }

  // Tenant-only pages have no meaning on the root domain — render the 404
  // directly (calling notFound() from a layout doesn't reach this segment's
  // own not-found.tsx, it bubbles up past it) instead of full dashboard
  // chrome with no real tenant data behind it.
  if (blockedOnRootDomain) {
    return <DomainNotFound />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
