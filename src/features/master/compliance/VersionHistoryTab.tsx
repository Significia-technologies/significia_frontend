"use client";


import React, { useState, useEffect } from "react";
import {
  History,
  GitBranch,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  FileJson,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SEBIService,
  IAMasterVersion,
  CHANGE_REASON_LABELS,
  ChangeReasonType,
} from "@/core/services/sebi.service";
import { toast } from "sonner";

export function VersionHistoryTab() {
  const [versions, setVersions] = useState<IAMasterVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await SEBIService.getIAVersions();
        setVersions(data);
      } catch {
        toast.error("Failed to load version history");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              IA Master Version History
            </CardTitle>
            <CardDescription className="mt-1">
              Every edit creates an immutable snapshot. Old versions are never
              overwritten — ensuring full SEBI traceability.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {versions.length} versions
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <GitBranch className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">
              No version snapshots recorded yet. Versions are created when the
              IA Master profile is updated.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-primary/20" />

            <div className="space-y-4">
              {versions.map((ver, idx) => {
                const isExpanded = expandedVersion === ver.version_number;
                const isLatest = idx === 0;

                return (
                  <div key={ver.id} className="relative pl-14">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-[18px] top-4 w-3 h-3 rounded-full border-2 ${
                        isLatest
                          ? "bg-emerald-500 border-emerald-500/50"
                          : "bg-background border-primary/40"
                      }`}
                    />

                    <div
                      className={`rounded-xl border transition-all ${
                        isLatest
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-primary/10 bg-card/50 hover:border-primary/20"
                      }`}
                    >
                      {/* Header */}
                      <button
                        className="w-full text-left px-5 py-4 flex items-center justify-between"
                        onClick={() =>
                          setExpandedVersion(isExpanded ? null : ver.version_number)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            className={`font-mono text-xs ${
                              isLatest
                                ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            v{ver.version_number}
                          </Badge>

                          {isLatest && (
                            <Badge className="bg-emerald-500 text-white text-[9px] uppercase tracking-widest">
                              Latest
                            </Badge>
                          )}

                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(ver.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {ver.change_reason_type && (
                            <Badge variant="outline" className="text-[10px]">
                              {CHANGE_REASON_LABELS[
                                ver.change_reason_type as ChangeReasonType
                              ] || ver.change_reason_type}
                            </Badge>
                          )}

                          {ver.changed_fields && ver.changed_fields.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              {ver.changed_fields.length} field
                              {ver.changed_fields.length > 1 ? "s" : ""} changed
                            </span>
                          )}

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="border-t border-primary/10 px-5 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Changed Fields */}
                          {ver.changed_fields && ver.changed_fields.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" />
                                Changed Fields
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {ver.changed_fields.map((field) => (
                                  <Badge
                                    key={field}
                                    variant="outline"
                                    className="text-[10px] font-mono bg-blue-500/5 text-blue-600 border-blue-500/20"
                                  >
                                    {field}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reason */}
                          {ver.change_reason_text && (
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Reason
                              </h4>
                              <p className="text-sm text-foreground/80 bg-muted/30 rounded-lg px-3 py-2">
                                {ver.change_reason_text}
                              </p>
                            </div>
                          )}

                          {/* Snapshot Preview */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <FileJson className="w-3.5 h-3.5" />
                              Full Snapshot (Read-Only)
                            </h4>
                            <pre className="text-[11px] font-mono bg-muted/50 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto border border-primary/10 text-foreground/70">
                              {JSON.stringify(ver.snapshot, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
