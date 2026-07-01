"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Sun, Moon, Monitor, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, clearUser } = useAppStore();
  const router = useRouter();

  const handleLogout = async () => {
    setOpen(false);
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

  const trigger = collapsed ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-9 rounded-md hover:bg-accent"
        >
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm border-primary/20 bg-background/95 backdrop-blur-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-xs font-black uppercase tracking-widest text-primary/60">Settings</DialogTitle>
        </DialogHeader>

        {/* Profile */}
        <div className="px-5 pb-4 flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0">
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

        {/* Theme */}
        <div className="px-5 py-4 space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "light", label: "Light", icon: Sun },
              { value: "dark",  label: "Dark",  icon: Moon },
              { value: "system",label: "System",icon: Monitor },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-bold uppercase tracking-wider transition-all",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Logout */}
        <div className="px-5 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-destructive hover:text-destructive hover:bg-destructive/10 font-bold text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
