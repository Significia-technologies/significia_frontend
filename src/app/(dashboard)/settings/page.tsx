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

export default function SettingsPage() {
  const { user } = useAppStore();

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Separator />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>
              View your company Details and authentication information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2 max-w-md">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={user.company_name}
                disabled
                className="bg-muted/50"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Your registered corporate entity.
              </p>
            </div>

            <div className="space-y-2 max-w-md">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted/50"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                The email associated with your login path.
              </p>
            </div>

            <div className="space-y-2 max-w-md">
              <Label>Account Role</Label>
              <div className="pt-1">
                <Badge variant="secondary" className="px-3 py-1 uppercase tracking-wider text-xs">
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <Label htmlFor="tenantId">Workspace ID (Tenant)</Label>
              <Input
                id="tenantId"
                type="text"
                value={user.tenant_id}
                disabled
                className="bg-muted/50 font-mono text-xs"
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Your unique database identifier for support inquiries.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
