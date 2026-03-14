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

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register({
        email,
        password,
        companyName,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      let message = "Registration failed. Please try again.";
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

  if (success) {
    return (
      <Card className="w-full border-border/50 shadow-2xl">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Registration Successful!</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-none shadow-none bg-transparent overflow-hidden">
      <CardHeader className="space-y-1 pb-6 pt-0">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Create Account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Join the exclusive platform for premium Investment Advisory.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-0 pb-4 pt-0">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Wealth Management"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  minLength={8}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 px-0 pb-8 pt-2">
          <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Register Now
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
