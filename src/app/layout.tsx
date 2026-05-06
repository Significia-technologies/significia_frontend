import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal — Significia",
  description:
    "Enterprise-grade financial analytics, transaction management, and investment tracking dashboard.",
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";
import { Toaster } from "@/components/ui/sonner";

import { DevelopmentFooter } from "@/components/dev/DevelopmentFooter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-foreground bg-background uppercase-none`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <BrandingProvider>
            {children}
            <Toaster position="top-right" richColors />
            <DevelopmentFooter />
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
