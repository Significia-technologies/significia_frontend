"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService } from "@/core/services/auth.service";
import { useAppStore } from "@/store/useAppStore";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setPublicBranding, publicBranding } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Concurrent Login states
  const [showConcurrentModal, setShowConcurrentModal] = useState(false);
  const [activeSession, setActiveSession] = useState<{ ip: string; last_active: string } | null>(null);
  const [pendingLogin, setPendingLogin] = useState<{ email: string; password: string; isSubdomain: boolean } | null>(null);
  const [sessionInvalidatedNotice, setSessionInvalidatedNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "session_invalidated") {
        setSessionInvalidatedNotice(true);
        toast.warning("Your session was terminated because a new sign-in was authorized on another device.", {
          duration: 6000,
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent | null, force = false) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const hostname = window.location.hostname;
      const rootDomains = ['localhost', '127.0.0.1', 'significia.com', 'www.significia.com', 'app.significia.com'];
      const isRootDomain = rootDomains.includes(hostname) || hostname.endsWith('.vercel.app');

      // If we are simulating a tenant on localhost, we treat it as a subdomain
      const simulatedSlug = typeof window !== "undefined" ? localStorage.getItem("simulatedTenantSlug") : null;
      const hasSimulatedSlug = !!simulatedSlug && simulatedSlug !== 'master';
      const isSubdomain = !isRootDomain || hasSimulatedSlug;

      const currentEmail = email || pendingLogin?.email || "";
      const currentPassword = password || pendingLogin?.password || "";

      if (!isSubdomain) {
        // --- ROOT DOMAIN LOGIN (Super Admin & Staff) ---
        const result = await AuthService.login({ email: currentEmail, password: currentPassword, force });
        
        if (result.status === "active_session_exists") {
          setPendingLogin({ email: currentEmail, password: currentPassword, isSubdomain: false });
          setActiveSession((result.device_info as any) || null);
          setShowConcurrentModal(true);
          setIsLoading(false);
          return;
        }

        // Ensure the user belongs to the master/significia organization
        const userSubdomain = result.subdomain || result.user?.subdomain;
        if (userSubdomain !== "master") {
          setIsLoading(false);
          setError("This portal is restricted to Significia Super Admins and Staff. Please use your organization's subdomain to log in.");
          AuthService.logout();
          return;
        }

        setUser(result.user!);
        setPublicBranding(null); // Force refetch of branding
        router.push("/admin");
      } else {
        // --- SUBDOMAIN LOGIN (IA Staff / Owner) ---
        // iaStaffLogin calls the Bridge proxy on the backend
        const result = await AuthService.iaStaffLogin({ email: currentEmail, password: currentPassword, force });

        if (result.status === "active_session_exists") {
          setPendingLogin({ email: currentEmail, password: currentPassword, isSubdomain: true });
          setActiveSession((result.device_info as any) || null);
          setShowConcurrentModal(true);
          setIsLoading(false);
          return;
        }

        // Fetch the real user profile from the backend so is_profile_completed reflects actual state
        const authUser = await AuthService.getCurrentUser();
        setUser(authUser);
        setPublicBranding(null); // Force refetch of branding

        router.push("/dashboard");
      }
    } catch (err: unknown) {
      let message = "Invalid email or password. Please try again.";
      const errorData = (err as any)?.response?.data;
      
      if (typeof errorData?.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData?.detail) && errorData.detail.length > 0) {
        const firstError = errorData.detail[0];
        message = `${firstError.msg} (${firstError.loc.join(".")})`;
      } else if (errorData?.message) {
        message = errorData.message;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceLogin = async () => {
    await handleSubmit(null, true);
  };

  const brandingName = publicBranding?.name || "Significia Portal";
  const isMaster = publicBranding?.is_master ?? true;

  return (
    <Card className="w-full border-none shadow-none bg-transparent overflow-hidden">
      <CardHeader className="space-y-4 pb-8 pt-0 items-center text-center">
        <TenantLogo 
          logoType={publicBranding?.logo_type || (isMaster ? "significia" : "shield")}
          logoUrl={publicBranding?.logo_url}
          className="h-16 w-16 mb-2 mx-auto"
          iconClassName="h-8 w-8"
        />
        <div className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome to {brandingName}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Please enter your details to sign in
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-0 pb-4">
          {sessionInvalidatedNotice && (
            <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-500 border border-amber-500/20 animate-in fade-in slide-in-from-top-1 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Session Terminated</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have been logged out because a new sign-in was authorized on another device.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 px-0 pb-8 pt-2">
          <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </CardFooter>
      </form>

      {showConcurrentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card/60 shadow-2xl backdrop-blur-xl p-6 md:p-8 animate-in zoom-in-95 duration-200">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Active Session Detected
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are currently signed in on another device. Signing in here will log you out from the other device.
              </p>

              {activeSession && (
                <div className="w-full rounded-xl bg-accent/40 border border-border p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Device IP:</span>
                    <span className="text-foreground font-semibold font-mono">{activeSession.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Last Active:</span>
                    <span className="text-foreground font-semibold">
                      {new Date(activeSession.last_active).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col w-full gap-3 pt-2">
                <Button
                  onClick={handleForceLogin}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-lg shadow-amber-600/20 transition-all hover:scale-[1.01] active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Log Out Other Device & Sign In"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConcurrentModal(false);
                    setPendingLogin(null);
                  }}
                  className="w-full h-11 border-border bg-transparent text-foreground hover:bg-accent transition-all font-semibold"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
