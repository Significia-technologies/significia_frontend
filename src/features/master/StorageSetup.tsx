"use client";

import React, { useState } from "react";
import { Cloud, Loader2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageService, StorageConnectorCreate } from "@/core/services/storage.service";
import { toast } from "sonner";

interface StorageSetupProps {
  connectorId: string;
  onSuccess: () => void;
}

export function StorageSetup({ connectorId, onSuccess }: StorageSetupProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<StorageConnectorCreate>({
    name: "Primary Storage",
    provider: "S3",
    bucket_name: "",
    region: "ap-south-1",
    endpoint_url: "",
    access_key_id: "",
    secret_key: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const connector = await StorageService.create(connectorId, formData);
      toast.success("Storage connector registered!");
      
      // Auto-test connection
      toast.info("Testing storage connection...");
      const testResult = await StorageService.verify(connectorId, connector.id);
      
      if (testResult.status === "success") {
        toast.success("Storage verified successfully!");
        onSuccess();
      } else {
        toast.error("Connected but verification failed: " + testResult.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create storage connector");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cloud className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Storage</CardTitle>
        </div>
        <CardDescription>
          Production financial documents must be stored in your private cloud bucket.
          Please provide your AWS S3 or S3-compatible storage credentials.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Friendly Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Advisor S3 Storage" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Storage Provider</Label>
              <Input id="provider" name="provider" value="S3 / S3-Compatible" disabled className="bg-muted" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bucket_name">Bucket Name</Label>
            <Input 
              id="bucket_name" 
              name="bucket_name" 
              value={formData.bucket_name} 
              onChange={handleChange} 
              placeholder="e.g. my-company-documents" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input 
                id="region" 
                name="region" 
                value={formData.region} 
                onChange={handleChange} 
                placeholder="e.g. ap-south-1" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint_url">Endpoint URL (Optional)</Label>
              <Input 
                id="endpoint_url" 
                name="endpoint_url" 
                value={formData.endpoint_url} 
                onChange={handleChange} 
                placeholder="https://s3.amazonaws.com" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access_key_id">Access Key ID</Label>
              <Input 
                id="access_key_id" 
                name="access_key_id" 
                value={formData.access_key_id} 
                onChange={handleChange} 
                placeholder="AKIA..." 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Access Key</Label>
              <Input 
                id="secret_key" 
                name="secret_key" 
                type="password" 
                value={formData.secret_key} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 pt-6 mt-4 border-t border-primary/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Credentials are encrypted and stored securely for isolation.</span>
          </div>
          <Button type="submit" className="w-full gap-2 text-lg" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Cloud className="w-5 h-5" />
            )}
            {loading ? "Verifying Storage..." : "Connect Storage"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
