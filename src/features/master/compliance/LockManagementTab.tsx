"use client";


import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle2,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { IAMasterService, IAMaster } from "@/core/services/ia-master.service";
import {
  SEBIService,
  ChangeSummaryResponse,
} from "@/core/services/sebi.service";
import { toast } from "sonner";

export function LockManagementTab() {
  const [iaData, setIaData] = useState<IAMaster | null>(null);
  const [changeSummary, setChangeSummary] = useState<ChangeSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Lock Form
  const [lockReason, setLockReason] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Form
  const [unlockReasonType, setUnlockReasonType] = useState("");
  const [unlockReasonText, setUnlockReasonText] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ia, summary] = await Promise.all([
        IAMasterService.getLatest(),
        SEBIService.getChangeSummary().catch(() => null),
      ]);
      setIaData(ia);
      setChangeSummary(summary);
    } catch {
      toast.error("Failed to load lock status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLock = async () => {
    if (!lockReason.trim()) {
      toast.error("Please provide a reason for locking");
      return;
    }
    setIsLocking(true);
    try {
      await SEBIService.lockIAMaster(lockReason);
      toast.success("IA Master record locked successfully");
      setLockReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to lock record");
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlock = async () => {
    const reason = `[${unlockReasonType || "manual"}] ${unlockReasonText}`.trim();
    if (!unlockReasonText.trim()) {
      toast.error("Unlock reason is mandatory for SEBI compliance");
      return;
    }
    setIsUnlocking(true);
    try {
      await SEBIService.unlockIAMaster(reason);
      toast.success("IA Master record unlocked");
      setUnlockReasonType("");
      setUnlockReasonText("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to unlock record");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  const isLocked = (iaData as any)?.is_locked === true;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card
        className={`border-2 transition-colors ${
          isLocked
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-emerald-500/40 bg-emerald-500/5"
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className={`p-4 rounded-2xl ${
                  isLocked ? "bg-amber-500/15" : "bg-emerald-500/15"
                }`}
              >
                {isLocked ? (
                  <Lock className="w-8 h-8 text-amber-600" />
                ) : (
                  <Unlock className="w-8 h-8 text-emerald-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isLocked ? "Record is Locked" : "Record is Unlocked"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLocked
                    ? "The IA Master record is locked. All edit attempts will be rejected until unlocked."
                    : "The IA Master record is editable. Changes will be versioned and audited."}
                </p>
                {isLocked && (iaData as any)?.locked_reason && (
                  <div className="mt-2 text-sm bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                    <span className="font-medium text-amber-700">Reason:</span>{" "}
                    <span className="text-amber-600">
                      {(iaData as any).locked_reason}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(iaData as any)?.version_number && (
                <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                  Version {(iaData as any).version_number}
                </Badge>
              )}
              <Badge
                className={`px-3 py-1 ${
                  isLocked ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                }`}
              >
                {isLocked ? "LOCKED" : "ACTIVE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lock Action */}
        <Card className="border-primary/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Lock Record
            </CardTitle>
            <CardDescription className="text-xs">
              Lock the IA Master record after delivering a report to a client.
              This is a SEBI best-practice to prevent accidental tampering.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Reason for Locking</Label>
              <Textarea
                placeholder="e.g. Report delivered to client on 12/04/2026"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                rows={3}
                disabled={isLocked}
              />
            </div>
            <Button
              className="w-full gap-2"
              variant={isLocked ? "outline" : "default"}
              disabled={isLocked || isLocking}
              onClick={handleLock}
            >
              {isLocking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isLocked ? "Already Locked" : "Lock IA Master"}
            </Button>
          </CardContent>
        </Card>

        {/* Unlock Action */}
        <Card className="border-primary/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Unlock className="w-4 h-4 text-cyan-500" />
              Unlock Record
            </CardTitle>
            <CardDescription className="text-xs">
              Unlocking requires a mandatory reason that is permanently recorded
              in the audit trail for SEBI compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Reason Category</Label>
              <Select
                value={unlockReasonType}
                onValueChange={setUnlockReasonType}
                disabled={!isLocked}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select reason type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_correction">Data Correction</SelectItem>
                  <SelectItem value="client_update">Client Update</SelectItem>
                  <SelectItem value="assumption_change">Assumption Change</SelectItem>
                  <SelectItem value="review_adjustment">Review Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Free Text Reason (Mandatory)</Label>
              <Textarea
                placeholder="e.g. Client requested bank account number correction"
                value={unlockReasonText}
                onChange={(e) => setUnlockReasonText(e.target.value)}
                rows={2}
                disabled={!isLocked}
              />
            </div>
            <Button
              className="w-full gap-2"
              variant={!isLocked ? "outline" : "destructive"}
              disabled={!isLocked || isUnlocking}
              onClick={handleUnlock}
            >
              {isUnlocking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              {!isLocked ? "Not Locked" : "Unlock IA Master"}
            </Button>

            {!isLocked && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-primary/5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  The record is currently unlocked. You can only unlock a locked
                  record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Summary — Embeddable In Reports */}
      {changeSummary && changeSummary.change_history.length > 0 && (
        <Card className="border-primary/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              Change Summary
              <Badge variant="outline" className="text-[10px] ml-2">
                Embeddable in Reports
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Human-readable summary of all IA Master changes. Can be optionally
              included in generated reports for extreme transparency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {changeSummary.change_history.map((entry) => (
                <div
                  key={entry.version}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-primary/5 hover:border-primary/15 transition-colors"
                >
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] shrink-0 mt-0.5"
                  >
                    v{entry.version}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/80">
                      {entry.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEBI Compliance Note */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
        <div className="p-2 rounded-lg bg-emerald-500/15 shrink-0">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-emerald-700">
            SEBI Auditor&apos;s Perspective
          </h4>
          <p className="text-xs text-emerald-600/80">
            If SEBI inspects your system, they will ask: &ldquo;Show me
            how this number was changed.&rdquo; With this system, you can show:
            ✅ Original value, ✅ Updated value, ✅ Reason for change,
            ✅ Timestamp, ✅ Who changed it — all in one audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
