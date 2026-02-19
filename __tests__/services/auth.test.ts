import { createUser, handleAuthError, RegisterPayload } from '../app/services/auth';
import { api } from '../app/services/api';

jest.mock('../app/services/api');
jest.mock('../app/services/storage', () => ({
  storage: {
    setTokens: jest.fn().mockResolvedValue(undefined),
    setUser: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validPayload: RegisterPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should return parsed response data on successful registration', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      const result = await createUser(validPayload);

      expect(result).toEqual(mockResponse.data);
      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', validPayload);
    });

    it('should store tokens and user data on successful registration', async () => {
      const { storage } = require('../app/services/storage');
      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          tokens: {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
          },
        },
      };

      mockApi.post.mockResolvedValueOnce(mockResponse);

      await createUser(validPayload);

      expect(storage.setTokens).toHaveBeenCalledWith(mockResponse.data.tokens);
      expect(storage.setUser).toHaveBeenCalledWith(mockResponse.data.user);
    });
  });

  describe('handleAuthError', () => {
    it('should parse 400 validation errors correctly', () => {
      const mockError = new Error('Validation failed') as Error & { status: number; data: Record<string, unknown> };
      Object.defineProperty(mockError, 'status', { value: 400 });
      mockError.data = {
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      };

      const result = handleAuthError(mockError);

      expect(result.message).toBe('Validation failed');
      expect(result.isDuplicateEmail).toBe(false);
      expect(result.isRateLimited).toBe(false);
      expect(result.fieldErrors).toHaveLength(2);
      expect(result.fieldErrors).toContainEqual({ field: 'email', message: 'Invalid email format' });
    });

    it('should identify 409 duplicate email error', () => {
      const mockError = new Error('Email already exists') as Error & { status: number };
      Object.defineProperty(mockError, 'status', { value: 409 });

      const result = handleAuthError(mockError);

      expect(result.isDuplicateEmail).toBe(true);
      expect(result.message).toBe('Email already exists');
    });

    it('should identify 429 rate limit error', () => {
      const mockError = new Error('Too many requests') as Error & { status: number };
      Object.defineProperty(mockError, 'status', { value: 429 });

      const result = handleAuthError(mockError);

      expect(result.isRateLimited).toBe(true);
      expect(result.message).toBe('Too many requests');
    });

    it('should handle generic errors', () => {
      const result = handleAuthError(new Error('Network error'));

      expect(result.message).toBe('Network error');
      expect(result.isDuplicateEmail).toBe(false);
      expect(result.isRateLimited).toBe(false);
      expect(result.fieldErrors).toHaveLength(0);
    });
  });
});
