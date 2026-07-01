"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar, SidebarContent } from "./DashboardSidebar";
// import { Topbar } from "./Topbar";
import { useAppStore } from "@/store/useAppStore";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { useRouter, usePathname } from "next/navigation";
import { AuthService } from "@/core/services/auth.service";
import { ShieldCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { 
    user, 
    setUser, 
    clearUser, 
    sidebarCollapsed, 
    isMobileMenuOpen, 
    setMobileMenuOpen 
  } = useAppStore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  // ── Session Restoration (Run only on mount) ──
  React.useEffect(() => {
    const restoreSession = async () => {
      // 1. Handle URL tokens (from email links)
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        const urlRefreshToken = urlParams.get("refreshToken");
        
        if (urlToken) {
          localStorage.setItem("accessToken", urlToken);
          if (urlRefreshToken) {
            localStorage.setItem("refreshToken", urlRefreshToken);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        clearUser();
        router.push("/login");
        return;
      }

      // 2. Fetch user if not in store
      if (!user) {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          const isSubdomain = parts.length >= 3 || (parts.length >= 2 && hostname.includes('localhost') && parts[0] !== 'www' && parts[0] !== 'app');

          let authUser;
          if (isSubdomain) {
            try {
               authUser = await AuthService.getCurrentUser();
            } catch (userErr) {
               authUser = await AuthService.getCurrentClient();
            }
          } else {
             authUser = await AuthService.getCurrentUser();
          }
          setUser(authUser);
        } catch (err) {
          console.error("Failed to restore session", err);
          clearUser();
          router.push("/login");
          return;
        }
      }
      
      setIsInitializing(false);
    };

    restoreSession();
  }, [user, setUser, clearUser, router]); // Only runs when user state is missing

  // ── Routing Gates (Run on every pathname change) ──
  React.useEffect(() => {
    if (isInitializing || !user) return;

    // 1. Super Admin Redirection (Force to admin portal if they hit dashboard root)
    if (user.role === "super_admin" && pathname === "/") {
      router.push("/admin");
      return;
    }

    // 2. Tenant Profile Gate
    if (user.role !== "super_admin" && !user.is_profile_completed) {
      if (!pathname.startsWith("/master") && pathname !== "/") {
        router.push("/master");
      }
    }
  }, [user, pathname, isInitializing, router]);

  if (isInitializing || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64 border-r-0 bg-sidebar">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full border-r border-border">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300 ease-in-out",
            "ml-0 md:ml-64",
            sidebarCollapsed ? "md:ml-[68px]" : "md:ml-60"
          )}
        >
          {/* <Topbar /> */}

          {/* Mobile menu trigger — only visible when sidebar is hidden on small screens */}
          <div className="flex items-center h-12 px-3 border-b border-border md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-3 md:p-4">
            {isInitializing ? (
              <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* ── Profile Incomplete Warning ── */}
                {user?.role === "owner" && !user.is_profile_completed && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="h-5 w-5 shrink-0" />
                      <div className="flex-1 text-sm font-medium">
                        Your IA Master profile is incomplete. Please provide your Registration and Bank details to unlock all features.
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 border-amber-500/50 hover:bg-amber-500/20 text-[10px] uppercase font-bold"
                        onClick={() => router.push("/master/ia-master/new")}
                      >
                        Complete Profile
                      </Button>
                    </div>
                  </div>
                )}
                {children}
              </>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
