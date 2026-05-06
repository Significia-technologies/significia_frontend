import { create } from "zustand";
import type { User } from "@/core/services/auth.service";

export type BridgeStatus = "UNKNOWN" | "PENDING" | "REGISTERED" | "ACTIVE" | "OFFLINE" | "REVOKED";

// ── App State Interface ─────────────────────────────

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Mobile Menu
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Auth User (client-side cache of the logged-in user)
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;

  // Bridge Status — used to gate the Master hub and show Bridge health
  // UNKNOWN = not yet fetched
  // PENDING = IA registered but Bridge not yet installed
  // REGISTERED = Bridge installed, awaiting first heartbeat
  // ACTIVE = Bridge online and communicating
  // OFFLINE = Bridge was active but missed heartbeat
  // REVOKED = Super Admin killed the Bridge
  bridgeStatus: BridgeStatus;
  setBridgeStatus: (status: BridgeStatus) => void;

  // Branding (Public metadata for white-labeling)
  publicBranding: {
    name: string;
    is_master: boolean;
    logo_type: "significia" | "shield" | "custom";
    logo_url?: string | null;
    brand_color?: string | null;
    portal_title?: string | null;
    portal_description?: string | null;
    favicon_url?: string | null;
  } | null;
  setPublicBranding: (branding: AppState["publicBranding"]) => void;

  // Tenant/IA identification for the current session
  tenantName: string;
  setTenantName: (name: string) => void;
}

// ── Zustand Store ───────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // ── Sidebar ──
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // ── Mobile Menu ──
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // ── User ──
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  // ── Bridge Status ──
  bridgeStatus: "UNKNOWN",
  setBridgeStatus: (status) => set({ bridgeStatus: status }),

  // ── Public Branding ──
  publicBranding: null,
  setPublicBranding: (branding) => set({ publicBranding: branding }),

  // ── Tenant Name ──
  tenantName: "",
  setTenantName: (name) => set({ tenantName: name }),
}));
