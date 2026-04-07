"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Monitor, RefreshCcw, X, ShieldCheck } from "lucide-react";

/**
 * Development-only footer for testing multi-tenancy on localhost.
 * Allows simulating X-Tenant-Slug without editing /etc/hosts.
 */
export function DevelopmentFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActiveSlug(localStorage.getItem("simulatedTenantSlug"));
    }
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleApply = () => {
    if (!slug) {
      localStorage.removeItem("simulatedTenantSlug");
    } else {
      console.log(`[Simulator] Setting tenant to: ${slug}`);
      localStorage.setItem("simulatedTenantSlug", slug.toLowerCase().trim());
    }
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem("simulatedTenantSlug");
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!isOpen ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(true)}
          className="bg-background border-amber-500/50 text-amber-600 hover:bg-amber-50 shadow-lg gap-2"
        >
          <ShieldCheck className="h-4 w-4" />
          Tenant Simulator
          {activeSlug && <Badge variant="secondary" className="ml-1 bg-amber-100">{activeSlug}</Badge>}
        </Button>
      ) : (
        <div className="bg-background border border-border shadow-2xl rounded-lg p-4 w-80 space-y-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-amber-500" />
              Multi-Tenant Simulator
            </h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">
              Enter a tenant slug to simulate being on that subdomain (e.g. <b>bunty</b> for bunty.significia.com). 
              Leave empty for <b>master</b>.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="tenant-slug" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)} 
                className="h-8 text-xs"
              />
              <Button size="sm" onClick={handleApply} className="h-8 px-3">
                <RefreshCcw className="h-3 w-3 mr-1" />
                Apply
              </Button>
            </div>
          </div>

          {activeSlug && (
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-[10px] font-mono">Current: <b>{activeSlug}</b></span>
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-2 text-[10px] text-destructive">
                Reset to Global
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
