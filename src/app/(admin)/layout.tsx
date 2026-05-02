"use client";

import React from "react";
import { SuperAdminGuard } from "@/components/guards/SuperAdminGuard";
import { Topbar } from "@/components/layouts/Topbar";
import { AdminSidebar, AdminSidebarContent } from "@/components/layouts/AdminSidebar";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isMobileMenuOpen, setMobileMenuOpen } = useAppStore();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, setMobileMenuOpen]);

  return (
    <SuperAdminGuard>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* We reuse the active Topbar for Auth User context */}
        <Topbar showSearch={false} showLogo={true} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile Sidebar */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
              </SheetHeader>
              <AdminSidebarContent />
            </SheetContent>
          </Sheet>

          {/* Desktop Sidebar */}
          <AdminSidebar />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
