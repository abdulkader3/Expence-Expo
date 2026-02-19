import { api, ApiError } from './api';
import { storage, Tokens, UserData } from './storage';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
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
