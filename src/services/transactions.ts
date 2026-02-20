import { api } from './api';

export interface Transaction {
  id: string;
  recorded_for: string;
  recorded_for_name: string;
  recorded_for_email?: string;
  recorded_by: string;
  recorded_by_name?: string;
  recorded_by_email?: string;
  amount: number;
  currency: string;
  type: string;
  category: string;
  context: string;
  description?: string;
  receipt_url?: string;
  receipt_id?: string;
  date: string;
  created_at: string;
  updated_at?: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface GetTransactionsParams {
  recorded_for?: string;
  recorded_by?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  q?: string;
  page?: number;
  per_page?: number;
  sort_by?: 'date_desc' | 'date_asc';
}

export async function getTransactions(params: GetTransactionsParams = {}): Promise<TransactionsResponse> {
  console.log('[TRANSACTIONS] FETCHING TRANSACTIONS:', params);

  const queryParams: Record<string, string> = {};

  if (params.recorded_for) queryParams.recorded_for = params.recorded_for;
  if (params.recorded_by) queryParams.recorded_by = params.recorded_by;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.category) queryParams.category = params.category;
  if (params.q) queryParams.q = params.q;
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.sort_by) queryParams.sort_by = params.sort_by;

  const response = await api.get<TransactionsResponse>('/transactions', { params: queryParams });

  console.log('[TRANSACTIONS] RESPONSE:', response);

  return response;
}

export async function getTransactionsCSV(params: GetTransactionsParams = {}): Promise<string> {
  console.log('[TRANSACTIONS] FETCHING TRANSACTIONS CSV:', params);

  const queryParams: Record<string, string> = {};

  if (params.recorded_for) queryParams.recorded_for = params.recorded_for;
  if (params.recorded_by) queryParams.recorded_by = params.recorded_by;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.category) queryParams.category = params.category;
  if (params.q) queryParams.q = params.q;
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.sort_by) queryParams.sort_by = params.sort_by;

  const response = await api.get<string>('/transactions', { 
    params: queryParams,
    headers: { 'Accept': 'text/csv' }
  });

  console.log('[TRANSACTIONS] CSV RESPONSE RECEIVED');

  return response;
}

export interface TransactionDetailResponse {
  transaction: Transaction;
}

export async function getTransaction(transactionId: string): Promise<TransactionDetailResponse> {
  console.log('[TRANSACTIONS] FETCHING TRANSACTION:', transactionId);

  const response = await api.get<TransactionDetailResponse>(`/transactions/${transactionId}`);

  console.log('[TRANSACTIONS] DETAIL RESPONSE:', response);

  return response;
}

export interface UpdateTransactionPayload {
  amount?: number;
  category?: string;
  context?: string;
  date?: string;
  receipt_id?: string;
  recorded_for?: string;
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
  partner_total: number;
}

export async function updateTransaction(
  transactionId: string, 
  payload: UpdateTransactionPayload
): Promise<UpdateTransactionResponse> {
  console.log('[TRANSACTIONS] UPDATING TRANSACTION:', transactionId, payload);

  const response = await api.patch<UpdateTransactionResponse>(`/transactions/${transactionId}`, payload);

  console.log('[TRANSACTIONS] UPDATE RESPONSE:', response);

  return response;
}

export interface UndoTransactionPayload {
  reason?: string;
}

export interface UndoTransactionResponse {
  undo_transaction: {
    id: string;
    type: string;
    amount: number;
    related_to: string;
  };
  partner_total: number;
}

export async function undoTransaction(
  transactionId: string, 
  payload?: UndoTransactionPayload
): Promise<UndoTransactionResponse> {
  console.log('[TRANSACTIONS] UNDOING TRANSACTION:', transactionId, payload);

  const response = await api.post<UndoTransactionResponse>(`/transactions/${transactionId}/undo`, payload);

  console.log('[TRANSACTIONS] UNDO RESPONSE:', response);

  return response;
}
