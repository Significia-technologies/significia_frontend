"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
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
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Accounts",
    href: "/dashboard/accounts",
    icon: Wallet,
  },
  {
    label: "Investments",
    href: "/dashboard/investments",
    icon: TrendingUp,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
];

const BOTTOM_NAV_ITEMS = [
  {
    label: "Settings",
    href: "/dashboard/settings",
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
        sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          RR
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold tracking-tight text-foreground">
            RRFinance
          </span>
        )}
      </div>

      <Separator />

      {/* ── Main Nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
      <div className="border-t border-border px-3 py-3">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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

      {/* ── Collapse Toggle ── */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
