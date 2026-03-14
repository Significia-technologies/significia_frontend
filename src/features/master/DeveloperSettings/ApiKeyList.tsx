"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Trash2, Shield, Globe, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKey, ApiKeyService } from "@/core/services/api-key.service";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ApiKeyList({ apiKeys, isLoading, onRefresh }: ApiKeyListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await ApiKeyService.revoke(deleteId);
      toast.success("API Key revoked successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke key");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-primary/20 rounded-xl bg-muted/10">
        <Shield className="w-12 h-12 text-primary/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">No API Keys Yet</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Generate an API key to allow external applications to securely perform actions on your master database.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {apiKeys.map((key) => (
          <div 
            key={key.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-primary/10 rounded-xl bg-card hover:border-primary/30 transition-colors gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-lg">{key.name}</h4>
                <Badge variant={key.is_active ? "default" : "secondary"}>
                  {key.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Created {format(new Date(key.created_at), "MMM d, yyyy")}</span>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {key.allowed_domains && key.allowed_domains.length > 0 ? (
                  key.allowed_domains.map((domain, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs bg-muted/50">
                      <Globe className="w-3 h-3 mr-1" />
                      {domain}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/50">
                    No explicit domains (Backend Only)
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setDeleteId(key.id)}
              >
                <Trash2 className="w-4 h-4" />
                Revoke Key
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => !isDeleting && setDeleteId(null)}>
        <AlertDialogContent className="border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Revoke API Key?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently revoke this API key? 
              Any external applications using this key will immediately lose access to your data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Revoking..." : "Yes, Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
