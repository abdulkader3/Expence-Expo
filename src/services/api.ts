const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.103:5000/api/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: Record<string, unknown>,
    public isTimeout?: boolean
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`[API] ${fetchOptions.method || 'GET'} ${url}`);
    console.log(`[API] Request body:`, fetchOptions.body);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`[API] Response status:`, response.status);

    const contentType = response.headers.get('content-type');
    let data: unknown;

    if (contentType?.includes('application/json')) {
      data = await response.json();
      console.log(`[API] Response data:`, data);
    } else {
      data = await response.text();
      console.log(`[API] Response text:`, data);
    }

    if (!response.ok) {
      const errorMessage =
        (data as { message?: string })?.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(
        errorMessage,
        response.status,
        (data as { code?: string })?.code,
        data as Record<string, unknown>
      );
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[API] Request timed out after ${REQUEST_TIMEOUT}ms`);
      throw new ApiError('Request timed out', 0, undefined, {}, true);
    }
    
    console.log(`[API] Error:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  healthCheck: async (): Promise<{ status: string }> => {
    const healthUrl = `${API_BASE_URL.replace('/api/v1', '')}/health`;
    console.log(`[API] Health check URL: ${healthUrl}`);
    try {
      const response = await fetch(healthUrl);
      const result = await response.json();
      console.log(`[API] Health check result:`, result);
      return result;
    } catch (error) {
      console.log(`[API] Health check error:`, error);
      throw error;
    }
  },
};
