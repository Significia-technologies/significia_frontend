"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Activity,
  Users,
  Archive,
  Wrench,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";

// ── Navigation Items ────────────────────────────────
const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Master",
    href: "/master",
    icon: Database,
  },
  {
    label: "Financial Analysis",
    href: "/financial-analysis",
    icon: BarChart3,
  },
  {
    label: "Security Basket",
    href: "/security",
    icon: ShieldCheck,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: TrendingUp,
  },
  {
    label: "Operations",
    href: "/operations",
    icon: Activity,
  },
  {
    label:"Accounts",
    href:"/accounts",
    icon:Users,
  },
  {
    label:"Drawers",
    href:"/drawers",
    icon:Archive,
  },
  {
    label:"Tools",
    href:"/tools",
    icon:Wrench,
  },
  {
    label:"Admin",
    href:"/admin",
    icon:UserCog,
  }
];

const BOTTOM_NAV_ITEMS = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// ── Component ───────────────────────────────────────
export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* ── Collapse Toggle on Border ── */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-1/2 z-50 h-7 w-7 -translate-y-1/2 rounded-full hidden md:flex"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary">
          <img src="/favicon-32x32.png" alt="Significia Logo" className="h-full w-full object-cover" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold tracking-tight text-[#D4AF37]">
            Significia
          </span>
        )}
      </div>

      <Separator />

      {/* ── Main Nav ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-4 [&::-webkit-scrollbar]:hidden scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* ── Bottom Nav ── */}
      <div className="border-t border-border px-2 py-3">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </div>
    </aside>
  );
}
