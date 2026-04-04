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
  Terminal,
  PieChart,
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
import { TenantLogo } from "@/components/shared/TenantLogo";

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
    minRole: "super_admin", // Only for Significia staff
  },
  {
    label: "Financial Goals",
    href: "/financial-goals",
    icon: BarChart3,
  },
  {
    label: "Risk Profiles",
    href: "/risk-profiles",
    icon: ShieldCheck,
  },
  {
    label: "Asset Allocation",
    href: "/asset-allocation",
    icon: PieChart,
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
    label: "Accounts",
    href: "/accounts",
    icon: Users,
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    minRole: "owner", // Accessible to IA Owners and Super Admins
  },
  {
    label: "Drawers",
    href: "/drawers",
    icon: Archive,
  },
  {
    label: "Tools",
    href: "/tools",
    icon: Wrench,
  },
  {
    label: "Developer",
    href: "/master/developer",
    icon: Terminal,
    minRole: "super_admin",
  },
  {
    label: "Admin",
    href: "/admin",
    icon: UserCog,
    minRole: "super_admin",
  },
];

const BOTTOM_NAV_ITEMS = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// ── Component ───────────────────────────────────────
export function SidebarContent() {
  const pathname = usePathname();
  const { sidebarCollapsed, publicBranding, user } = useAppStore();

  // Determine display name: Use public branding if available, or user session info
  const displayName = publicBranding?.name || user?.company_name || user?.name || "Financial Portal";
  
  // ── Role/Context Detection ──────────────────────────
  const isIAOwner = user?.role === "owner";
  const isSuperAdmin = user?.role === "super_admin";
  const isMasterSubdomain = publicBranding?.is_master ?? (user?.subdomain === "master");
  
  // A "Master Context" is when we are on the global master domain OR are an IA Master of our own instance.
  const isMasterContext = isMasterSubdomain || isIAOwner;

  // Filter items based on role
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    // 1. "Master" and other admin headers require a Master Context
    if (item.minRole === "super_admin" && !isMasterContext) return false;
    
    // 2. "Developer" is for Significia Super Admins OR IA Owners
    if (item.href.includes("/master/developer") && !(isSuperAdmin || isIAOwner)) return false;

    // 3. Global "Admin" is for Super Admins ONLY
    if (item.href === "/admin" && !isSuperAdmin) return false;

    // 4. If profile is NOT completed, IA Masters can ONLY see the Master page and Overview
    if (isIAOwner && !user.is_profile_completed && !["/", "/master"].includes(item.href)) {
      return false;
    }

    return true;
  });

  return (
    <>
      {/* ── Logo ── */}
      <div className="flex h-16 items-center gap-3 px-4">
        <TenantLogo
          logoType={publicBranding?.logo_type || (isMasterContext ? "significia" : "shield")}
          logoUrl={publicBranding?.logo_url}
          className="h-8 w-8 shrink-0"
        />
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight text-foreground truncate">
            {displayName}
          </span>
        )}
      </div>

      <Separator />

      {/* ── Main Nav ── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2 py-4 [&::-webkit-scrollbar]:hidden scrollbar-none">
        {filteredNavItems.map((item) => {
          let isActive = false;
          
          if (item.href === "/") {
            isActive = pathname === "/";
          } else if (item.href === "/master") {
            isActive = pathname === "/master" || (pathname.startsWith("/master") && !pathname.startsWith("/master/developer"));
          } else {
            isActive = pathname.startsWith(item.href);
          }

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
    </>
  );
}

export function DashboardSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
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

      <SidebarContent />
    </aside>
  );
}
