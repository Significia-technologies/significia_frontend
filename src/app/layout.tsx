import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Significia — Financial Analysis Software",
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
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background`}>
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
