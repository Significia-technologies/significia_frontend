import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  allowed_domains: string[];
  is_active: boolean;
  created_at: string;
  plain_key?: string; // Only returned on creation
}

export interface ApiKeyCreateData {
  name: string;
  allowed_domains: string[];
}

export class ApiKeyService {
  static async list(): Promise<ApiKey[]> {
    const response = await httpClient.get<ApiKey[]>(API_ENDPOINTS.API_KEYS.LIST);
    return response.data;
  }

  static async create(data: ApiKeyCreateData): Promise<ApiKey> {
    const response = await httpClient.post<ApiKey>(
      API_ENDPOINTS.API_KEYS.CREATE,
      data
    );
    return response.data;
  }

  static async revoke(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.API_KEYS.REVOKE(id));
  }
}
