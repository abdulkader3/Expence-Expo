import { api } from "./api";

export interface CostEntry {
  id: string;
  user_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  allocated_amount: number;
  allocated_quantity: number;
  remaining_amount: number;
  remaining_quantity: number;
  currency: string;
  date: string;
  status: string;
  created_at: string;
}

export interface CreateCostEntryPayload {
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost?: number;
  currency?: string;
  date?: string;
}

export interface CreateCostEntryResponse {
  cost_entry: CostEntry;
}

export async function createCostEntry(
  payload: CreateCostEntryPayload,
): Promise<CreateCostEntryResponse> {
  console.log("[COST ENTRIES] CREATING COST ENTRY:", payload);

  const response = await api.post<CreateCostEntryResponse>(
    "/cost-entries",
    payload,
  );

  console.log("[COST ENTRIES] COST ENTRY CREATED:", response);

  return response;
}

export interface CostEntriesResponse {
  data: CostEntry[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export async function getCostEntries(
  params: {
    page?: number;
    per_page?: number;
    sort_by?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
    from?: string;
    to?: string;
    status?: "active" | "fully_allocated" | "cancelled";
    q?: string;
  } = {},
): Promise<CostEntriesResponse> {
  console.log("[COST ENTRIES] FETCHING COST ENTRIES:", params);

  const queryParams: Record<string, string> = {};

  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.from) queryParams.from = params.from;
  if (params.to) queryParams.to = params.to;
  if (params.status) queryParams.status = params.status;
  if (params.q) queryParams.q = params.q;

  const response = await api.get<CostEntriesResponse>("/cost-entries", {
    params: queryParams,
  });

  console.log("[COST ENTRIES] RESPONSE:", response);

  return response;
}

export interface DeleteCostEntryResponse {
  success: boolean;
  message: string;
  deleted_cost_entry: {
    id: string;
    description: string;
    total_cost: number;
    deleted_at: string;
  };
  allocations_reversed: number;
  audit_log: Array<{
    allocation_id: string;
    sale_id: string | null;
    allocated_amount: number;
    allocation_quantity: number;
    reversed_at: string;
  }>;
}

export async function deleteCostEntry(
  costId: string,
): Promise<DeleteCostEntryResponse> {
  console.log("[COST ENTRIES] DELETING COST ENTRY:", costId);

  const response = await api.delete<DeleteCostEntryResponse>(
    `/cost-entries/${costId}`,
  );

  console.log("[COST ENTRIES] DELETE RESPONSE:", response);

  return response;
}

export interface DeletedCostEntry {
  id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  allocated_amount: number;
  allocated_quantity: number;
  currency: string;
  date: string;
  deleted_at: string;
  deleted_by: {
    id: string;
    name: string;
    email: string;
  } | null;
  audit_log: Array<{
    deleted_at: string;
    allocations_reversed: number;
    reversed_allocation_details: Array<{
      allocation_id: string;
      sale_id: string | null;
      allocated_amount: number;
      allocation_quantity: number;
      reversed_at: string;
    }>;
  }>;
}

export interface DeletedCostEntriesResponse {
  data: DeletedCostEntry[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export async function getDeletedCostEntries(
  params: { page?: number; per_page?: number } = {},
): Promise<DeletedCostEntriesResponse> {
  console.log("[COST ENTRIES] FETCHING DELETED COST ENTRIES:", params);

  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);

  const response = await api.get<DeletedCostEntriesResponse>(
    "/cost-entries/deleted",
    { params: queryParams },
  );

  console.log("[COST ENTRIES] DELETED COST ENTRIES RESPONSE:", response);

  return response;
}
