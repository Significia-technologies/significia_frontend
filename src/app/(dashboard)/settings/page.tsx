"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BridgeService } from "@/core/services/bridge.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Globe, Loader2, Save } from "lucide-react";
import { User } from "@/core/services/auth.service";

export default function SettingsPage() {
  const { user } = useAppStore();
  const [customDomain, setCustomDomain] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Initialize domain from user object
  React.useEffect(() => {
    if (user?.custom_domain) {
      setCustomDomain(user.custom_domain);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const handleUpdateDomain = async () => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      await BridgeService.updateTenantDomain({ custom_domain: customDomain });
      setUpdateSuccess(true);
    } catch (err: any) {
      setUpdateError(err.response?.data?.detail || "Failed to update domain.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Separator />

      <div className="grid gap-6">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>
              View your primary corporate identity and authentication context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <div className="text-sm font-medium p-2 bg-muted/30 rounded border">{user.company_name}</div>
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <div className="text-sm font-medium p-2 bg-muted/30 rounded border">{user.email}</div>
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <Label>Access Role</Label>
              <div className="pt-1">
                <Badge variant="secondary" className="px-3 py-1 uppercase tracking-wider text-[10px]">
                  {user.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domain Configuration — ONLY for Owners */}
        {user.role === "owner" && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Domain Configuration
              </CardTitle>
              <CardDescription>
                Configure how your clients access your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {updateSuccess && (
                <Alert className="bg-green-500/10 border-green-500/50 text-green-600">
                  <AlertTitle>Settings Updated</AlertTitle>
                  <AlertDescription>Your custom domain has been saved successfully.</AlertDescription>
                </Alert>
              )}

              {updateError && (
                <Alert variant="destructive">
                  <AlertTitle>Update Failed</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Managed Subdomain</Label>
                <div className="text-sm font-medium p-2 bg-muted/50 rounded border text-muted-foreground italic">
                  {user.subdomain ? `${user.subdomain}.significia.com` : "Not Configured"}
                </div>
                <p className="text-[10px] text-muted-foreground">This is your permanent Significia address.</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Agency Domain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="customDomain"
                      placeholder="e.g. portal.buntywealth.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                    <Button onClick={handleUpdateDomain} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {isUpdating ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <div className="text-[12px] font-medium text-amber-600 mt-2 bg-amber-50 p-3 rounded border border-amber-200">
                    <p className="font-bold flex items-center gap-1 mb-1">
                      ⚠️ IMPORTANT
                    </p>
                    <p>Before setting this, ensure you have pointed your CNAME record to <b>app.significia.com</b>.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/10">
          <CardHeader>
            <CardTitle className="text-sm">Technical metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-mono text-muted-foreground break-all">Tenant GUID: {user.tenant_id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
