"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar, SidebarContent } from "./DashboardSidebar";
import { Topbar } from "./Topbar";
import { useAppStore } from "@/store/useAppStore";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { useRouter } from "next/navigation";
import { AuthService } from "@/core/services/auth.service";

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

  React.useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get("token");
        const urlRefreshToken = urlParams.get("refreshToken");
        
        if (urlToken) {
          localStorage.setItem("accessToken", urlToken);
          if (urlRefreshToken) {
            localStorage.setItem("refreshToken", urlRefreshToken);
          }
          // Clean the URL so tokens don't sit in the browser history
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        clearUser();
        router.push("/login");
        return;
      }
      
      if (!user) {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          const isSubdomain = parts.length >= 3 || (parts.length >= 2 && hostname.includes('localhost') && parts[0] !== 'www' && parts[0] !== 'app');

          // If token exists but Zustand is empty (e.g. hard refresh), restore session
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
          
          if (authUser.role === "super_admin") {
            router.push("/admin");
            return;
          }
        } catch (err) {
          console.error("Failed to restore session", err);
          clearUser();
          router.push("/login");
          return;
        }
      } else if (user.role === "super_admin") {
        router.push("/admin");
        return;
      }
      
      setIsInitializing(false);
    };
    
    initAuth();
  }, [user, setUser, clearUser, router]);

  if (isInitializing) {
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
          {/* Top Navigation */}
          <Topbar />

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
