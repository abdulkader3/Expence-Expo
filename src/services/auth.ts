import { api, ApiError } from './api';
import { storage, Tokens, UserData } from './storage';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  user: UserData;
  tokens: Tokens;
  expires_in: number;
}

export interface RegisterResponse {
  user: UserData;
  tokens: Tokens;
}

export interface ValidationError {
  field: string;
  message: string;
}

function parseValidationErrors(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (data.errors && Array.isArray(data.errors)) {
    for (const err of data.errors) {
      if (typeof err === 'object' && err !== null && 'field' in err && 'message' in err) {
        errors.push({
          field: String((err as { field: unknown }).field),
          message: String((err as { message: unknown }).message),
        });
      }
    }
  }
  
  return errors;
}

export async function createUser(payload: RegisterPayload): Promise<RegisterResponse> {
  console.log('[AUTH] REGISTER PAYLOAD:', JSON.stringify(payload, null, 2));
  
  const response = await api.post<{ data: RegisterResponse }>('/auth/register', payload);
  
  console.log('[AUTH] REGISTER RESPONSE:', response);
  
  const { data } = response;
  await storage.setTokens(data.tokens);
  await storage.setUser(data.user);
  
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  console.log('[AUTH] LOGIN PAYLOAD:', JSON.stringify(payload, null, 2));
  
  const response = await api.post<{ data: LoginResponse }>('/auth/login', payload);
  
  console.log('[AUTH] LOGIN RESPONSE:', response);
  
  const { data } = response;
  await storage.setTokens(data.tokens);
  await storage.setUser(data.user);
  
  return data;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  console.log('[AUTH] REFRESH TOKEN');
  
  const response = await api.post<{ data: RefreshTokenResponse }>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  
  console.log('[AUTH] REFRESH TOKEN RESPONSE:', response);
  
  const { data } = response;
  await storage.setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  
  return data;
}

export async function logoutUser(refreshToken: string, revokeAll: boolean = false): Promise<void> {
  console.log('[AUTH] LOGOUT');
  
  const params = revokeAll ? { all: 'true' } : undefined;
  
  await api.post<{ success: boolean }>('/auth/logout', { refresh_token: refreshToken }, { params });
  
  console.log('[AUTH] LOGOUT SUCCESS');
  
  await storage.clearAll();
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  roles: string[];
  created_at: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  company?: string;
  avatar?: {
    uri: string;
    name: string;
    type: string;
  };
}

export async function updateCurrentUser(payload: UpdateUserPayload): Promise<{ user: UserResponse }> {
  console.log('[AUTH] UPDATE USER PAYLOAD:', JSON.stringify(payload, null, 2));
  
  const formData = new FormData();
  
  if (payload.name) formData.append('name', payload.name);
  if (payload.phone) formData.append('phone', payload.phone);
  if (payload.company) formData.append('company', payload.company);
  if (payload.avatar) {
    const { uri, name, type } = payload.avatar;
    const fileName = name || uri.split('/').pop() || 'avatar.jpg';
    formData.append('avatar', {
      uri,
      name: fileName,
      type: type || 'image/jpeg',
    } as unknown as Blob);
  }
  
  const response = await api.patch<{ user: UserResponse }>('/users/me', formData, {});
  
  console.log('[AUTH] UPDATE USER RESPONSE:', response);
  
  return response;
}

export interface UserSettings {
  currency: string;
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
  };
  biometric_lock_enabled: boolean;
  quick_add_default_partner: string | null;
  export_format: string;
}

export async function getUserSettings(): Promise<UserSettings> {
  console.log('[AUTH] FETCHING USER SETTINGS');
  
  const response = await api.get<UserSettings>('/users/me/settings');
  
  console.log('[AUTH] USER SETTINGS RESPONSE:', response);
  
  return response;
}

export interface UpdateSettingsPayload {
  currency?: string;
  notifications?: {
    enabled?: boolean;
    email?: boolean;
    push?: boolean;
  };
  biometric_lock_enabled?: boolean;
  quick_add_default_partner?: string | null;
  export_format?: string;
}

export async function updateUserSettings(payload: UpdateSettingsPayload): Promise<UserSettings> {
  console.log('[AUTH] UPDATE SETTINGS PAYLOAD:', JSON.stringify(payload, null, 2));
  
  const response = await api.put<{ data: UserSettings }>('/users/me/settings', payload);
  
  console.log('[AUTH] UPDATE SETTINGS RESPONSE:', response);
  
  return response.data;
}

export async function getCurrentUser(): Promise<UserResponse> {
  console.log('[AUTH] FETCHING CURRENT USER');
  
  const response = await api.get<UserResponse>('/users/me');
  
  console.log('[AUTH] CURRENT USER RESPONSE:', response);
  
  const data = response;
  await storage.setUser({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    avatar_url: data.avatar_url,
    createdAt: data.created_at,
    updatedAt: data.created_at,
  });
  
  return data;
}

export function handleAuthError(error: unknown): {
  message: string;
  isDuplicateEmail: boolean;
  isRateLimited: boolean;
  isTimeout: boolean;
  fieldErrors: ValidationError[];
} {
  console.log('[AUTH] REGISTER ERROR FULL:', error);
  
  if (error instanceof ApiError) {
    console.log('[AUTH] ERROR MESSAGE:', error.message);
    console.log('[AUTH] ERROR STATUS:', error.status);
    console.log('[AUTH] ERROR DATA:', error.data);
    console.log('[AUTH] ERROR IS TIMEOUT:', error.isTimeout);
    
    const fieldErrors = error.status === 400 ? parseValidationErrors(error.data || {}) : [];
    
    return {
      message: error.message,
      isDuplicateEmail: error.status === 409,
      isRateLimited: error.status === 429,
      isTimeout: error.isTimeout || false,
      fieldErrors,
    };
  }
  
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    isDuplicateEmail: false,
    isRateLimited: false,
    isTimeout: false,
    fieldErrors: [],
  };
}
