import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { api, clearLegacyToken } from '../lib/api';
import { realtime } from '../lib/socket';
import type { SessionUser } from '../lib/types';

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  requestCode: (destination: string, purpose: 'register' | 'login' | 'recovery') => Promise<{ devCode?: string }>;
  verifyCode: (input: {
    destination: string;
    code: string;
    purpose: 'register' | 'login' | 'recovery';
    name?: string;
    commPref?: SessionUser['commPref'];
  }) => Promise<void>;
  updateProfile: (patch: Partial<Pick<SessionUser, 'name' | 'commPref' | 'discoverable' | 'language'>>) => Promise<void>;
  savePreferences: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api<{ user: SessionUser }>('/api/auth/me');
      setUser(data.user);
      realtime.connect();
    } catch {
      clearLegacyToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const requestCode = useCallback(async (destination: string, purpose: 'register' | 'login' | 'recovery') => {
    return api<{ devCode?: string }>('/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ destination, purpose })
    });
  }, []);

  const verifyCode = useCallback(async (input: {
    destination: string;
    code: string;
    purpose: 'register' | 'login' | 'recovery';
    name?: string;
    commPref?: SessionUser['commPref'];
  }) => {
    const data = await api<{ user: SessionUser }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    clearLegacyToken();
    setUser(data.user);
    realtime.connect();
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Pick<SessionUser, 'name' | 'commPref' | 'discoverable' | 'language'>>) => {
    const data = await api<{ user: SessionUser }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    setUser(data.user);
  }, []);

  const savePreferences = useCallback(async (payload: Record<string, unknown>) => {
    await api('/api/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      realtime.disconnect();
      clearLegacyToken();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await api('/api/auth/account', { method: 'DELETE' });
    realtime.disconnect();
    clearLegacyToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      requestCode,
      verifyCode,
      updateProfile,
      savePreferences,
      logout,
      deleteAccount
    }),
    [user, loading, requestCode, verifyCode, updateProfile, savePreferences, logout, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
