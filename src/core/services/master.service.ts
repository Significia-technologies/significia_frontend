import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
}

export class MasterDataService {
  static async listCustomers(connectorId: string): Promise<Customer[]> {
    const response = await httpClient.get<Customer[]>(
      API_ENDPOINTS.MASTER.CUSTOMERS.LIST(connectorId)
    );
    return response.data;
  }

  static async createCustomer(connectorId: string, data: CustomerCreate): Promise<Customer> {
    const response = await httpClient.post<Customer>(
      API_ENDPOINTS.MASTER.CUSTOMERS.CREATE(connectorId),
      data
    );
    return response.data;
  }

  static async deleteCustomer(connectorId: string, customerId: string): Promise<void> {
    await httpClient.delete(
      API_ENDPOINTS.MASTER.CUSTOMERS.DELETE(connectorId, customerId)
    );
  }
}
