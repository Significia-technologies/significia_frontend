"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthService } from "@/core/services/auth.service";
import { useAppStore } from "@/store/useAppStore";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { toast } from "sonner";

export default function IALoginPage() {
  const router = useRouter();
  const { setUser, publicBranding } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const brandingName = publicBranding?.name || "Financial Portal";
  const isMaster = publicBranding?.is_master ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isSimulating = !!localStorage.getItem("simulatedTenantSlug") && localStorage.getItem("simulatedTenantSlug") !== 'master';
      
      // For IA login, we still use the iaStaffLogin flow which is tenant-aware
      const response = await AuthService.iaStaffLogin({ email, password });

      setUser({
        id: "",
        email,
        role: "ia_staff",
        tenant_id: "",
        company_name: response.tenant_name,
        is_profile_completed: true,
        max_client_permit: 0,
      });

      toast.success(`Welcome back, ${response.user_name}!`);
      router.push("/master");
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || "Invalid credentials. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
            {brandingName} Staff
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sign in to your administration dashboard
          </CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 px-0 pb-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@yourfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all font-medium"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all font-medium"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 px-0 pb-8 pt-2">
          <Button
            type="submit"
            className="w-full h-11 gap-2 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-start gap-2.5 text-[10px] leading-relaxed text-muted-foreground bg-accent/30 p-3 rounded-lg border border-border">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
            <p>
              Your credentials are verified securely within your own infrastructure,
              never transmitted to or stored by Significia. Compliant by design.
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
