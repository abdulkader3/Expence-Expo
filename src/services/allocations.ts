import { api } from "./api";

export interface Allocation {
  id: string;
  user_id: string;
  sale_id: string;
  cost_id: string;
  allocated_amount: number;
  allocation_quantity?: number;
  unit_cost_at_allocation?: number;
  created_at: string;
}

export interface CreateAllocationPayload {
  sale_id: string;
  cost_id: string;
  allocated_amount: number;
  allocation_quantity?: number;
  unit_cost?: number;
}

export interface CreateAllocationResponse {
  allocation: Allocation;
  sale_summary: {
    sale_id: string;
    total_allocated_cost: number;
  };
  cost_entry_summary: {
    cost_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    allocated_quantity: number;
    allocated_amount: number;
    remaining_quantity: number;
    remaining_unallocated_cost: number;
    status: string;
  };
}

export async function createAllocation(
  payload: CreateAllocationPayload,
): Promise<CreateAllocationResponse> {
  console.log("[ALLOCATIONS] CREATING ALLOCATION:", payload);

  const response = await api.post<CreateAllocationResponse>(
    "/allocations",
    payload,
  );

  console.log("[ALLOCATIONS] ALLOCATION CREATED:", response);

  return response;
}

export interface AllocationsResponse {
  data: Allocation[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
}

export async function getAllocations(
  params: {
    sale_id?: string;
    cost_id?: string;
    page?: number;
    per_page?: number;
  } = {},
): Promise<AllocationsResponse> {
  console.log("[ALLOCATIONS] FETCHING ALLOCATIONS:", params);

  const queryParams: Record<string, string> = {};

  if (params.sale_id) queryParams.sale_id = params.sale_id;
  if (params.cost_id) queryParams.cost_id = params.cost_id;
  if (params.page) queryParams.page = String(params.page);
  if (params.per_page) queryParams.per_page = String(params.per_page);

  const response = await api.get<AllocationsResponse>("/allocations", {
    params: queryParams,
  });

  console.log("[ALLOCATIONS] RESPONSE:", response);

  return response;
}
