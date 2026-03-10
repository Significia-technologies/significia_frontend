"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { user } = useAppStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait for the app store to initialize the user from DashboardLayout auth check
    // Alternatively, this guard expects the token check to have occurred.
    if (!user) {
      // User hasn't been fetched yet, or is logged out
      return; 
    }

    if (user.role === "super_admin") {
      setIsAuthorized(true);
    } else {
      console.warn("Access Denied: User is not a super_admin.");
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
