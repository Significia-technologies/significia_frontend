"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Users, History, LayoutDashboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <ShieldAlert className="h-5 w-5 text-destructive" />
        <h2 className="text-sm font-semibold text-destructive tracking-widest uppercase italic">Admin Portal</h2>
      </div>
      
      <nav className="flex-1 space-y-1">
        <Link 
          href="/admin"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
            pathname === '/admin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Clients & Tenants
        </Link>
        
        <Link 
          href="/admin/users"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
            pathname.startsWith('/admin/users') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <Users className="h-4 w-4" />
          User Management
        </Link>

        <Link 
          href="/admin/logs"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
            pathname === '/admin/logs' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
          )}
        >
          <History className="h-4 w-4" />
          Audit Logs
        </Link>

        <div className="py-4">
          <Separator className="opacity-10" />
        </div>

        <Link 
          href="/" 
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-accent/30"
        >
          &larr; Exit to Dashboard
        </Link>
      </nav>
    </div>
  );
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  return (
    <aside className={cn("hidden w-64 border-r bg-muted/40 md:block", className)}>
      <AdminSidebarContent />
    </aside>
  );
}
