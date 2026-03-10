"use client";

import React, { useState } from "react";
import { Settings, Play, Loader2, CheckCircle2, ShieldAlert, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Connector, ConnectorService } from "@/core/services/connector.service";
import { toast } from "sonner";

interface ProvisioningViewProps {
  connector: Connector;
  onSuccess: () => void;
}

export function ProvisioningView({ connector, onSuccess }: ProvisioningViewProps) {
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await ConnectorService.initialize(connector.id);
      if (String(result.status) === "success") {
        toast.success("Database initialized successfully!");
        onSuccess();
      } else {
        toast.error("Initialization failed: " + result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Settings className="w-6 h-6 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Initialize Private Schema</CardTitle>
        </div>
        <CardDescription className="text-lg">
          We found a valid connection to <span className="font-mono text-foreground">{connector.database_name}</span>. 
          The next step is to provision the private <span className="font-mono text-primary">significia_core</span> schema and tables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-md bg-background/50 border border-amber-500/10 space-y-3">
          <p className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">What will happen?</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Create <code className="text-xs bg-muted px-1 py-0.5 rounded">significia_core</code> schema</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Provision <code className="text-xs bg-muted px-1 py-0.5 rounded">customers</code> table</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Setup Audit Log infrastructure</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Grant permissions to your database user</span>
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-md bg-amber-500/10 border border-amber-500/20 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Your existing data will remain completely untouched. 
            Significia only operates within its own private schema.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleInitialize} 
          className="w-full gap-2 h-12 text-lg bg-amber-600 hover:bg-amber-700" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {loading ? "Provisioning Infrastructure..." : "Start Initialization"}
        </Button>
      </CardFooter>
    </Card>
  );
}
