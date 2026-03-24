"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { user } = useAppStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        router.replace("/login");
        return;
      }

      if (!user) {
        try {
          const authUser = await AuthService.getCurrentUser();
          useAppStore.getState().setUser(authUser);
          
          if (authUser.role === "super_admin") {
            setIsAuthorized(true);
          } else {
            router.replace("/");
          }
        } catch (err) {
          router.replace("/login");
        }
      } else {
        if (user.role === ("super_admin" as any)) {
          setIsAuthorized(true);
        } else {
          router.replace("/");
        }
      }
    };

    checkAuth();
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
