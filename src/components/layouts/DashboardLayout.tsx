"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./DashboardSidebar";
import { Topbar } from "./Topbar";
import { useAppStore } from "@/store/useAppStore";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useRouter } from "next/navigation";
import { AuthService } from "@/core/services/auth.service";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, setUser, clearUser, sidebarCollapsed } = useAppStore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        clearUser();
        router.push("/login");
        return;
      }
      
      if (!user) {
        try {
          // If token exists but Zustand is empty (e.g. hard refresh), restore session
          const authUser = await AuthService.getCurrentUser();
          setUser(authUser);
        } catch (err) {
          console.error("Failed to restore session", err);
          clearUser();
          router.push("/login");
        }
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
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-[68px]" : "ml-64"
          )}
        >
          {/* Top Navigation */}
          <Topbar />

          {/* Page Content */}
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
