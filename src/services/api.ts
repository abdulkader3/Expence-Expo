const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const REQUEST_TIMEOUT = 10000; // 10 seconds
const UPLOAD_TIMEOUT = 60000; // 60 seconds for uploads

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: Record<string, unknown>,
    public isTimeout?: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function getStoredTokens() {
  const { storage } = await import("./storage");
  return await storage.getTokens();
}

async function doRefreshToken(): Promise<boolean> {
  const { refreshToken } = await import("./auth");
  const { storage } = await import("./storage");

  const tokens = await storage.getTokens();
  if (!tokens?.refresh_token) {
    return false;
  }

  try {
    await refreshToken(tokens.refresh_token);
    return true;
  } catch (error) {
    console.log("[API] Token refresh failed:", error);
    await storage.clearAll();
    return false;
  }
}

async function getValidToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens?.access_token) {
    return null;
  }
  return tokens.access_token;
}

async function requestWithAuthRetry<T>(
  endpoint: string,
  options: RequestOptions = {},
  retryCount: number = 0,
): Promise<T> {
  // Skip auth for auth endpoints (login, register, refresh)
  const authEndpoints = ["/auth/login", "/auth/register", "/auth/refresh"];
  const isAuthEndpoint = authEndpoints.some((e) => endpoint.includes(e));

  // Get current valid token (skip for auth endpoints)
  let token = isAuthEndpoint ? null : await getValidToken();

  // If no token and not an auth endpoint, try to refresh
  if (!token && !isAuthEndpoint && retryCount === 0) {
    const refreshed = await doRefreshToken();
    if (refreshed) {
      token = await getValidToken();
    }
  }

  // If still no token and not auth endpoint, throw auth error
  if (!token && !isAuthEndpoint) {
    throw new ApiError("No authentication token", 401, "NO_TOKEN");
  }

  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const isFormData = fetchOptions.body instanceof FormData;
  const timeout = isFormData ? UPLOAD_TIMEOUT : REQUEST_TIMEOUT;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(`[API] Request timed out after ${timeout}ms`);
  }, timeout);

  try {
    console.log(`[API] ${fetchOptions.method || "GET"} ${url}`);
    console.log(`[API] Request body:`, fetchOptions.body);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeoutId);

    // Handle 401 - try to refresh token once (but not for auth endpoints or retries)
    if (response.status === 401 && retryCount === 0 && !isAuthEndpoint) {
      console.log("[API] Got 401, attempting token refresh...");

      const refreshed = await doRefreshToken();
      if (refreshed) {
        console.log("[API] Token refreshed, retrying request...");
        return requestWithAuthRetry(endpoint, options, retryCount + 1);
      }
    }

    console.log(`[API] Response status:`, response.status);

    const contentType = response.headers.get("content-type");
    let data: unknown;

    if (contentType?.includes("application/json")) {
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
        data as Record<string, unknown>,
      );
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      console.log(`[API] Request timed out after ${timeout}ms`);
      throw new ApiError("Request timed out", 0, undefined, {}, true);
    }

    console.log(`[API] Error:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : "Network request failed";
    console.log(`[API] Error message: ${errorMessage}`);
    throw new ApiError(errorMessage, 0);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  return requestWithAuthRetry<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body
        ? body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, {
      method: "POST",
      body: formData,
      headers: {},
    }),

  healthCheck: async (): Promise<{ status: string }> => {
    const healthUrl = `${API_BASE_URL.replace("/api/v1", "")}/health`;
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
