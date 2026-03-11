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
        router.push("/dashboard");
      } else {
        if (result.subdomain) {
          const currentHost = window.location.host;
          const isLocalhost = currentHost.includes('localhost');
          const baseDomain = isLocalhost ? 'localhost:3000' : 'significia.com';
          window.location.href = `${window.location.protocol}//${result.subdomain}.${baseDomain}/dashboard?token=${result.accessToken}&refreshToken=${result.refreshToken}`;
        } else {
          router.push("/dashboard");
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
    <Card className="w-full border-primary/20 shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <CardHeader className="space-y-3 text-center pt-8 pb-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg p-3 transition-transform hover:scale-105 duration-300">
          <img src="/favicon-32x32.png" alt="Significia Logo" className="w-full h-full object-contain filter drop-shadow-md" />
        </div>
        <div>
          <CardTitle className="text-4xl font-black tracking-tighter">
            <span className="bg-gradient-to-b from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
              Significia
            </span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 text-xs font-bold uppercase tracking-widest mt-1">
            Secure Access
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-8 pb-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-0">
          <Button type="submit" className="w-full h-10 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
