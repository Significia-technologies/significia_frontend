"use client";

import { SuperAdminGuard } from "@/components/guards/SuperAdminGuard";
import { Topbar } from "@/components/layouts/Topbar";
import { ShieldAlert, Users, History, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SuperAdminGuard>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* We reuse the active Topbar for Auth User context */}
        <Topbar />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Admin Sidebar */}
          <aside className="w-64 border-r bg-muted/40 p-4">
            <div className="mb-6 flex items-center gap-2 px-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive tracking-widest uppercase">Admin Portal</h2>
            </div>
            
            <nav className="space-y-1">
              <Link 
                href="/admin"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50 ${pathname === '/admin' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Clients & Tenants
              </Link>
              
              <Link 
                href="/admin/users"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50 ${pathname.startsWith('/admin/users') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
              >
                <Users className="h-4 w-4" />
                User Management
              </Link>

              <Link 
                href="/admin/logs"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50 ${pathname === '/admin/logs' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
              >
                <History className="h-4 w-4" />
                Audit Logs
              </Link>

              <div className="py-4">
                <Separator className="opacity-10" />
              </div>

              <Link 
                href="/" 
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                &larr; Exit to Dashboard
              </Link>
            </nav>
          </aside>
          
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </SuperAdminGuard>
  );
}
