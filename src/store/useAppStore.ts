import { create } from "zustand";
import type { User } from "@/core/services/auth.service";

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
}

// ── Zustand Store ───────────────────────────────────
export const useAppStore = create<AppState>((set) => ({
  // ── Sidebar ──
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // ── Mobile Menu ──
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // ── User ──
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
