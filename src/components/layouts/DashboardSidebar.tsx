"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  ShieldCheck,
  PieChart,
  FileCheck2,
  Mail,
  ClipboardCheck,
  Users,
  TrendingUp,
  Archive,
  Wrench,
  Terminal,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
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

// ── Types ────────────────────────────────────────────
interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole?: string;
  children?: NavChild[];
}

// ── Navigation Items ────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Master",
    href: "/master",
    icon: Database,
    minRole: "super_admin",
  },
  {
    label: "Client Master",
    href: "/clients",
    icon: Users,
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
    children: [
      { label: "Existing Asset Allocation", href: "/existing-asset-allocation" },
      { label: "Target Asset Allocation", href: "/asset-allocation" },
      { label: "Allocation Comparison", href: "/asset-allocation/compare" },
    ],
  },
  {
    label: "Investment Advice",
    href: "/investment-advice",
    icon: FileText,
  },
  {
    label: "Product Basket",
    href: "/product-basket",
    icon: ShieldCheck,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: TrendingUp,
    children: [
      { label: "Investor Master", href: "/portfolio/investor-master" },
      { label: "Target Portfolio", href: "/portfolio/target-portfolio" },
    ],
  },
  {
    label: "Data Rectification",
    href: "/rectification",
    icon: ClipboardCheck,
    minRole: "admin",
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    minRole: "admin",
  },
  {
    label: "Audit Log",
    href: "/master/compliance",
    icon: FileCheck2,
    minRole: "admin",
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
    label: "Email",
    href: "/settings/email",
    icon: Mail,
    minRole: "admin",
  },
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

  // Track which parent items are open (keyed by href)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-open a parent menu if any of its children match the current path
  useEffect(() => {
    const auto: Record<string, boolean> = {};
    for (const item of NAV_ITEMS) {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        auto[item.href] = true;
      }
    }
    setOpenMenus((prev) => ({ ...prev, ...auto }));
  }, [pathname]);

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));
  };

  const displayName =
    publicBranding?.name || user?.company_name || user?.name || "Financial Portal";

  const isIAOwner = user?.role === "owner";
  const isIAPartner = user?.role === "partner";
  const isSuperAdmin = user?.role === "super_admin";
  const isMasterSubdomain = publicBranding?.is_master ?? user?.subdomain === "master";
  const isMasterContext = isMasterSubdomain || isIAOwner;

  const filteredNavItems = NAV_ITEMS.map((item) => {
    if (item.children) {
      const filteredChildren = item.children.filter((child) => {
        if (!(isIAOwner || isIAPartner || isSuperAdmin)) {
          if (child.href === "/portfolio/investor-master") {
            const hasPerm = user?.permissions?.find((p: any) => p.module === "Investor Master")?.can_read;
            if (!hasPerm) return false;
          }
          if (child.href === "/portfolio/target-portfolio") {
            const hasPerm = user?.permissions?.find((p: any) => p.module === "Target Portfolio")?.can_read;
            if (!hasPerm) return false;
          }
          if (child.href === "/existing-asset-allocation") {
            const hasPerm = user?.permissions?.find((p: any) => p.module === "Existing Asset Allocation")?.can_read;
            if (!hasPerm) return false;
          }
          if (child.href === "/asset-allocation") {
            const hasPerm = user?.permissions?.find((p: any) => p.module === "Asset Allocation")?.can_read;
            if (!hasPerm) return false;
          }
          if (child.href === "/asset-allocation/compare") {
            const hasExisting = user?.permissions?.find((p: any) => p.module === "Existing Asset Allocation")?.can_read;
            const hasTarget = user?.permissions?.find((p: any) => p.module === "Asset Allocation")?.can_read;
            if (!hasExisting || !hasTarget) return false;
          }
        }
        return true;
      });
      return { ...item, children: filteredChildren };
    }
    return item;
  }).filter((item) => {
    if (item.minRole === "super_admin" && !isMasterContext) return false;
    if (item.minRole === "admin") {
      if (isIAOwner || isIAPartner || isSuperAdmin) {
        // Allowed
      } else if (item.href === "/rectification") {
        const clientsPerm = user?.permissions?.find((p: any) => p.module === "Clients");
        if (!clientsPerm?.can_update) return false;
      } else {
        return false;
      }
    }
    if (item.href.includes("/master/developer") && !(isSuperAdmin || isIAOwner)) return false;
    if (item.href === "/admin" && !isSuperAdmin) return false;
    const isTenantUser = user && user.role !== "super_admin";
    if (isTenantUser && !user.is_profile_completed && !["/", "/master"].includes(item.href))
      return false;

    // Enforce permission checks for standard users
    if (!(isIAOwner || isIAPartner || isSuperAdmin)) {
      if (item.href === "/clients") {
        const hasPerm = user?.permissions?.find((p: any) => p.module === "Clients")?.can_read;
        if (!hasPerm) return false;
      }
      if (item.href === "/product-basket") {
        const hasPerm = user?.permissions?.find((p: any) => p.module === "Product Basket")?.can_read;
        if (!hasPerm) return false;
      }
      if (item.href === "/investment-advice") {
        const hasPerm = user?.permissions?.find((p: any) => p.module === "Investment Advice")?.can_read;
        if (!hasPerm) return false;
      }
      if (item.children && item.children.length === 0) {
        return false;
      }
    }
    return true;
  });

  const isItemActive = (item: NavItem) => {
    if (item.href === "/") return pathname === "/";
    if (item.href === "/master")
      return (
        pathname === "/master" ||
        (pathname.startsWith("/master") &&
          !pathname.startsWith("/master/developer") &&
          !pathname.startsWith("/master/compliance"))
      );
    // For items with children, parent is "active" only on exact match
    if (item.children) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* ── Logo ── */}
      <div className="flex h-14 items-center gap-3 px-4">
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
          const active = isItemActive(item);
          const hasChildren = !!item.children?.length;
          const isOpen = openMenus[item.href] ?? false;
          // Parent row is highlighted if it has no children and is active,
          // OR if it has children and the current path is exactly the parent.
          const parentHighlighted = active;

          // ── Collapsed mode with children: show tooltip for parent + each child ──
          if (sidebarCollapsed && hasChildren) {
            return (
              <div key={item.href}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        pathname.startsWith(item.href) || item.children?.some((c) => pathname.startsWith(c.href))
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
                {item.children?.map((child) => {
                  const childActive = pathname.startsWith(child.href);
                  return (
                    <Tooltip key={child.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={child.href}
                          className={cn(
                            "flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors mt-0.5",
                            childActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {child.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          }

          // ── Collapsed mode, no children ──
          if (sidebarCollapsed) {
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
              </Link>
            );
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          // ── Expanded mode with children ──
          if (hasChildren) {
            return (
              <div key={item.href}>
                {/* Parent row — clicking toggles submenu */}
                <button
                  onClick={() => toggleMenu(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(item.href) || item.children?.some((c) => pathname.startsWith(c.href))
                      ? "text-primary"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {/* Children */}
                {isOpen && (
                  <div className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                    {item.children!.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                            childActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ── Expanded mode, no children ──
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Nav ── */}
      <div className="border-t border-border px-2 py-3">
        {BOTTOM_NAV_ITEMS.filter((item) => {
          if ((item as any).minRole === "admin" && !(isIAOwner || isIAPartner || isSuperAdmin))
            return false;
          return true;
        }).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
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
