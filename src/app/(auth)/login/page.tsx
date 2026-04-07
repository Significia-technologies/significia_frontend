"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser, publicBranding } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const hostname = window.location.hostname;
      const rootDomains = ['localhost', '127.0.0.1', 'significia.com', 'www.significia.com', 'app.significia.com'];
      const isRootDomain = rootDomains.includes(hostname) || hostname.endsWith('.vercel.app');

      let result;
      // If we are simulating a tenant, we should use the client login flow
      const isSimulating = !!localStorage.getItem("simulatedTenantSlug") && localStorage.getItem("simulatedTenantSlug") !== 'master';
      
      if (isRootDomain && !isSimulating) {
        result = await AuthService.login({ email, password });
      } else {
        result = await AuthService.clientLogin({ email, password });
      }
      
      // Strict Role Isolation: Check if user belongs to this portal
      if (isSimulating && result.user.role === "super_admin") {
        setIsLoading(false);
        setError("Unauthorized: Super Admins must log in via the master portal at app.significia.com");
        return;
      }
      
      setUser(result.user);
      
      if (result.user.role === "super_admin") {
        router.push("/admin");
      } else if (result.user.role === "client") {
        router.push("/");
      } else {
        // IA Master (owner) or other internal roles
        if (isRootDomain && !isSimulating) {
            router.push("/");
        } else if (result.subdomain) {
          const currentHost = window.location.host;
          const isLocalhost = currentHost.includes('localhost');
          const baseDomain = isLocalhost ? 'localhost:3000' : 'significia.com';
          window.location.href = `${window.location.protocol}//${result.subdomain}.${baseDomain}/?token=${result.accessToken}&refreshToken=${result.refreshToken}`;
        } else {
          router.push("/");
        }
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
    </Card>
  );
}
