"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Sun, Moon, Monitor, Settings, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AuthService } from "@/core/services/auth.service";

interface SettingsDialogProps {
  collapsed?: boolean;
}

export function SettingsDialog({ collapsed = false }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { user, clearUser } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } finally {
      clearUser();
      router.push("/login");
    }
  };

  const initials = user?.company_name
    ? user.company_name.substring(0, 2).toUpperCase()
    : user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : "U";

  const displayName = user?.company_name || user?.name || "Account";
  const email = user?.email || "";
  const role = user?.role || "";

  const triggerButton = collapsed ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="w-full h-9 rounded-md hover:bg-accent">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">Settings</TooltipContent>
    </Tooltip>
  ) : (
    <Button
      variant="ghost"
      className="w-full h-10 px-2.5 flex items-center gap-2.5 justify-between rounded-md hover:bg-accent group"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate text-foreground">{displayName}</span>
      </div>
      <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-72 p-0 border-primary/20 bg-background/95 backdrop-blur-md shadow-xl overflow-hidden"
      >
        {/* Profile */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{displayName}</p>
            {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
            {role && (
              <Badge className="mt-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                {role.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* Appearance */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Appearance</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { value: "light",  label: "Light",  icon: Sun },
              { value: "dark",   label: "Dark",   icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="px-2 py-2 space-y-0.5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 px-2.5 text-sm font-medium text-foreground hover:bg-accent rounded-md"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/50" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 px-2.5 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
