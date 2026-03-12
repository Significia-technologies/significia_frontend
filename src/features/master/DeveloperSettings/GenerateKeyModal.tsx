"use client";

import React, { useState } from "react";
import { Loader2, Key, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiKeyService, ApiKeyCreateData } from "@/core/services/api-key.service";
import { toast } from "sonner";

interface GenerateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateKeyModal({ isOpen, onClose, onSuccess }: GenerateKeyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ApiKeyCreateData>({
    name: "",
    allowed_domains: [""], // Start with one empty domain field
  });
  
  // State to hold the generated key to show to the user
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...formData.allowed_domains];
    newDomains[index] = value;
    setFormData({ ...formData, allowed_domains: newDomains });
  };

  const addDomainField = () => {
    setFormData({ ...formData, allowed_domains: [...formData.allowed_domains, ""] });
  };

  const removeDomainField = (index: number) => {
    const newDomains = formData.allowed_domains.filter((_, i) => i !== index);
    setFormData({ ...formData, allowed_domains: newDomains });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedKey) return; // Prevent double submit if key is already shown
    
    setLoading(true);
    try {
      // Filter out empty domains
      const cleanedData = {
        ...formData,
        allowed_domains: formData.allowed_domains.filter(d => d.trim() !== ""),
      };
      
      const response = await ApiKeyService.create(cleanedData);
      setGeneratedKey(response.plain_key || null);
      toast.success("API Key generated successfully");
      onSuccess(); // Refresh the list in the parent
    } catch (error: any) {
      toast.error(error.message || "Failed to generate API Key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setFormData({ name: "", allowed_domains: [""] });
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            {generatedKey ? "Save Your Secret Key" : "Generate New API Key"}
          </DialogTitle>
          <DialogDescription>
            {generatedKey 
              ? "Please copy this secret key now. You will not be able to see it again after closing this window."
              : "Create an API key to securely connect your custom websites or apps to your data."}
          </DialogDescription>
        </DialogHeader>

        {generatedKey ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 border border-primary/20 rounded-lg space-y-3">
              <Label>Your Secret API Key</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={generatedKey} 
                  className="font-mono text-primary bg-background/50 selection:bg-primary/20"
                />
                <Button 
                  variant="secondary" 
                  size="icon" 
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-destructive font-medium">
                Warning: Do not share this key. Store it securely.
              </p>
            </div>
            <DialogFooter className="pt-4 mt-6 border-t border-primary/5">
              <Button onClick={handleClose} className="w-full">
                I have saved my key
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Website Production"
                required
                className="bg-background/50 border-primary/10"
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Allowed Domains (CORS)</Label>
              <p className="text-xs text-muted-foreground">
                Specify which domains are allowed to use this key (e.g. https://your-domain.com).
                Leave empty if used only backend-to-backend.
              </p>
              
              {formData.allowed_domains.map((domain, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      value={domain}
                      onChange={(e) => handleDomainChange(index, e.target.value)}
                      placeholder="https://..."
                      className="bg-background/50 border-primary/10 font-mono text-sm"
                    />
                    {formData.allowed_domains.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeDomainField(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addDomainField}
                className="text-xs mt-2"
              >
                + Add Another Domain
              </Button>
            </div>

            <DialogFooter className="pt-4 mt-6 border-t border-primary/5">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {loading ? "Generating..." : "Generate Key"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
