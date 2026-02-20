import { api } from './api';

export interface Partner {
  id: string;
  name: string;
  avatar_url: string;
  total_contributed: number;
  last_contribution_at: string;
}

export interface PartnerTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface PartnersResponse {
  data: Partner[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export interface GetPartnersParams {
  sort_by?: 'total_contributed' | 'name' | 'created_at';
  limit?: number;
  offset?: number;
  page?: number;
  per_page?: number;
  include_transactions?: boolean;
}

export async function getPartners(params: GetPartnersParams = {}): Promise<PartnersResponse> {
  console.log('[PARTNERS] FETCHING PARTNERS:', params);

  const queryParams: Record<string, string> = {};

  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.offset) queryParams.offset = String(params.offset);
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.include_transactions) queryParams.include_transactions = 'true';

  const response = await api.get<PartnersResponse>('/partners', { params: queryParams });

  console.log('[PARTNERS] RESPONSE:', response);

  return response;
}

export interface PartnerWithTransactions extends Partner {
  recent_transactions?: PartnerTransaction[];
}

export async function getPartnersWithTransactions(
  params: Omit<GetPartnersParams, 'include_transactions'>
): Promise<{ data: PartnerWithTransactions[]; meta: PartnersResponse['meta'] }> {
  console.log('[PARTNERS] FETCHING PARTNERS WITH TRANSACTIONS:', params);

  const queryParams: Record<string, string> = {};

  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.offset) queryParams.offset = String(params.offset);
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  queryParams.include_transactions = 'true';

  const response = await api.get<{ data: PartnerWithTransactions[]; meta: PartnersResponse['meta'] }>('/partners', {
    params: queryParams,
  });

  console.log('[PARTNERS] RESPONSE WITH TRANSACTIONS:', response);

  return response;
}

export interface LeaderboardEntry {
  partner_id: string;
  name: string;
  avatar_url: string;
  total_contributed: number;
  rank: number;
  top_contributor: boolean;
  last_contribution_at: string;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  meta: {
    as_of: string;
  };
}

export interface GetLeaderboardParams {
  limit?: number;
  include_recent_transactions?: boolean;
}

export async function getLeaderboard(params: GetLeaderboardParams = {}): Promise<LeaderboardResponse> {
  console.log('[PARTNERS] FETCHING LEADERBOARD:', params);

  const queryParams: Record<string, string> = {};

  if (params.limit) queryParams.limit = String(params.limit);
  if (params.include_recent_transactions) queryParams.include_recent_transactions = 'true';

  const response = await api.get<LeaderboardResponse>('/partners/leaderboard', { params: queryParams });

  console.log('[PARTNERS] LEADERBOARD RESPONSE:', response);

  return response;
}

export interface PartnerDetailTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  context: string;
  recorded_by: string;
  date: string;
  receipt_url?: string;
}

export interface PartnerDetail {
  id: string;
  name: string;
  avatar_url: string;
  notes?: string;
  total_contributed: number;
}

export interface PartnerDetailResponse {
  partner: PartnerDetail;
  transactions: PartnerDetailTransaction[];
  meta: {
    total_transactions: number;
  };
}

export interface GetPartnerDetailParams {
  from?: string;
  to?: string;
  category?: string;
  page?: number;
  per_page?: number;
  search?: string;
}

export async function getPartnerDetail(partnerId: string, params: GetPartnerDetailParams = {}): Promise<PartnerDetailResponse> {
  console.log('[PARTNERS] FETCHING PARTNER DETAIL:', partnerId, params);

  const queryParams: Record<string, string> = {};

  if (params.from) queryParams.from = params.from;
  if (params.to) queryParams.to = params.to;
  if (params.category) queryParams.category = params.category;
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.search) queryParams.search = params.search;

  const response = await api.get<PartnerDetailResponse>(`/partners/${partnerId}`, { params: queryParams });

  console.log('[PARTNERS] PARTNER DETAIL RESPONSE:', response);

  return response;
}

export interface CreateContributionPayload {
  recorded_for: string;
  amount: number;
  currency?: string;
  category?: string;
  context?: string;
  date?: string;
  receipt_id?: string;
}

export interface CreateContributionResponse {
  transaction: {
    id: string;
    recorded_for: string;
    recorded_by: string;
    amount: number;
    currency: string;
    category?: string;
    context?: string;
    date: string;
    created_at: string;
  };
  partner_total: number;
}

export async function createContribution(payload: CreateContributionPayload, idempotencyKey?: string): Promise<CreateContributionResponse> {
  console.log('[PARTNERS] CREATING CONTRIBUTION:', payload);

  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await api.post<CreateContributionResponse>('/partners', payload, { headers });

  console.log('[PARTNERS] CONTRIBUTION CREATED:', response);

  return response;
}
