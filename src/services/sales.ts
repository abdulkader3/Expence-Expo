import { api } from './api';

export interface Sale {
  id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  sale_total: number;
  currency: string;
  payment_method: 'cash' | 'bank';
  bank_id: string | null;
  bank_name: string | null;
  cash_holder: string | null;
  date: string;
  status: string;
  created_at: string;
}

export interface CreateSalePayload {
  product_name: string;
  quantity?: number;
  sale_total: number;
  currency?: string;
  payment_method: 'cash' | 'bank';
  bank_id?: string;
  bank_name?: string;
  cash_holder?: string;
  date?: string;
}

export interface CreateSaleResponse {
  sale: Sale;
}

export async function createSale(payload: CreateSalePayload): Promise<CreateSaleResponse> {
  console.log('[SALES] CREATING SALE:', payload);

  const response = await api.post<CreateSaleResponse>('/sales', payload);

  console.log('[SALES] SALE CREATED:', response);

  return response;
}

export interface SalesResponse {
  data: Sale[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export async function getSales(params: {
  page?: number;
  per_page?: number;
  sort_by?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  from?: string;
  to?: string;
  payment_method?: 'cash' | 'bank';
  q?: string;
} = {}): Promise<SalesResponse> {
  console.log('[SALES] FETCHING SALES:', params);

  const queryParams: Record<string, string> = {};

  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.from) queryParams.from = params.from;
  if (params.to) queryParams.to = params.to;
  if (params.payment_method) queryParams.payment_method = params.payment_method;
  if (params.q) queryParams.q = params.q;

  const response = await api.get<SalesResponse>('/sales', { params: queryParams });

  console.log('[SALES] RESPONSE:', response);

  return response;
}

export interface Bank {
  id: string;
  name: string;
  account_name?: string;
  account_number?: string;
}

export interface BanksResponse {
  data: Bank[];
}

export async function getBanks(): Promise<BanksResponse> {
  console.log('[BANKS] FETCHING BANKS');

  const response = await api.get<BanksResponse>('/banks');

  console.log('[BANKS] RESPONSE:', response);

  return response;
}

export interface Allocation {
  id: string;
  cost_id: string;
  allocated_amount: number;
  created_at: string;
}

export interface SaleDetail {
  sale: Sale & { updated_at?: string };
  allocations: Allocation[];
  allocated_cost_total: number;
  profit: number;
  profit_margin: number;
}

export interface SaleDetailResponse {
  sale: SaleDetail['sale'];
  allocations: Allocation[];
  allocated_cost_total: number;
  profit: number;
  profit_margin: number;
}

export async function getSaleDetail(saleId: string): Promise<SaleDetailResponse> {
  console.log('[SALES] FETCHING SALE DETAIL:', saleId);

  const response = await api.get<SaleDetailResponse>(`/sales/${saleId}`);

  console.log('[SALES] SALE DETAIL RESPONSE:', response);

  return response;
}

export interface SalesSummaryPeriod {
  from: string;
  to: string;
}

export interface RevenueByPaymentMethod {
  payment_method: string;
  revenue: number;
}

export interface SalesSummary {
  period: SalesSummaryPeriod;
  total_revenue: number;
  total_allocated_cost: number;
  total_profit: number;
  overall_profit_margin: number;
  total_sales: number;
  revenue_by_payment_method: RevenueByPaymentMethod[];
}

export interface SalesSummaryResponse {
  summary: SalesSummary;
}

export async function getSalesSummary(from: string, to: string): Promise<SalesSummaryResponse> {
  console.log('[SALES] FETCHING SALES SUMMARY:', { from, to });

  const response = await api.get<SalesSummaryResponse>('/sales/summary', {
    params: { from, to },
  });

  console.log('[SALES] SUMMARY RESPONSE:', response);

  return response;
}

export interface RefundResponse {
  sale: Sale & { status: string; updated_at?: string };
  allocations_reversed: number;
}

export async function refundSale(saleId: string): Promise<RefundResponse> {
  console.log('[SALES] REFUNDING SALE:', saleId);

  const response = await api.post<RefundResponse>(`/sales/${saleId}/refund`);

  console.log('[SALES] REFUND RESPONSE:', response);

  return response;
}
