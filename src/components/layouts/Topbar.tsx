"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, LogOut, User, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

import Image from "next/image";

interface TopbarProps {
  showSearch?: boolean;
  showLogo?: boolean;
}

export function Topbar({ showSearch = false, showLogo = false }: TopbarProps) {
  const router = useRouter();
  const { user, clearUser, setMobileMenuOpen } = useAppStore();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } finally {
      clearUser();
      router.push("/login");
    }
  };

  const displayName = user ? user.company_name : null;

  const initials = user && user.company_name
    ? user.company_name.substring(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-3 md:px-4 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* ── Mobile Menu Toggle ── */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ── Logo ── */}
        {showLogo && (
          <Link href="/" className="flex items-center gap-2.5">
            <Image 
              src="/logo.png" 
              alt="Significia Logo" 
              width={32} 
              height={32} 
              className="h-8 w-8 object-contain"
              priority
            />
            <span className="hidden text-lg font-bold tracking-tight md:block">
              Significia
            </span>
          </Link>
        )}

        {/* ── Search Bar ── */}
        {showSearch && (
          <div className="relative hidden w-full max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions, accounts..."
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        
        {/* Notifications */}
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
            3
          </Badge>
        </Button> */}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {displayName && (
                <span className="hidden text-sm font-medium md:inline-block">
                  {displayName}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
