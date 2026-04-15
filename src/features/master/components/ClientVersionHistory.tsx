"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Clock,
  ArrowRight,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  CalendarSearch,
  CheckCircle2,
  Circle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MasterDataService,
  ClientVersionSummary,
  ClientVersionDetail,
} from "@/core/services/master.service";
import { toast } from "sonner";

interface ClientVersionHistoryProps {
  clientId: string;
  clientName: string;
}

export function ClientVersionHistory({ clientId, clientName }: ClientVersionHistoryProps) {
  const [versions, setVersions] = useState<ClientVersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<ClientVersionDetail | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [dateSearchResult, setDateSearchResult] = useState<ClientVersionDetail | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [clientId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await MasterDataService.listClientVersions(clientId);
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Failed to load versions", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (versionId: string) => {
    if (selectedVersion?.id === versionId) {
      setSelectedVersion(null);
      return;
    }
    setLoadingVersion(true);
    try {
      const data = await MasterDataService.getClientVersion(clientId, versionId);
      setSelectedVersion(data);
    } catch (error) {
      toast.error("Failed to load version details");
    } finally {
      setLoadingVersion(false);
    }
  };

  const handleDateSearch = async () => {
    if (!searchDate) {
      toast.error("Please enter a date");
      return;
    }
    setSearching(true);
    setDateSearchResult(null);
    try {
      const data = await MasterDataService.getClientVersionAtDate(clientId, searchDate);
      setDateSearchResult(data);
      toast.success(`Found version ${data.version_number} active on ${searchDate}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || `No version found for date ${searchDate}`);
    } finally {
      setSearching(false);
    }
  };

  const handleDownloadSnapshot = (snapshot: Record<string, any>, versionNumber: number) => {
    const content = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${clientName.replace(/\s+/g, "_")}_Version_${versionNumber}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`Version ${versionNumber} downloaded`);
  };

  const handleDownloadPDF = async (versionId: string, versionNumber: number) => {
    setDownloadingPdf(versionId);
    try {
      await MasterDataService.downloadClientVersionPDF(
        clientId,
        versionId,
        clientName,
        versionNumber
      );
      toast.success(`PDF Report for version ${versionNumber} downloaded`);
    } catch (error) {
      console.error("Failed to download PDF", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const SnapshotViewer = ({ snapshot, versionId, versionNumber }: { snapshot: Record<string, any>; versionId: string; versionNumber: number }) => {
    // Field display categories
    const IDENTITY_FIELDS = ["client_name", "user_name", "email", "client_code", "pan_number", "date_of_birth", "phone_number", "aadhar_number"];
    const FINANCIAL_FIELDS = ["annual_income", "net_worth", "income_source", "occupation", "existing_portfolio_value"];
    const ADDRESS_FIELDS = ["address", "tax_residency", "residential_status", "nationality"];
    const INVESTMENT_FIELDS = ["risk_profile", "investment_horizon", "investment_experience", "investment_objectives", "liquidity_needs"];

    const renderSection = (title: string, fields: string[]) => {
      const displayableFields = fields.filter(f => snapshot[f] != null && snapshot[f] !== "");
      if (displayableFields.length === 0) return null;

      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1">
            {title}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {displayableFields.map((field) => (
              <div key={field} className="flex justify-between items-baseline py-1">
                <span className="text-xs text-muted-foreground capitalize">
                  {field.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-medium text-right max-w-[60%] truncate">
                  {typeof snapshot[field] === "object"
                    ? JSON.stringify(snapshot[field])
                    : String(snapshot[field])}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-primary">
            Version {versionNumber} — Full Snapshot
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => handleDownloadSnapshot(snapshot, versionNumber)}
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/5"
              disabled={downloadingPdf === versionId}
              onClick={() => handleDownloadPDF(versionId, versionNumber)}
            >
              {downloadingPdf === versionId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF Report
            </Button>
          </div>
        </div>
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-5 max-h-[500px] overflow-y-auto">
          {renderSection("Identity", IDENTITY_FIELDS)}
          {renderSection("Financial", FINANCIAL_FIELDS)}
          {renderSection("Address & Residency", ADDRESS_FIELDS)}
          {renderSection("Investment Profile", INVESTMENT_FIELDS)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SEBI Date Search */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CalendarSearch className="w-5 h-5 text-primary" />
            Point-in-Time Query
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Enter a date to find which version of this client was active at that time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="datetime-local"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 bg-background border-primary/20"
              placeholder="Select date..."
            />
            <Button
              onClick={handleDateSearch}
              disabled={searching || !searchDate}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>

          {dateSearchResult && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/5 border border-green-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700">
                    Version {dateSearchResult.version_number} was active
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-green-500/30 text-green-700 hover:bg-green-50"
                    disabled={downloadingPdf === dateSearchResult.id}
                    onClick={() => handleDownloadPDF(dateSearchResult.id, dateSearchResult.version_number)}
                  >
                    {downloadingPdf === dateSearchResult.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-green-500/30 text-green-700 hover:bg-green-50"
                    onClick={() => handleDownloadSnapshot(dateSearchResult.snapshot, dateSearchResult.version_number)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setDateSearchResult(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Active from: <span className="font-mono">{formatDate(dateSearchResult.valid_from)}</span></p>
                <p>Active until: <span className="font-mono">{dateSearchResult.valid_to ? formatDate(dateSearchResult.valid_to) : "Current (still active)"}</span></p>
                {dateSearchResult.change_reason && (
                  <p>Reason: <span className="italic">{dateSearchResult.change_reason}</span></p>
                )}
              </div>
              <div className="mt-3">
                <SnapshotViewer 
                  snapshot={dateSearchResult.snapshot} 
                  versionId={dateSearchResult.id}
                  versionNumber={dateSearchResult.version_number} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Timeline */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Version Timeline
            <Badge variant="secondary" className="ml-2 text-xs font-mono">
              {versions.length} version{versions.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No version history available yet.</p>
              <p className="text-xs mt-1">Versions are created automatically when client data is updated.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {versions.map((version, index) => (
                <div key={version.id} className="relative">
                  {/* Timeline Connector */}
                  {index < versions.length - 1 && (
                    <div className="absolute left-[19px] top-[44px] bottom-0 w-0.5 bg-border/60" />
                  )}

                  <div
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer hover:bg-muted/40 
                      ${selectedVersion?.id === version.id ? "bg-primary/5 border border-primary/20" : ""}`}
                    onClick={() => handleViewVersion(version.id)}
                  >
                    {/* Timeline Dot */}
                    <div className="mt-1 shrink-0">
                      {version.is_current ? (
                        <div className="w-[10px] h-[10px] rounded-full bg-green-500 ring-4 ring-green-500/20" />
                      ) : (
                        <div className="w-[10px] h-[10px] rounded-full bg-muted-foreground/30 ring-4 ring-muted/40" />
                      )}
                    </div>

                    {/* Version Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">
                          Version {version.version_number}
                        </span>
                        {version.is_current && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-bold">
                            CURRENT
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.valid_from)}
                        </span>
                        {version.valid_to && (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <span>{formatDate(version.valid_to)}</span>
                          </>
                        )}
                      </div>
                      {version.change_reason && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">
                          &ldquo;{version.change_reason}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewVersion(version.id);
                        }}
                      >
                        {selectedVersion?.id === version.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Snapshot */}
                  {selectedVersion?.id === version.id && (
                    <div className="ml-10 mr-4 mb-4">
                      {loadingVersion ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading snapshot...</span>
                        </div>
                      ) : (
                        <SnapshotViewer
                          snapshot={selectedVersion.snapshot}
                          versionId={selectedVersion.id}
                          versionNumber={selectedVersion.version_number}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
