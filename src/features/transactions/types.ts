// ── Transaction Types ───────────────────────────────

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  account: string;
  reference?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
