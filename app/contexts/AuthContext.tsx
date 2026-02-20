import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage, UserData, Tokens } from '../../src/services/storage';
import { createUser, RegisterPayload, loginUser, LoginPayload, handleAuthError, getCurrentUser, updateCurrentUser, UpdateUserPayload, UserResponse, logoutUser as authLogoutUser } from '../../src/services/auth';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserData | null;
  error: string;
  fieldErrors: { field: string; message: string }[];
}

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string; fieldErrors?: { field: string; message: string }[] }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (payload: UpdateUserPayload) => Promise<{ success: boolean; error?: string; user?: UserResponse }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const [tokens, storedUser] = await Promise.all([
          storage.getTokens(),
          storage.getUser(),
        ]);

        if (tokens && storedUser) {
          setUser(storedUser);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const clearError = useCallback(() => {
    setError('');
    setFieldErrors([]);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    clearError();
    
    try {
      console.log("[CONTEXT] Calling loginUser...");
      const result = await loginUser(payload);
      console.log("[CONTEXT] loginUser success:", result);
      setUser(result.user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      console.log("[CONTEXT] loginUser error:", error);
      const handled = handleAuthError(error);
      console.log("[CONTEXT] handled error:", handled);
      
      setError(handled.message);
      setFieldErrors(handled.fieldErrors);
      
      return {
        success: false,
        error: handled.message,
        fieldErrors: handled.fieldErrors,
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const tokens = await storage.getTokens();
      if (tokens?.refresh_token) {
        await authLogoutUser(tokens.refresh_token);
      }
    } catch (error) {
      console.error('Error calling logout API:', error);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      await storage.setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        company: userData.company,
        avatar_url: userData.avatar_url,
        createdAt: userData.created_at,
        updatedAt: userData.created_at,
      });
      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        company: userData.company,
        avatar_url: userData.avatar_url,
        createdAt: userData.created_at,
        updatedAt: userData.created_at,
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  const updateUser = useCallback(async (payload: UpdateUserPayload) => {
    try {
      const response = await updateCurrentUser(payload);
      await storage.setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone,
        company: response.user.company,
        avatar_url: response.user.avatar_url,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
      });
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        phone: response.user.phone,
        company: response.user.company,
        avatar_url: response.user.avatar_url,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
      });
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Error updating user:', error);
      const handled = handleAuthError(error);
      return { success: false, error: handled.message };
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      isLoggedIn: isLoggedIn,
      isLoading: isLoading,
      user: user,
      login: login,
      logout: logout,
      clearError: clearError,
      refreshUser: refreshUser,
      updateUser: updateUser,
      error: error,
      fieldErrors: fieldErrors,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
