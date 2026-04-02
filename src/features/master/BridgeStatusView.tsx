"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  WifiOff,
  Shield,
  Terminal,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { BridgeStatus } from "@/store/useAppStore";

interface BridgeStatusViewProps {
  bridgeStatus: BridgeStatus;
  tenantName?: string | null;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<BridgeStatus, {
  icon: React.ReactNode;
  label: string;
  color: string;
  description: string;
}> = {
  UNKNOWN: {
    icon: <Clock className="w-5 h-5" />,
    label: "Checking...",
    color: "bg-muted text-muted-foreground",
    description: "Fetching Bridge status from the server.",
  },
  PENDING: {
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    label: "Awaiting Installation",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    description: "Your Bridge has not been installed yet. Follow the steps below to get started.",
  },
  REGISTERED: {
    icon: <Shield className="w-5 h-5 text-blue-500" />,
    label: "Registered — Awaiting Heartbeat",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    description: "Bridge is installed and registered. Waiting for the first health signal.",
  },
  ACTIVE: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description: "Your Bridge is online and communicating securely.",
  },
  OFFLINE: {
    icon: <WifiOff className="w-5 h-5 text-red-500" />,
    label: "Offline",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    description: "Your Bridge has gone offline. Please restart it on your server.",
  },
  REVOKED: {
    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    label: "Revoked",
    color: "bg-red-600/10 text-red-700 border-red-600/20",
    description: "Bridge access has been revoked. Contact Significia support.",
  },
};

const INSTALL_STEPS = [
  {
    step: 1,
    title: "Get your Registration Token",
    description: "Contact Significia to receive your unique Bridge Registration Token during onboarding.",
    code: null,
  },
  {
    step: 2,
    title: "Install Docker on your server",
    description: "The Bridge runs as a lightweight Docker container — no manual Python setup needed.",
    code: "# Install Docker (Ubuntu)\ncurl -fsSL https://get.docker.com | sh",
  },
  {
    step: 3,
    title: "Download and configure the Bridge",
    description: "Clone the Bridge repository and configure your local credentials.",
    code: "git clone https://github.com/significia/bridge.git\ncd bridge\ncp .env.example .env\n# Edit .env with your DB credentials and registration token",
  },
  {
    step: 4,
    title: "Start the Bridge",
    description: "One command to start. The Bridge automatically registers itself with Significia.",
    code: "docker compose up -d",
  },
];

export function BridgeStatusView({ bridgeStatus, tenantName, onRefresh }: BridgeStatusViewProps) {
  const config = STATUS_CONFIG[bridgeStatus];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const isOffline = bridgeStatus === "OFFLINE" || bridgeStatus === "REVOKED";
  const needsInstall = bridgeStatus === "PENDING" || bridgeStatus === "UNKNOWN";

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {/* Status Card */}
      <Card className="border-primary/10 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Bridge Status</CardTitle>
                <CardDescription className="mt-1">
                  {tenantName ? `For ${tenantName}` : "Your secure data gateway"}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-primary/20">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${config.color}`}>
            {config.icon}
            <div>
              <div className="font-semibold">{config.label}</div>
              <div className="text-sm opacity-80 mt-0.5">{config.description}</div>
            </div>
          </div>

          {bridgeStatus === "OFFLINE" && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border text-sm">
              <p className="font-medium mb-2">To restore access, run on your server:</p>
              <div className="relative">
                <code className="block bg-background p-3 rounded-lg font-mono text-xs">
                  docker compose up -d
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-7 w-7"
                  onClick={() => copyToClipboard("docker compose up -d")}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
        <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Your data stays on your infrastructure — always.</p>
          <p className="mt-1 opacity-80">
            The Bridge runs on your own server. Your database password and storage credentials are
            stored only in your local <code className="font-mono text-xs bg-emerald-500/10 px-1 rounded">.env</code> file
            and are never sent to Significia.
          </p>
        </div>
      </div>

      {/* Installation Guide */}
      {(needsInstall || isOffline) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            {isOffline ? "Restart Your Bridge" : "Installation Guide"}
          </h2>
          <div className="space-y-3">
            {INSTALL_STEPS.map((s) => (
              <Card key={s.step} className="border-primary/10 bg-card/40">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {s.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                      {s.code && (
                        <div className="relative mt-3">
                          <pre className="bg-muted/80 p-3 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {s.code}
                          </pre>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-1.5 right-1.5 h-7 w-7"
                            onClick={() => copyToClipboard(s.code!)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button asChild variant="outline" className="gap-2 border-primary/20">
              <a href="https://docs.significia.com/bridge" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                Full Documentation
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <a href="mailto:support@significia.com">Need help? Contact support</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
