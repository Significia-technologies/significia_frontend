"use client";

import React, { useEffect, useState } from "react";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROOT_DOMAINS = ["localhost", "127.0.0.1", "significia.com", "www.significia.com", "app.significia.com"];

export default function DashboardNotFound() {
  const [mainDomainHref, setMainDomainHref] = useState("/");

  useEffect(() => {
    const { hostname, protocol, port } = window.location;
    const isRootDomain = ROOT_DOMAINS.includes(hostname) || hostname.endsWith(".vercel.app");

    if (isRootDomain) {
      setMainDomainHref("/");
      return;
    }

    // On a tenant subdomain — point back at the root marketing domain, not "/" on this subdomain
    const rootHost = hostname.includes("localhost") ? "localhost" : hostname.split(".").slice(-2).join(".");
    const portSuffix = port ? `:${port}` : "";
    setMainDomainHref(`${protocol}//${rootHost}${portSuffix}/`);
  }, []);

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
        Either this page doesn't exist, or it's a page that only makes sense on a specific
        firm's portal. If you're looking for Significia, head back to the main site.
      </p>

      <div className="flex items-center gap-4">
        <Button asChild className="gap-2" variant="default">
          <a href={mainDomainHref}>
            <Home className="h-4 w-4" />
            Go to Significia
          </a>
        </Button>
      </div>
    </div>
  );
}
