import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage, UserData } from '../../src/services/storage';
import { createUser, RegisterPayload, loginUser, LoginPayload, handleAuthError } from '../../src/services/auth';

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
      await storage.clearAll();
    } catch (error) {
      console.error('Error clearing storage:', error);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
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
