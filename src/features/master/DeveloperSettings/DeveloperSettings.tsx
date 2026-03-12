"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Terminal, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKeyList } from "./ApiKeyList";
import { GenerateKeyModal } from "./GenerateKeyModal";
import { ApiKey, ApiKeyService } from "@/core/services/api-key.service";
import { toast } from "sonner";

export function DeveloperSettings() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ApiKeyService.list();
      setApiKeys(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            Developer Settings
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Manage your API keys to connect your Sovereign Data Engine to custom websites, 
            mobile apps, and external tools safely.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Generate New Key
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6">
        <div className="bg-card/50 backdrop-blur-xl border border-primary/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/10">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Active API Credentials</h2>
          </div>
          
          <ApiKeyList 
            apiKeys={apiKeys} 
            isLoading={isLoading} 
            onRefresh={fetchKeys} 
          />
        </div>
      </div>

      <GenerateKeyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchKeys} 
      />
    </div>
  );
}
