"use client";

import React, { useState } from "react";
import {
  Palette, Check, Globe, Edit, Loader2, Save, X,
  FileCheck, ExternalLink, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { toast } from "sonner";
import { getAssetUrl } from "@/core/api/api-utils";
import { useAppStore } from "@/store/useAppStore";

const COLOR_PRESETS = [
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald", hex: "#059669" },
  { name: "Deep Indigo", hex: "#4F46E5" },
  { name: "Sunset Amber", hex: "#D97706" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Slate", hex: "#475569" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Violet", hex: "#7C3AED" },
];

interface BrandingCardProps {
  data: IAMaster;
  onRefresh: () => void;
}

export function BrandingCard({ data, onRefresh }: BrandingCardProps) {
  const { setPublicBranding } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [brandColor, setBrandColor] = useState(data.brand_color || "");
  const [portalTitle, setPortalTitle] = useState(data.portal_title || "");
  const [portalDescription, setPortalDescription] = useState(data.portal_description || "");
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const startEditing = () => {
    setBrandColor(data.brand_color || "");
    setPortalTitle(data.portal_title || "");
    setPortalDescription(data.portal_description || "");
    setFaviconFile(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (brandColor) formData.append("brand_color", brandColor);
      if (portalTitle) formData.append("portal_title", portalTitle);
      if (portalDescription) formData.append("portal_description", portalDescription);
      if (faviconFile) formData.append("ia_favicon", faviconFile);

      // We need at least one field to trigger the update
      formData.append("change_reason_type", "branding_update");
      formData.append("change_reason_text", "Updated portal branding settings");

      if (data.id) {
        await IAMasterService.update(data.id, formData);
      }

      // Force branding refresh so the BrandingProvider picks up changes
      setPublicBranding(null);

      toast.success("Branding settings saved successfully!");
      setIsEditing(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const getFileName = (path: string | undefined) => {
    if (!path) return "";
    return path.split("/").pop()?.split("?")[0] || "";
  };

  const activeColor = brandColor || data.brand_color;

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-primary/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Brand Customization</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Customize your portal&apos;s theme color, title, favicon, and SEO metadata.
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button size="sm" variant="outline" className="gap-2 border-primary/20" onClick={startEditing}>
              <Edit className="w-4 h-4" />
              Customize
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        {/* ── Current / Display Mode ── */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Current Color Display */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Theme Color</h4>
                {data.brand_color ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg shadow-md border border-border" style={{ backgroundColor: data.brand_color }} />
                    <span className="font-mono text-sm text-foreground">{data.brand_color}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Default (Significia Gold)</span>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Portal Title</h4>
                <span className="text-sm text-foreground">{data.portal_title || <span className="text-muted-foreground italic">Using company name</span>}</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Favicon</h4>
                {data.favicon_path ? (
                  <div className="flex items-center gap-2">
                    <img src={getAssetUrl(data.favicon_path)} alt="Favicon" className="w-6 h-6 object-contain" />
                    <span className="text-xs text-muted-foreground truncate">{getFileName(data.favicon_path)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Default</span>
                )}
              </div>
            </div>
            {data.portal_description && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meta Description</h4>
                <p className="text-sm text-foreground/80">{data.portal_description}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className="space-y-8">
            {/* Color Presets */}
            <div className="space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme Color
              </Label>
              <p className="text-xs text-muted-foreground -mt-2">
                Select a preset or enter a custom hex color. This color applies across your entire portal.
              </p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setBrandColor(preset.hex)}
                    className={`
                      group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200
                      ${brandColor === preset.hex
                        ? "border-foreground scale-105 shadow-lg"
                        : "border-transparent hover:border-muted-foreground/30"
                      }
                    `}
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-md transition-transform duration-200 group-hover:scale-110 flex items-center justify-center"
                      style={{ backgroundColor: preset.hex }}
                    >
                      {brandColor === preset.hex && (
                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-3 mt-4">
                <input
                  type="color"
                  value={brandColor || "#2563EB"}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer p-0.5"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setBrandColor(val);
                    }
                  }}
                  placeholder="#2563EB"
                  className="w-32 bg-background/50 font-mono text-sm uppercase"
                  maxLength={7}
                />
                {brandColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBrandColor("")} className="text-xs text-muted-foreground">
                    Reset to Default
                  </Button>
                )}
              </div>
            </div>

            {/* Live Preview */}
            {activeColor && /^#[0-9A-Fa-f]{6}$/.test(activeColor) && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Live Preview</Label>
                <div className="rounded-xl border border-border p-6 bg-card/50 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: activeColor }} />
                    <span className="font-semibold text-foreground">{portalTitle || data.name_of_ia || "Your Portal"}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: activeColor }}>
                      Primary Button
                    </span>
                    <span className="px-4 py-2 rounded-md text-sm font-medium border-2" style={{ borderColor: activeColor, color: activeColor }}>
                      Outline Button
                    </span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: activeColor }}>
                      Active Tab
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full w-2/3" style={{ backgroundColor: activeColor }} />
                    </div>
                    <span className="text-xs text-muted-foreground">Progress</span>
                  </div>
                </div>
              </div>
            )}

            {/* Portal Identity */}
            <div className="space-y-6 pt-4 border-t border-border">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Portal Identity
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Portal Title</Label>
                  <Input
                    value={portalTitle}
                    onChange={(e) => setPortalTitle(e.target.value)}
                    placeholder="e.g. Elite Wealth Management Portal"
                    className="bg-background/50"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Appears in the browser tab. Leave empty to use your company name.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <Input
                    type="file"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    accept=".png,.jpg,.jpeg,.ico"
                    className="bg-background/50 file:bg-primary/10 file:text-primary file:border-none file:rounded-md file:mr-4 file:px-4 cursor-pointer"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Recommended: 32×32 or 64×64 PNG/ICO file.
                  </p>
                  {data.favicon_path && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        Current: {getFileName(data.favicon_path)}
                      </span>
                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={() => window.open(getAssetUrl(data.favicon_path!), "_blank")}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Portal Description (SEO)</Label>
                <Textarea
                  value={portalDescription}
                  onChange={(e) => setPortalDescription(e.target.value)}
                  placeholder="A brief description of your financial advisory portal for search engines..."
                  className="min-h-[80px] bg-background/50"
                  maxLength={160}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Meta description for search engines. Max 160 characters. ({portalDescription.length}/160)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="border-t border-primary/10 bg-muted/20 px-6 py-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
