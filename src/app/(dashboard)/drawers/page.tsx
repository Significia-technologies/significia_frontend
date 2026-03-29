"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderOpen, ChevronRight, File, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MasterDataService, Client } from "@/core/services/master.service";
import { ConnectorService } from "@/core/services/connector.service";
import { DocumentVault } from "@/features/master/components/DocumentVault";

export default function DrawersPage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [connectorId, setConnectorId] = useState<string | null>(null);
  
  // State for Navigation: null = Root View (Folders), Client = Inside Folder
  const [activeClient, setActiveClient] = useState<Client | null>(null);

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
        const data = await MasterDataService.listClients(cId);
        setClients(data);
      }
    } catch (e) {
      console.error("Failed to fetch drawers data", e);
    } finally {
      setLoading(false);
    }
  };

  const reloadActiveClient = async () => {
      if (!connectorId || !activeClient) return;
      try {
          const updatedClient = await MasterDataService.getClient(connectorId, activeClient.id);
          setActiveClient(updatedClient as unknown as Client);
          setClients(prev => prev.map(c => c.id === activeClient.id ? (updatedClient as unknown as Client) : c));
      } catch (e) {
          console.error("Failed to reload active client", e);
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
            className={`flex items-center gap-2 cursor-pointer transition-colors ${activeClient ? 'text-muted-foreground hover:text-foreground' : 'text-primary'}`}
            onClick={() => setActiveClient(null)}
        >
            <FolderOpen className="w-6 h-6" /> 
            Drawers Dashboard
        </h1>
        {activeClient && (
            <>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <span className="text-primary flex items-center gap-2">
                    <Folder className="w-5 h-5 fill-primary/10" />
                    {activeClient.client_name}
                </span>
            </>
        )}
      </div>

      {/* Root View - Client Folders */}
      {!activeClient ? (
          clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-primary/5 rounded-xl border border-primary/10 border-dashed">
                  <Folder className="w-16 h-16 text-primary/30 mb-4" />
                  <h3 className="text-lg font-bold">No Client Folders</h3>
                  <p className="text-muted-foreground">Register clients to automatically spawn their document drawers.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {clients.map(client => (
                    <Card 
                        key={client.id} 
                        className="group cursor-pointer border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm"
                        onClick={() => setActiveClient(client)}
                    >
                        <CardContent className="p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                <Folder className="w-8 h-8 text-primary/70 group-hover:text-primary transition-colors fill-primary/10 group-hover:fill-primary/20" />
                            </div>
                            <h3 className="font-bold text-base truncate max-w-full" title={client.client_name}>
                                {client.client_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 tracking-widest font-mono">
                                {client.client_code}
                            </p>
                            <div className="mt-4 pt-4 border-t border-primary/10 w-full flex justify-between items-center text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <File className="w-3 h-3" />
                                    {client.documents?.length || 0} Files
                                </span>
                                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                                    Open
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
              </div>
          )
      ) : (
          /* Inside Folder View */
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <div>
                      <h2 className="text-lg font-bold">Directory: {activeClient.client_name}</h2>
                      <p className="text-sm text-muted-foreground">Manage files directly inside this client's bucket.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveClient(null)} className="gap-2 border-primary/20">
                      <ArrowLeft className="w-4 h-4" /> Back to Drawers
                  </Button>
              </div>

              <div className="bg-card rounded-xl p-6 border border-primary/10 shadow-sm">
                  {connectorId && (
                      <DocumentVault 
                          connectorId={connectorId}
                          clientId={activeClient.id}
                          documents={activeClient.documents || []}
                          onUploadSuccess={reloadActiveClient}
                      />
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
