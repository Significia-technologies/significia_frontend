"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isOnDarkHero = !isScrolled && (pathname === "/" || pathname === "");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-slate-950/95 backdrop-blur-xl border-b border-white/8 shadow-xl shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Significia"
                width={30}
                height={30}
                className="h-[30px] w-[30px] object-contain"
              />
            </div>
            <span
              className={cn(
                "text-[17px] font-semibold tracking-tight transition-colors",
                isOnDarkHero ? "text-white" : "text-foreground"
              )}
            >
              Significia
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-[13.5px] font-medium transition-colors duration-150",
                  pathname === link.href
                    ? "text-primary"
                    : isOnDarkHero
                    ? "text-white/60 hover:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                "text-[13.5px] font-medium transition-colors duration-150 px-3 py-2",
                isOnDarkHero
                  ? "text-white/60 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Log in
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-150 hover:shadow-primary/40"
            >
              Request Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={cn(
              "md:hidden p-2 rounded-md transition-colors",
              isOnDarkHero
                ? "text-white/60 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-white/8 bg-slate-950/98 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-3 pb-5 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link
                href="/login"
                className="block w-full text-center rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:border-white/25 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/contact"
                className="block w-full text-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
