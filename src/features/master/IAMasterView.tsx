"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Users, 
  ShieldCheck, 
  Calendar,
  CreditCard,
  ExternalLink,
  Edit,
  Database,
  Pencil,
  Loader2,
  Save,
  X,
  Globe,
  Layout,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import { TenantService, Tenant } from "@/core/services/tenant.service";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAssetUrl } from "@/core/api/api-utils";

export function IAMasterView() {
  const router = useRouter();
  const [data, setData] = useState<IAMaster | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Portal Settings State
  const [isEditingPortal, setIsEditingPortal] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [isSavingPortal, setIsSavingPortal] = useState(false);

  const [isEditingPermit, setIsEditingPermit] = useState(false);
  const [newPermitLimit, setNewPermitLimit] = useState("");
  const [isSavingPermit, setIsSavingPermit] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [latest, tenantData] = await Promise.all([
        IAMasterService.getLatest(),
        TenantService.getMyTenant()
      ]);
      setData(latest);
      setTenant(tenantData);
      setSubdomain(tenantData.subdomain || "");
      setCustomDomain(tenantData.custom_domain || "");
    } catch (error) {
      console.error("Failed to fetch IA Master data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePortal = async () => {
    setIsSavingPortal(true);
    try {
      const updatedTenant = await TenantService.updatePortalSettings({
        subdomain: subdomain || undefined,
        custom_domain: customDomain || undefined
      });
      setTenant(updatedTenant);
      setIsEditingPortal(false);
      toast.success("Portal settings updated successfully");
      
      // Refresh to ensure everything is in sync
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update portal settings");
    } finally {
      setIsSavingPortal(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async () => {
    if (!data) return;
    try {
      toast.info("Generating your PDF report...");
      await IAMasterService.downloadPdf(data.id);
      toast.success("PDF report downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate PDF report");
    }
  };

  const handleSavePermit = async () => {
    if (!data) return;
    const maxPermit = parseInt(newPermitLimit, 10);
    
    if (isNaN(maxPermit) || maxPermit <= 0) {
      toast.error("Please enter a valid number greater than 0");
      return;
    }

    if (maxPermit < data.current_client_count) {
      toast.error(`Cannot set limit below current client count (${data.current_client_count})`);
      return;
    }

    setIsSavingPermit(true);
    try {
      const updatedData = await IAMasterService.updateClientPermit(data.id, maxPermit);
      setData(updatedData);
      setIsEditingPermit(false);
      toast.success("Client limit updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update client limit");
    } finally {
      setIsSavingPermit(false);
    }
  };

  const startEditingPermit = () => {
    if (data) {
      setNewPermitLimit((data.max_client_permit ?? 10).toString());
      setIsEditingPermit(true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-6">
            <ShieldCheck className="w-12 h-12 text-primary opacity-50" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No IA Record Found</h3>
          <p className="text-muted-foreground max-w-md mb-8">
            You haven't registered your Investment Advisor details yet. 
            Once added, your compliance reports and signatures will be managed here.
          </p>
          <Button className="gap-2 px-8" onClick={() => router.push("/master/ia-master/new")}>
            <Building2 className="w-5 h-5" />
            Register IA Master
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Summary Hero Card ────────────────────────── */}
      <Card className="relative overflow-hidden border-primary/10 bg-card/50 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 blur-xl" />
        <CardHeader className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full md:w-auto">
            <div className="w-24 h-24 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {data.ia_logo_path ? (
                <img src={getAssetUrl(data.ia_logo_path)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">{data.name_of_ia}</CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px] px-2 py-0.5 whitespace-nowrap">
                  {data.nature_of_entity}
                </Badge>
              </div>
              <CardDescription className="text-base sm:text-lg mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary/60 shrink-0" />
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    BASL ID: <span className="font-mono text-primary font-bold">{data.basl_membership_id}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l border-primary/20 pl-4">
                  <ShieldCheck className="w-4 h-4 text-primary/60 shrink-0" />
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    Reg No: <span className="font-mono text-primary font-bold">{data.ia_registration_number}</span>
                  </span>
                </div>
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto">
            <div className="flex flex-wrap justify-center md:justify-end gap-2 w-full">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 border-primary/20 hover:bg-primary/5" onClick={handleDownloadPdf}>
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90" onClick={() => router.push("/master/ia-master/new")}>
                <Edit className="w-4 h-4" />
                Update
              </Button>
            </div>
            
            {/* Client Limit Section */}
            <div className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-lg p-3 shadow-sm flex items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Client Limit Usage</span>
                <div className="text-sm font-medium flex items-center">
                  <span className="text-primary">{data.current_client_count ?? 0}</span>
                  <span className="text-muted-foreground mx-2">/</span>
                  {isEditingPermit ? (
                    <div className="inline-flex items-center gap-2">
                      <Input 
                        value={newPermitLimit}
                        onChange={(e) => setNewPermitLimit(e.target.value)}
                        className="w-16 h-7 text-xs px-2 py-0"
                        type="number"
                        min={data.current_client_count ?? 0}
                        disabled={isSavingPermit}
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleSavePermit} disabled={isSavingPermit}>
                        {isSavingPermit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingPermit(false)} disabled={isSavingPermit}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="font-bold flex items-center gap-2">
                      <span>{data.max_client_permit ?? 10}</span>
                      <Button size="icon" variant="ghost" className="h-5 w-5 opacity-50 hover:opacity-100" onClick={startEditingPermit}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8 pt-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact & Location</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground/80 leading-relaxed">{data.registered_address}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/80">{data.registered_contact_number}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-foreground/80">{data.registered_email_id}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Registration Cycle
            </h4>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">Registered on:</span>
              <span className="text-sm font-semibold">{data.date_of_registration}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-primary/10">
              <span className="text-sm text-muted-foreground">Expires on:</span>
              <span className="text-sm font-semibold text-amber-600">{data.date_of_registration_expiry}</span>
            </div>
          </div>

          <div className="space-y-3 border-l md:pl-8 border-primary/10">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Banking Details</h4>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase">Bank Name</span>
                <span className="text-sm font-medium">{data.bank_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-mono">{data.ifsc_code}</span>
                <span className="font-mono">{data.bank_account_number}</span>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-primary/10 flex gap-3">
              {data.ia_certificate_path && (
                <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5" onClick={() => window.open(getAssetUrl(data.ia_certificate_path), '_blank')}>
                  <FileText className="w-3 h-3" />
                  Certificate
                </Button>
              )}
              {data.ia_signature_path && (
                <Button variant="outline" size="xs" className="h-7 text-[10px] gap-1.5" onClick={() => window.open(getAssetUrl(data.ia_signature_path), '_blank')}>
                  <Edit className="w-3 h-3" />
                  Signature
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Portal & White-labeling ────────────────────────── */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-primary/10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Portal Branding & Domain</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your white-labeled URL and client-facing portal settings.</CardDescription>
              </div>
            </div>
            {!isEditingPortal ? (
              <Button size="sm" variant="outline" className="gap-2 border-primary/20" onClick={() => setIsEditingPortal(true)}>
                <Edit className="w-4 h-4" />
                Configure Portal
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditingPortal(false)}>Cancel</Button>
                <Button size="sm" className="gap-2" onClick={handleSavePortal} disabled={isSavingPortal}>
                  {isSavingPortal && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Subdomain Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Portal Subdomain</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input 
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                      placeholder="IA-slug"
                      disabled={!isEditingPortal}
                      className="pr-32 font-mono"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                      .significia.com
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Your clients can access the portal directly at <span className="text-primary font-mono">{subdomain || 'your-slug'}.significia.com</span>
                </p>
              </div>
            </div>

            {/* Custom Domain Configuration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Custom Private Domain</h4>
              </div>
              <div className="space-y-2">
                <Input 
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                  placeholder="e.g. portal.voltfleet.in"
                  disabled={!isEditingPortal}
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Point your domain (A record) to <span className="text-primary font-bold">123.45.67.89</span> to enable fully white-labeled access.
                </p>
              </div>
            </div>
          </div>

          {!isEditingPortal && (tenant?.subdomain || tenant?.custom_domain) && (
            <div className="mt-4 p-4 rounded-xl bg-background/50 border border-primary/10 flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold">White-labeling Active</h5>
                <p className="text-xs text-muted-foreground italic">
                  SEBI Regulation Note: Your portal is now correctly isolated on your own domain. All client PII data stays in your Bridge.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tenant?.subdomain && (
                    <Badge variant="outline" className="text-[10px] font-mono cursor-pointer hover:bg-primary/5" onClick={() => window.open(`https://${tenant.subdomain}.significia.com`, '_blank')}>
                      {tenant.subdomain}.significia.com <ExternalLink className="w-2 h-2 ml-1" />
                    </Badge>
                  )}
                  {tenant?.custom_domain && (
                    <Badge variant="outline" className="text-[10px] font-mono cursor-pointer hover:bg-primary/5" onClick={() => window.open(`http://${tenant.custom_domain}`, '_blank')}>
                      {tenant.custom_domain} <ExternalLink className="w-2 h-2 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
