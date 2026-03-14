"use client";

import React, { useState } from "react";
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

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
      const parts = hostname.split('.');
      const isSubdomain = parts.length >= 3 || (parts.length >= 2 && hostname.includes('localhost') && parts[0] !== 'www' && parts[0] !== 'app');

      let result;
      if (isSubdomain) {
        result = await AuthService.clientLogin({ email, password });
      } else {
        result = await AuthService.login({ email, password });
      }
      
      setUser(result.user);
      
      if (result.user.role === "super_admin") {
        router.push("/admin");
      } else if (result.user.role === "client") {
        router.push("/");
      } else {
        if (result.subdomain) {
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

  return (
    <Card className="w-full border-none shadow-none bg-transparent overflow-hidden">
      <CardHeader className="space-y-1 pb-6 pt-0">
        <CardTitle className="text-3xl font-bold flex justify-center tracking-tight">
          Login
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm flex justify-center">
          Enter your credentials to access your dashboard.
        </CardDescription>
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
              {/* <Link href="#" className="text-xs text-primary hover:underline underline-offset-4">
                Forgot password?
              </Link> */}
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
            Get Started
          </Button>
          {/* <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign up for free
            </Link>
          </p> */}
        </CardFooter>
      </form>
    </Card>
  );
}
