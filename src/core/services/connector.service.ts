import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Connector {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  is_active: boolean;
  initialization_status: "PENDING" | "INITIALIZING" | "READY" | "FAILED";
  initialized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorCreate {
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
}

export class ConnectorService {
  static async list(): Promise<Connector[]> {
    const response = await httpClient.get<Connector[]>(API_ENDPOINTS.CONNECTORS.LIST);
    return response.data;
  }

  static async create(data: ConnectorCreate): Promise<Connector> {
    const response = await httpClient.post<Connector>(API_ENDPOINTS.CONNECTORS.CREATE, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.CONNECTORS.DELETE(id));
  }

  static async testConnection(id: string): Promise<{ status: string; message: string }> {
    const response = await httpClient.post<{ status: string; message: string }>(
      API_ENDPOINTS.CONNECTORS.TEST(id)
    );
    return response.data;
  }

  static async initialize(id: string): Promise<{ status: string; message: string }> {
    const response = await httpClient.post<{ status: string; message: string }>(
      API_ENDPOINTS.CONNECTORS.INITIALIZE(id)
    );
    return response.data;
  }
}
