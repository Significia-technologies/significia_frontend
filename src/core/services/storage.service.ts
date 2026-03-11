import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface StorageConnector {
  id: string;
  tenant_id: string;
  name: string;
  provider: string;
  bucket_name: string;
  region: string | null;
  endpoint_url: string | null;
  access_key_id: string | null;
  status: "PENDING" | "READY" | "FAILED";
  verified_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageConnectorCreate {
  name: string;
  provider: string;
  bucket_name: string;
  region?: string;
  endpoint_url?: string;
  access_key_id?: string;
  secret_key?: string;
}

export class StorageService {
  static async list(connectorId: string): Promise<StorageConnector[]> {
    const response = await httpClient.get<StorageConnector[]>(
      `${API_ENDPOINTS.STORAGE.LIST}?connector_id=${connectorId}`
    );
    return response.data;
  }

  static async create(connectorId: string, data: StorageConnectorCreate): Promise<StorageConnector> {
    const response = await httpClient.post<StorageConnector>(
      `${API_ENDPOINTS.STORAGE.CREATE}?connector_id=${connectorId}`, 
      data
    );
    return response.data;
  }

  static async verify(connectorId: string, id: string): Promise<{ status: string; message: string }> {
    const response = await httpClient.post<{ status: string; message: string }>(
      `${API_ENDPOINTS.STORAGE.VERIFY(id)}?connector_id=${connectorId}`
    );
    return response.data;
  }
}
