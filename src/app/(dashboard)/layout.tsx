"use client";

import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public marketing routes — no auth wrapper
  const PUBLIC_PATHS = ["/", "/features", "/how-it-works", "/pricing", "/about", "/contact"];
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
