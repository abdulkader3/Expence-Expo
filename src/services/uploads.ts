import { api } from './api';

export interface UploadReceiptResponse {
  receipt_id: string;
  url: string;
  thumbnail_url: string;
}

export interface UploadReceiptParams {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  transaction_id?: string;
}

export async function uploadReceipt(params: UploadReceiptParams): Promise<UploadReceiptResponse> {
  console.log('[UPLOADS] UPLOADING RECEIPT:', params);

  const formData = new FormData();
  formData.append('file', params.file as unknown as Blob);
  if (params.transaction_id) {
    formData.append('transaction_id', params.transaction_id);
  }

  const response = await api.upload<UploadReceiptResponse>('/uploads/receipts', formData);

  console.log('[UPLOADS] UPLOAD RESPONSE:', response);

  return response;
}

export interface ExportTransactionsParams {
  recorded_for?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
}

export async function exportTransactionsCSV(params: ExportTransactionsParams = {}): Promise<string> {
  console.log('[EXPORTS] FETCHING TRANSACTIONS CSV:', params);

  const queryParams: Record<string, string> = {};

  if (params.recorded_for) queryParams.recorded_for = params.recorded_for;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.category) queryParams.category = params.category;

  const response = await api.get<string>('/exports/transactions', {
    params: queryParams,
    headers: { 'Accept': 'text/csv' },
  });

  console.log('[EXPORTS] CSV RESPONSE RECEIVED');

  return response;
}

export interface QueueItemPayload {
  recorded_for: string;
  amount: number;
  category: string;
  context?: string;
  date?: string;
}

export interface QueueItem {
  local_id: string;
  action: 'addContribution' | 'undoTransaction';
  payload: QueueItemPayload;
  timestamp?: string;
  idempotency_key?: string;
}

export interface SyncQueueRequest {
  device_id: string;
  queue: QueueItem[];
}

export interface SyncQueueResult {
  local_id: string;
  status: 'ok' | 'error';
  server_id?: string;
  duplicate: boolean;
  error?: string;
}

export interface SyncQueueResponse {
  results: SyncQueueResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export async function syncOfflineQueue(request: SyncQueueRequest): Promise<SyncQueueResponse> {
  console.log('[SYNC] SYNCING OFFLINE QUEUE:', request);

  const response = await api.post<SyncQueueResponse>('/sync/queue', request);

  console.log('[SYNC] SYNC RESPONSE:', response);

  return response;
}
