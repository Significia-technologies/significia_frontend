import { API_ENDPOINTS } from "../api/api-endpoints";
import httpClient from "../api/http-client";

export interface Client {
  id: string;
  client_name: string;
  client_code: string;
  email: string;
  phone_number: string;
  address: string;
  pan_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  // Authentication
  email: string;
  password: string;
  client_code: string;

  // Personal
  client_name: string;
  date_of_birth: string;
  pan_number: string;
  phone_number: string;
  address: string;
  occupation: string;
  gender: string;
  marital_status: string;
  nationality: string;
  residential_status: string;
  tax_residency: string;
  pep_status: string;
  father_name: string;
  mother_name: string;
  spouse_name?: string;

  // Financial
  annual_income: number;
  net_worth: number;
  income_source: string;
  fatca_compliance: string;
  existing_portfolio_value?: number;
  existing_portfolio_composition?: string;

  // Banking
  bank_account_number: string;
  bank_name: string;
  bank_branch: string;
  ifsc_code: string;
  demat_account_number?: string;
  trading_account_number?: string;

  // Investment
  risk_profile: string;
  investment_experience: string;
  investment_objectives: string;
  investment_horizon: string;
  liquidity_needs: string;

  // Metadata
  advisor_name: string;
  nominee_name?: string;
  nominee_relationship?: string;
  declaration_signed: boolean;
  declaration_date?: string;
  client_signature_path?: string;
  advisor_signature_path?: string;
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
