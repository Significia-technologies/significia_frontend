"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderOpen, ChevronRight, File, ArrowLeft, ShieldCheck, Users, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataService } from "@/core/services/master.service";
import { IAMasterService } from "@/core/services/ia-master.service";
import { ConnectorService } from "@/core/services/connector.service";
import { DocumentVault } from "@/features/master/components/DocumentVault";

type FolderType = 'CLIENT' | 'IA_MASTER' | 'PARTNERS';

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
  const [connectorId, setConnectorId] = useState<string | null>(null);
  
  // State for Navigation: null = Root View (Folders), Folder = Inside Folder
  const [activeFolder, setActiveFolder] = useState<DrawerFolder | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const connectors = await ConnectorService.list();
      if (connectors && connectors.length > 0) {
        const cId = connectors[0].id;
        setConnectorId(cId);
        
        // 1. Fetch IA Master context concurrently
        const [clientsData, iaMasterData] = await Promise.all([
             MasterDataService.listClients(cId).catch(() => []),
             IAMasterService.getLatest(cId).catch(() => null)
        ]);
        
        const systemFolders: DrawerFolder[] = [];
        
        // Build IA Master Folder
        if (iaMasterData) {
            const iaDocs = [
                { id: '1', document_type: 'IA Certificate', file_path: iaMasterData.ia_certificate_path, uploaded_at: iaMasterData.created_at },
                { id: '2', document_type: 'IA Signature', file_path: iaMasterData.ia_signature_path, uploaded_at: iaMasterData.created_at },
                { id: '3', document_type: 'IA Logo', file_path: iaMasterData.ia_logo_path, uploaded_at: iaMasterData.created_at }
            ].filter(f => f.file_path);

            systemFolders.push({
                id: iaMasterData.id,
                name: iaMasterData.name_of_ia || "IA Master Setup",
                code: iaMasterData.ia_registration_number,
                type: 'IA_MASTER',
                documents: iaDocs,
                icon: ShieldCheck,
                badge: "System"
            });

            // Build Partner Folder
            if (iaMasterData.employees && iaMasterData.employees.length > 0) {
                const partnerDocs = iaMasterData.employees.map((emp, i) => ({
                    id: emp.id || String(i),
                    document_type: `Certificate - ${emp.name_of_employee}`,
                    file_path: emp.certificate_path,
                    uploaded_at: emp.created_at || iaMasterData.created_at
                })).filter(f => f.file_path);

                systemFolders.push({
                    id: "partners-global",
                    name: "Partner Certificates",
                    code: `${iaMasterData.employees.length} Partners`,
                    type: 'PARTNERS',
                    documents: partnerDocs,
                    icon: Users,
                    badge: "System"
                });
            }
        }

        // Build Client Folders
        const clientFolders: DrawerFolder[] = clientsData.map(client => ({
            id: client.id,
            name: client.client_name,
            code: client.client_code,
            type: 'CLIENT',
            documents: client.documents || [],
            icon: Briefcase
        }));

        setFolders([...systemFolders, ...clientFolders]);
      }
    } catch (e) {
      console.error("Failed to fetch drawers data", e);
    } finally {
      setLoading(false);
    }
  };

  const reloadActiveFolder = async () => {
      // We only support refetching/uploading for CLIENT folders right now
      if (!connectorId || !activeFolder || activeFolder.type !== 'CLIENT') return;
      try {
          const updatedClient = await MasterDataService.getClient(connectorId, activeFolder.id);
          const newDocState = updatedClient.documents || [];
          setActiveFolder({ ...activeFolder, documents: newDocState });
          
          setFolders(prev => prev.map(f => f.id === activeFolder.id ? { ...f, documents: newDocState } : f));
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
      <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground border-b border-primary/10 pb-4">
        <h1 
            className={`flex items-center gap-2 cursor-pointer transition-colors ${activeFolder ? 'text-muted-foreground hover:text-foreground' : 'text-primary'}`}
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

      {/* Root View - Global Folders */}
      {!activeFolder ? (
          folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
                  <Folder className="w-16 h-16 text-primary/30 mb-4" />
                  <h3 className="text-lg font-bold">No Directories Available</h3>
                  <p className="text-muted-foreground">Register IA Master or Clients to populate drawers.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folders.map(folder => {
                    const isSystem = folder.type !== 'CLIENT';
                    const Icon = folder.icon;
                    return (
                        <Card 
                            key={folder.id} 
                            className={`group cursor-pointer transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm relative overflow-hidden ${isSystem ? 'border-amber-500/30 hover:border-amber-500/60' : 'border-primary/20 hover:border-primary/50'}`}
                            onClick={() => setActiveFolder(folder)}
                        >
                            {/* System Ribbon */}
                            {folder.badge && (
                                <div className="absolute top-0 right-0 bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    {folder.badge}
                                </div>
                            )}

                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors ${isSystem ? 'bg-amber-500/10 group-hover:bg-amber-500/20' : 'bg-primary/5 group-hover:bg-primary/10'}`}>
                                    <Icon className={`w-8 h-8 transition-colors ${isSystem ? 'text-amber-600 group-hover:text-amber-500 fill-amber-500/10' : 'text-primary/70 group-hover:text-primary fill-primary/10'}`} />
                                </div>
                                <h3 className="font-bold text-base truncate max-w-full w-full" title={folder.name}>
                                    {folder.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 tracking-widest font-mono">
                                    {folder.code || "N/A"}
                                </p>
                                <div className={`mt-4 pt-4 border-t w-full flex justify-between items-center text-xs text-muted-foreground ${isSystem ? 'border-amber-500/10' : 'border-primary/10'}`}>
                                    <span className="flex items-center gap-1">
                                        <File className="w-3 h-3" />
                                        {folder.documents?.length || 0} Files
                                    </span>
                                    <span className={`${isSystem ? 'text-amber-600' : 'text-primary'} opacity-0 group-hover:opacity-100 transition-opacity font-semibold`}>
                                        Open
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
              </div>
          )
      ) : (
          /* Inside Folder View */
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                          {React.createElement(activeFolder.icon, { className: "w-5 h-5 text-primary" })} Directory: {activeFolder.name}
                      </h2>
                      <p className="text-sm text-muted-foreground ml-7">
                          {activeFolder.type === 'CLIENT' ? "Manage files directly inside this client's bucket." : "Read-only system documents."}
                      </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveFolder(null)} className="gap-2 border-primary/20">
                      <ArrowLeft className="w-4 h-4" /> Back to Drawers
                  </Button>
              </div>

              <div className="bg-card rounded-xl p-6 border border-primary/10 shadow-sm">
                  {connectorId && (
                      <DocumentVault 
                          connectorId={connectorId}
                          clientId={activeFolder.id}
                          documents={activeFolder.documents || []}
                          onUploadSuccess={reloadActiveFolder}
                          readOnly={activeFolder.type !== 'CLIENT'}
                      />
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
