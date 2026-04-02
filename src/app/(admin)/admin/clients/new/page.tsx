"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, PlusCircle, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AdminService } from "@/core/services/admin.service";
import { AxiosError } from "axios";

export default function NewClientProvisioningPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    subdomain: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const response = await AdminService.provisionClient({
        company_name: formData.companyName,
        email: formData.email,
        subdomain: formData.subdomain || undefined,
      });
      setSuccessData(response);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
         const detail = err.response.data.detail;
         setError(typeof detail === "string" ? detail : JSON.stringify(detail));
      } else {
        setError("Failed to reach server. Check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning Successful</h1>
        </div>

        <Alert className="border-green-500/50 text-green-600 bg-green-500/10 mb-6">
          <CheckCircle2 className="h-4 w-4 stroke-green-600" />
          <AlertTitle>Tenant Created</AlertTitle>
          <AlertDescription>
            The record for <b>{successData.tenant_name}</b> is now live. Please copy the bridge token below.
          </AlertDescription>
        </Alert>

        <Card className="border-primary/50 shadow-lg">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg">Deployment Checklist</CardTitle>
            <CardDescription>Copy these credentials to configure the IA's Bridge server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground font-bold">Bridge Registration Token</Label>
              <div className="flex gap-2">
                <Input value={successData.bridge_registration_token} readOnly className="font-mono text-xs bg-muted" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(successData.bridge_registration_token)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-amber-600 font-medium">⚠️ Give this to the IA. They MUST paste this into their bridge/.env</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Admin Email</Label>
                <p className="text-sm font-medium">{successData.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground">Subdomain</Label>
                <p className="text-sm font-medium">{successData.subdomain || "None (Custom Domain Only)"}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-muted/20">
            <Button variant="ghost" onClick={() => setSuccessData(null)}>Provision Another</Button>
            <Link href="/admin">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Provision New Client</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Provisioning Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tenant Registration Details</CardTitle>
          <CardDescription>
            Fill out the operational details required to map the organizational schema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Bunty Wealth Management"
                required
                value={formData.companyName}
                onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                <div className="flex items-center">
                  <Input
                    id="subdomain"
                    placeholder="bunty"
                    className="rounded-r-none"
                    value={formData.subdomain}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                  />
                  <div className="bg-muted px-3 h-10 flex items-center border border-l-0 rounded-r-md text-xs text-muted-foreground">
                    .significia.com
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Leave blank for Custom Domain only.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@bunty.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/30 py-4 px-6 flex justify-end">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</> : <><PlusCircle className="mr-2 h-4 w-4" /> Create Tenant Record</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
