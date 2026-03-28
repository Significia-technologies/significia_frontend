import { SuperAdminGuard } from "@/components/guards/SuperAdminGuard";
import { Topbar } from "@/components/layouts/Topbar";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Admin Portal — Significia",
};

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen bg-background flex flex-col">
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
                className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium transition-colors"
              >
                Clients & Tenants
              </Link>
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
