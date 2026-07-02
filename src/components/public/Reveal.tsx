"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DELAY_CLASS = {
  0: "",
  75: "delay-75",
  100: "delay-100",
  150: "delay-150",
  200: "delay-200",
  300: "delay-300",
  500: "delay-500",
  700: "delay-700",
  1000: "delay-1000",
} as const;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: keyof typeof DELAY_CLASS;
}

/** Fades + slides children in the first time they scroll into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        visible
          ? cn(
              "opacity-100 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
              DELAY_CLASS[delay]
            )
          : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
