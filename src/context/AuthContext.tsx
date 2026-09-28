import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi, clearTokens, setTokens } from '../api/api';

// ============================================================
// Types
// ============================================================
export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'student' | 'tutor' | 'admin' | 'super-admin' | 'moderator';
  status: 'active' | 'suspended' | 'pending';
  isVerified: boolean;
  profilePicture: string | null;
  countryCode: string;
  mobileNumber: string;
  region: string | null;
  currentCity: string | null;
  dateOfBirth: { year: string; month: string; day: string } | null;
  educationalBackground: string | null;
  createdAt: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;   // ← derived boolean
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  loginSuccess: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================================
// Context
// ============================================================
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// Provider
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Fetch /me/ ----------
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser(res.data as AuthUser);
      } else {
        setUser(null);
        // Not an error to be signed out — just no user
        if (res.message && res.message !== "Invalid credentials") {
          setError(res.message);
        }
      }
    } catch (err) {
      console.error('AuthContext: /me/ failed', err);
      setUser(null);
      setError('Could not reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------- Initial load ----------
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ---------- React to the global logout event fired by api.ts ----------
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setError(null);
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  // ---------- Login success ----------
  const loginSuccess = useCallback(
    async (access: string, refresh: string) => {
      setTokens(access, refresh);
      await refreshUser();
    },
    [refreshUser]
  );

  // ---------- Logout ----------
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('AuthContext: logout error', err);
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  // ---------- Derived flag ----------
  const isAuthenticated = user !== null;

  // ---------- Memoise context value ----------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      refreshUser,
      loginSuccess,
      logout,
    }),
    [user, isAuthenticated, isLoading, error, refreshUser, loginSuccess, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================
// Hook
// ============================================================
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
};