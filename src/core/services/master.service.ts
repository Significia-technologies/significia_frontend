import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export class MasterDataService {
  static async listClients(connectorId: string): Promise<Client[]> {
    const response = await httpClient.get<Client[]>(
      API_ENDPOINTS.MASTER.CLIENTS.LIST(connectorId)
    );
    return response.data;
  }

  static async createClient(connectorId: string, data: ClientCreate): Promise<Client> {
    const response = await httpClient.post<Client>(
      API_ENDPOINTS.MASTER.CLIENTS.CREATE(connectorId),
      data
    );
    return response.data;
  }

  static async deleteClient(connectorId: string, clientId: string): Promise<void> {
    await httpClient.delete(
      API_ENDPOINTS.MASTER.CLIENTS.DELETE(connectorId, clientId)
    );
  }
}
