import httpClient from "@/core/api/http-client";
import { API_ENDPOINTS } from "@/core/api/api-endpoints";
import type {
  Transaction,
  TransactionFilters,
  PaginatedResponse,
} from "../types";

/**
 * Transaction Service
 * Encapsulates all CRUD and query operations for the transactions feature.
 */
export const TransactionService = {
  /**
   * Fetch a paginated, filtered list of transactions.
   */
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> {
    const { data } = await httpClient.get(API_ENDPOINTS.TRANSACTIONS.LIST, {
      params: filters,
    });
    return data?.data as PaginatedResponse<Transaction>;
  },

  /**
   * Fetch a single transaction by ID.
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const { data } = await httpClient.get(
      API_ENDPOINTS.TRANSACTIONS.DETAIL(id)
    );
    return data?.data as Transaction;
  },

  /**
   * Create a new transaction.
   */
  async createTransaction(
    payload: Omit<Transaction, "id">
  ): Promise<Transaction> {
    const { data } = await httpClient.post(
      API_ENDPOINTS.TRANSACTIONS.CREATE,
      payload
    );
    return data?.data as Transaction;
  },

  /**
   * Export transactions as CSV for a given set of filters.
   */
  async exportTransactions(filters?: TransactionFilters): Promise<Blob> {
    const { data } = await httpClient.get(API_ENDPOINTS.TRANSACTIONS.EXPORT, {
      params: filters,
      responseType: "blob",
    });
    return data as Blob;
  },
};
