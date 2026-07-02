"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Compass, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROOT_DOMAINS = ["localhost", "127.0.0.1", "significia.com", "www.significia.com", "app.significia.com"];

export function DomainNotFound() {
  const [isRootDomain, setIsRootDomain] = useState<boolean | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const simulatedSlug = localStorage.getItem("simulatedTenantSlug");
    const hasSimulatedSlug = !!simulatedSlug && simulatedSlug !== "master";
    const onRoot = (ROOT_DOMAINS.includes(hostname) || hostname.endsWith(".vercel.app")) && !hasSimulatedSlug;
    setIsRootDomain(onRoot);
  }, []);

  // "/" resolves correctly on either domain: the marketing homepage on the
  // root domain, or a redirect to /dashboard on a tenant subdomain (HomeGate).
  const isTenant = isRootDomain === false;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4">
      <div className="relative flex items-center justify-center w-28 h-28 mb-8 rounded-full bg-accent">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
        <Compass className="w-14 h-14 text-primary" />
      </div>

      <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        This page isn't available here
      </h1>

      <p className="max-w-lg mb-8 text-lg text-muted-foreground">
        {isTenant
          ? "Either this page doesn't exist, or it's part of the main Significia site rather than your portal."
          : "Either this page doesn't exist, or it's a page that only makes sense on a specific firm's portal."}
      </p>

      <div className="flex items-center gap-4">
        <Button asChild className="gap-2" variant="default">
          <Link href="/">
            {isTenant ? <LayoutDashboard className="h-4 w-4" /> : <Home className="h-4 w-4" />}
            {isTenant ? "Go to your dashboard" : "Go to Significia"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
