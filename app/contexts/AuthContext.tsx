import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage, UserData } from '../../src/services/storage';
import { createUser, RegisterPayload, handleAuthError } from '../../src/services/auth';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: UserData | null;
}

export interface AuthContextType extends AuthState {
  login: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string; fieldErrors?: { field: string; message: string }[] }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

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

  const login = useCallback(async (payload: RegisterPayload) => {
    try {
      const result = await createUser(payload);
      setUser(result.user);
      setIsLoggedIn(true);
      return { success: true };
    } catch (error) {
      const handled = handleAuthError(error);
      
      if (handled.isDuplicateEmail) {
        return { 
          success: false, 
          error: 'Email already registered — try login' 
        };
      }
      
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
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout }}>
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
