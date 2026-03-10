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
    password: "", // Temporary initial password
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generatePassword = () => {
    // Generate a random 12-char secure password for the new client
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0, n = charset.length; i < 12; ++i) {
      pwd += charset.charAt(Math.floor(Math.random() * n));
    }
    setFormData((prev) => ({ ...prev, password: pwd }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await AdminService.provisionClient({
        company_name: formData.companyName,
        email: formData.email,
        password: formData.password,
      });
      // Set success for visual feedback, then we can optionally redirect
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
         const detail = err.response.data.detail;
         if (typeof detail === "string") {
            setError(detail);
         } else if (Array.isArray(detail)) {
            setError(detail.map(d => d.msg).join(", "));
         } else {
             setError("An unknown error occurred during provisioning.");
         }
      } else {
        setError("Failed to reach server. Check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Provision New Client</h1>
        </div>
      </div>

      {success && (
        <Alert className="border-green-500/50 text-green-600 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 stroke-green-600" />
          <AlertTitle>Provisioning Successful</AlertTitle>
          <AlertDescription>
            The tenant for <b>{formData.companyName}</b> has been generated safely. Navigating back to the overview...
          </AlertDescription>
        </Alert>
      )}

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
            Fill out the operational details required to map the organizational schema. They will use this email and temporary password to log in.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name / Workspace Label</Label>
              <Input
                id="companyName"
                placeholder="Acme Corp"
                required
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Root Owner Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@acmecorp.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Temporary Initial Password</Label>
                <button 
                  type="button" 
                  onClick={generatePassword}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Auto-Generate
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="text"
                  placeholder="Super secure password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={copyToClipboard}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy and securely distribute this password to the client in advance.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 py-4 px-6 mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Provisioning DB...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Client Record
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
