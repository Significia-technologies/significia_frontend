"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderOpen, ChevronRight, File, ArrowLeft, ShieldCheck, Users, Briefcase, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataService } from "@/core/services/master.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import { DocumentVault } from "@/features/master/components/DocumentVault";

type FolderType = "CLIENT" | "IA_MASTER" | "PARTNERS";

interface DrawerFolder {
  id: string;
  name: string;
  code?: string;
  type: FolderType;
  documents: any[];
  icon: React.ElementType;
  badge?: string;
}

export default function DrawersPage() {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<DrawerFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<DrawerFolder | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Bridge Architecture — no connector, tenant resolved from JWT
      const [clientsData, iaMasterData] = await Promise.all([
        MasterDataService.listClients().catch(() => []),
        IAMasterService.getLatest().catch(() => null),
      ]);

      const systemFolders: DrawerFolder[] = [];

      if (iaMasterData) {
        const iaDocs = [
          { id: "1", document_type: "IA Certificate", file_path: iaMasterData.ia_certificate_path, uploaded_at: iaMasterData.created_at || new Date().toISOString() },
          { id: "2", document_type: "IA Signature", file_path: iaMasterData.ia_signature_path, uploaded_at: iaMasterData.created_at || new Date().toISOString() },
          { id: "3", document_type: "IA Logo", file_path: iaMasterData.ia_logo_path, uploaded_at: iaMasterData.created_at || new Date().toISOString() },
        ].filter((f) => f.file_path);

        systemFolders.push({
          id: iaMasterData.id,
          name: iaMasterData.name_of_ia || "IA Master Setup",
          code: iaMasterData.ia_registration_number,
          type: "IA_MASTER",
          documents: iaDocs,
          icon: ShieldCheck,
          badge: "System",
        });

        if (iaMasterData.employees && iaMasterData.employees.length > 0) {
          const partnerDocs: any[] = [];
          
          iaMasterData.employees.forEach((emp: any, i: number) => {
            if (emp.certificate_path) {
              partnerDocs.push({
                id: `${emp.id || String(i)}-cert`,
                document_type: `Certificate - ${emp.name_of_employee || emp.name}`,
                file_path: emp.certificate_path,
                uploaded_at: emp.created_at || iaMasterData.created_at || new Date().toISOString(),
              });
            }
            if (emp.signature_path) {
              partnerDocs.push({
                id: `${emp.id || String(i)}-sig`,
                document_type: `Signature - ${emp.name_of_employee || emp.name}`,
                file_path: emp.signature_path,
                uploaded_at: emp.created_at || iaMasterData.created_at || new Date().toISOString(),
              });
            }
          });

          systemFolders.push({
            id: "partners-global",
            name: "Partner Certificates & Signatures",
            code: `${iaMasterData.employees.length} Partners`,
            type: "PARTNERS",
            documents: partnerDocs,
            icon: Users,
            badge: "System",
          });
        }
      }

      const clients = Array.isArray(clientsData) ? clientsData : (clientsData?.clients || []);
      
      const fullClients = await Promise.all(
        clients.map(async (client: any) => {
          try {
            return await MasterDataService.getClient(client.id);
          } catch (e) {
            console.error("Failed to load client details for", client.id, e);
            return client;
          }
        })
      );

      const clientFolders: DrawerFolder[] = fullClients.map((client) => ({
        id: client.id,
        name: client.client_name,
        code: client.client_code,
        type: "CLIENT",
        documents: client.documents || [],
        icon: Briefcase,
      }));

      setFolders([...systemFolders, ...clientFolders]);
    } catch (e) {
      console.error("Failed to fetch drawers data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadFolderDocuments = async (folder: DrawerFolder) => {
    if (folder.type !== "CLIENT") return;
    try {
      const updatedClient = await MasterDataService.getClient(folder.id);
      const newDocState = updatedClient.documents || [];
      setActiveFolder(prev => prev && prev.id === folder.id ? { ...prev, documents: newDocState } : prev);
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, documents: newDocState } : f)));
    } catch (e) {
      console.error("Failed to load folder documents", e);
    }
  };

  const reloadActiveFolder = async () => {
    if (!activeFolder || activeFolder.type !== "CLIENT") return;
    try {
      const updatedClient = await MasterDataService.getClient(activeFolder.id);
      const newDocState = updatedClient.documents || [];
      setActiveFolder({ ...activeFolder, documents: newDocState });
      setFolders((prev) => prev.map((f) => (f.id === activeFolder.id ? { ...f, documents: newDocState } : f)));
    } catch (e) {
      console.error("Failed to reload active folder", e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 pb-4">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <h1
            className={`flex items-center gap-2 cursor-pointer transition-colors ${activeFolder ? "text-muted-foreground hover:text-foreground" : "text-primary"}`}
            onClick={() => setActiveFolder(null)}
          >
            <FolderOpen className="w-6 h-6" />
            Drawers Dashboard
          </h1>
          {activeFolder && (
            <>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
              <span className="text-primary flex items-center gap-2">
                {React.createElement(activeFolder.icon, { className: "w-5 h-5 fill-primary/10" })}
                {activeFolder.name}
              </span>
            </>
          )}
        </div>

        {!activeFolder && folders.length > 0 && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search directories by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-primary/20 focus-visible:ring-primary/30 bg-background/50 backdrop-blur-sm"
            />
          </div>
        )}
      </div>

      {!activeFolder
        ? (() => {
            const filteredFolders = folders.filter(
              (f) =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.code && f.code.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            return folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
                <Folder className="w-16 h-16 text-primary/30 mb-4" />
                <h3 className="text-lg font-bold">No Directories Available</h3>
                <p className="text-muted-foreground">Register IA Master or Clients to populate drawers.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredFolders.length === 0 ? (
                  <div className="text-center py-12 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
                    <p className="text-muted-foreground">No directories match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredFolders.map((folder) => {
                      const isSystem = folder.type !== "CLIENT";
                      const Icon = folder.icon;
                      return (
                        <Card
                          key={folder.id}
                          className={`group cursor-pointer transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm relative overflow-hidden ${isSystem ? "border-amber-500/30 hover:border-amber-500/60" : "border-primary/20 hover:border-primary/50"}`}
                          onClick={() => {
                            setActiveFolder(folder);
                            if (folder.type === "CLIENT") {
                              loadFolderDocuments(folder);
                            }
                          }}
                        >
                          {folder.badge && (
                            <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                              {folder.badge}
                            </div>
                          )}
                          <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors ${isSystem ? "bg-amber-500/10 group-hover:bg-amber-500/20" : "bg-primary/5 group-hover:bg-primary/10"}`}>
                              <Icon className={`w-8 h-8 transition-colors ${isSystem ? "text-amber-600 group-hover:text-amber-500 fill-amber-500/10" : "text-primary/70 group-hover:text-primary fill-primary/10"}`} />
                            </div>
                            <h3 className="font-bold text-base truncate max-w-full w-full" title={folder.name}>{folder.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1 tracking-widest font-mono">{folder.code || "N/A"}</p>
                            <div className={`mt-4 pt-4 border-t w-full flex justify-between items-center text-xs text-muted-foreground ${isSystem ? "border-amber-500/10" : "border-primary/10"}`}>
                              <span className="flex items-center gap-1">
                                <File className="w-3 h-3" />
                                {folder.documents?.length || 0} Files
                              </span>
                              <span className={`${isSystem ? "text-amber-600" : "text-primary"} opacity-0 group-hover:opacity-100 transition-opacity font-semibold`}>
                                Open
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()
        : (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Document Vault Section */}

            <div className="bg-card rounded-xl p-6 border border-primary/10 shadow-sm">
              <DocumentVault
                clientId={activeFolder.id}
                documents={activeFolder.documents || []}
                onUploadSuccess={reloadActiveFolder}
                readOnly={activeFolder.type !== "CLIENT"}
              />
            </div>
          </div>
        )}
    </div>
  );
}
