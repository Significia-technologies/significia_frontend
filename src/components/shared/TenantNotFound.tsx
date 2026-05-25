"use client";

import React from "react";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function TenantNotFound() {
  const handleGoHome = () => {
    window.location.href = "https://significia.com";
  };

  const handleBackToLogin = () => {
    // If they are on a subdomain, maybe they want to go to the main login
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="max-w-md border-none shadow-2xl">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Portal Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 px-8 pb-8">
          <p className="text-slate-500 dark:text-slate-400">
            The portal you are trying to access does not exist or has been moved. 
          </p>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-xs font-mono break-all text-slate-600 dark:text-slate-400">
            {typeof window !== "undefined" ? window.location.hostname : ""}
          </div>
          <p className="text-sm text-slate-500">
            Please check the URL for typos or contact your Investment Advisor if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          <Button 
            variant="default" 
            className="w-full h-11 bg-primary hover:bg-primary/90"
            onClick={handleGoHome}
          >
            <Home className="mr-2 h-4 w-4" />
            Visit Significia.com
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-11 border-slate-200 dark:border-slate-800"
            onClick={handleBackToLogin}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
