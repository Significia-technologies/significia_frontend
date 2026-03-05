"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./DashboardSidebar";
import { Topbar } from "./Topbar";
import { useAppStore } from "@/store/useAppStore";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useAppStore();

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
