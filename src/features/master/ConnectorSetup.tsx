"use client";

import React, { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectorService, ConnectorCreate } from "@/core/services/connector.service";
import { toast } from "sonner";

interface ConnectorSetupProps {
  onSuccess: () => void;
}

export function ConnectorSetup({ onSuccess }: ConnectorSetupProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ConnectorCreate>({
    name: "Primary Database",
    type: "postgresql",
    host: "localhost",
    port: 5432,
    database_name: "",
    username: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "port" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const connector = await ConnectorService.create(formData);
      toast.success("Database connector registered!");
      
      // Auto-test connection
      toast.info("Testing connection...");
      const testResult = await ConnectorService.testConnection(connector.id);
      
      if (String(testResult.status) === "success") {
        toast.success("Connection verified!");
        onSuccess();
      } else {
        toast.error("Connected but verification failed: " + testResult.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create connector");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Your Database</CardTitle>
        </div>
        <CardDescription>
          Significia requires a private database to store your financial data. 
          Please provide the credentials for your PostgreSQL instance.
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
                placeholder="Production DB" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Database Type</Label>
              <Input id="type" name="type" value="PostgreSQL" disabled className="bg-muted" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="host">Host / IP Address</Label>
              <Input 
                id="host" 
                name="host" 
                value={formData.host} 
                onChange={handleChange} 
                placeholder="localhost or db.example.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                name="port" 
                type="number" 
                value={formData.port} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="database_name">Database Name</Label>
            <Input 
              id="database_name" 
              name="database_name" 
              value={formData.database_name} 
              onChange={handleChange} 
              placeholder="e.g. significia_db" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="postgres" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 pt-6 mt-4 border-t border-primary/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Credentials are encrypted using AES-256 before storage.</span>
          </div>
          <Button type="submit" className="w-full gap-2 text-lg" disabled={loading}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Database className="w-5 h-5" />
            )}
            {loading ? "Verifying..." : "Connect Database"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
