"use client";

import React, { useState } from "react";
import { FolderOpen, UploadCloud, FileText, Download, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MasterDataService, ClientDocumentResponse } from "@/core/services/master.service";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/core/api/api-utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DocumentVaultProps {
  
  clientId: string;
  documents: ClientDocumentResponse[];
  onUploadSuccess: () => void;
  readOnly?: boolean;
}

const DOCUMENT_TYPES = [
  "PAN Card",
  "Aadhar Card",
  "Passport",
  "Income Proof",
  "Address Proof",
  "Cancelled Cheque",
  "Signed Form",
  "Client Signature",
  "Financial Analysis Document",
  "Other"
];

export function DocumentVault({ clientId, documents, onUploadSuccess, readOnly = false }: DocumentVaultProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [customType, setCustomType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File exceeds maximum file size of 5MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    const finalType = selectedType === "Other" ? customType : selectedType;

    if (!finalType || !selectedFile) {
      toast.error("Please select a document type and a file.");
      return;
    }

    setLoading(true);
    try {
      await MasterDataService.uploadDocument(clientId, selectedFile, finalType);
      toast.success("Document uploaded securely!");
      setIsModalOpen(false);
      setSelectedFile(null);
      setSelectedType("");
      setCustomType("");
      onUploadSuccess(); // Trigger parent reload
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (filePath: string, docType: string) => {
    // Navigate via proper paths
    const isUrl = filePath.startsWith('http');
    if (isUrl) {
      window.open(filePath, '_blank');
    } else {
        window.open(`${getApiBaseUrl().replace("/api/v1", "")}/${filePath}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-primary/10 pb-4">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" /> Document Vault
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Secure repository for client verification files</p>
        </div>
        {!readOnly && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" /> Upload Document
            </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 py-20 bg-primary/5 border border-primary/10 border-dashed rounded-xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold mb-2">The vault is empty</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
                {readOnly ? "No registered documents found for this entity." : "Upload PAN, Aadhar, and other mandatory documents to complete verification."}
            </p>
            {!readOnly && (
                <Button variant="outline" onClick={() => setIsModalOpen(true)} className="gap-2 border-primary/20 bg-card">
                    <UploadCloud className="w-4 h-4" /> Browse Files
                </Button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="group overflow-hidden border-primary/10 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <div className="h-24 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative border-b border-primary/5">
                        <FileText className="w-10 h-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                            <Button size="sm" variant="secondary" onClick={() => downloadFile(doc.file_path, doc.document_type)} className="gap-2 shadow-lg">
                                <Download className="w-4 h-4" /> View Match
                            </Button>
                        </div>
                    </div>
                    <div className="p-4 bg-card">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm truncate" title={doc.document_type}>{doc.document_type}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedType("");
            setCustomType("");
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload to Vault
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4 w-full overflow-hidden">
            <div className="space-y-2 w-full overflow-hidden">
              <Label>Document Category *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select document type..." />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType === "Other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full overflow-hidden">
                <Label>Custom Document Name *</Label>
                <Input 
                  placeholder="Enter document name (e.g. Electricity Bill)" 
                  value={customType}
                  className="w-full"
                  onChange={(e) => setCustomType(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 w-full overflow-hidden">
                <Label>File *</Label>
                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-primary/5 w-full max-w-full overflow-hidden min-w-0"
                    onClick={() => document.getElementById("fileUpload")?.click()}
                >
                    <input 
                        id="fileUpload" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("File exceeds maximum file size of 5MB.");
                                  e.target.value = "";
                                  return;
                                }
                                setSelectedFile(file);
                            }
                        }} 
                    />
                    {selectedFile ? (
                        <div className="flex flex-col items-center justify-center w-full min-w-0">
                            <FileText className="w-10 h-10 text-primary mb-2 flex-shrink-0" />
                            <p className="font-medium text-sm text-foreground truncate w-full max-w-full px-2 text-center" title={selectedFile.name}>
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex-shrink-0">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="w-10 h-10 text-primary/40 mb-2" />
                            <p className="font-medium text-sm text-muted-foreground">Click to browse or drag & drop</p>
                            <p className="text-xs text-muted-foreground mt-1 text-[10px]">PDF, PNG, JPG (Max 5MB)</p>
                        </>
                    )}
                </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={loading || !selectedType || !selectedFile} className="gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                Upload File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
