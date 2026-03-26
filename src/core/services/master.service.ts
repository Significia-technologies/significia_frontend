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
  assigned_employee_id?: string;
}

export interface ClientCreate {
  is_active?: boolean;
  id?: string;
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
  spouse_dob?: string;
  aadhar_number?: string;
  passport_number?: string;

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
  advisor_registration_number: string;
  client_date: string;
  nominee_name?: string;
  nominee_relationship?: string;
  previous_advisor_name?: string;
  referral_source?: string;
  declaration_signed: boolean;
  declaration_date?: string;
  client_signature_path?: string;
  advisor_signature_path?: string;
  assigned_employee_id?: string;
}

export class MasterDataService {
  static async listClients(connectorId: string): Promise<Client[]> {
    const response = await httpClient.get<Client[]>(
      API_ENDPOINTS.MASTER.CLIENTS.LIST(connectorId)
    );
    return response.data;
  }

  static async getClient(connectorId: string, clientId: string): Promise<ClientCreate> {
    const response = await httpClient.get<ClientCreate>(
      API_ENDPOINTS.MASTER.CLIENTS.DETAIL(connectorId, clientId)
    );
    return response.data;
  }

  static async getClientByPan(connectorId: string, pan: string): Promise<ClientCreate> {
    const response = await httpClient.get<ClientCreate>(
      `${API_ENDPOINTS.MASTER.CLIENTS.LIST(connectorId)}/pan/${pan}`
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

  static async updateClient(connectorId: string, clientId: string, data: Partial<ClientCreate>): Promise<Client> {
    const response = await httpClient.put<Client>(
      API_ENDPOINTS.MASTER.CLIENTS.UPDATE(connectorId, clientId),
      data
    );
    return response.data;
  }

  static async deleteClient(connectorId: string, clientId: string): Promise<void> {
    await httpClient.delete(
      API_ENDPOINTS.MASTER.CLIENTS.DELETE(connectorId, clientId)
    );
  }

  static async downloadClientReport(connectorId: string, clientId: string, clientName: string): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.MASTER.CLIENTS.DOWNLOAD_REPORT(connectorId, clientId),
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_${clientName.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  static async downloadMasterReport(connectorId: string): Promise<void> {
    const response = await httpClient.get(
      API_ENDPOINTS.MASTER.CLIENTS.MASTER_REPORT(connectorId),
      { responseType: 'blob' }
    );
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Client_Master_Report_${date}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
