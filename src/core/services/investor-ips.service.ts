import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface IpsDocument {
  id: string;
  file_path: string;
  file_name: string;
  version_number: number;
  uploaded_at: string;
}

export class InvestorIpsService {
  static async listDocuments(
    clientId: string,
    memberId: string
  ): Promise<{ documents: IpsDocument[]; total: number }> {
    const res = await httpClient.get(
      API_ENDPOINTS.INVESTOR_IPS.LIST(clientId, memberId)
    );
    return res.data;
  }

  static async uploadDocument(
    clientId: string,
    memberId: string,
    file: File
  ): Promise<{ status: string; version_number: number; file_name: string; file_path: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await httpClient.post(
      API_ENDPOINTS.INVESTOR_IPS.UPLOAD(clientId, memberId),
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }

  static async openDocument(clientId: string, memberId: string, docId: string): Promise<void> {
    // Fetch via authenticated client so the backend can forward the bridge redirect.
    // The backend returns 302 → presigned S3 URL or local static URL; axios follows it.
    const res = await httpClient.get(
      API_ENDPOINTS.INVESTOR_IPS.DOWNLOAD(clientId, memberId, docId),
      { responseType: "blob" }
    );
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
