import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import * as authApi from '@/features/auth/api';
import { ApiError } from '@/services/apiClient';
import type { LoginRequest, SignupRequest, UserProfile } from '@/types/auth';

type AuthState = {
  user: UserProfile | null;
  isRestoring: boolean;
  restoreError: string | null;
  restoreSession: () => Promise<void>;
  login: (input: LoginRequest) => Promise<void>;
  signup: (input: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const generation = useRef(0);

  const loadProfile = useCallback(async () => {
    const current = ++generation.current;
    try {
      const profile = await authApi.getMyProfile();
      if (current === generation.current) setUser(profile);
    } catch (error) {
      if (current !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
      } else {
        setRestoreError(error instanceof Error ? error.message : '인증 상태를 확인하지 못했습니다.');
      }
    } finally {
      if (current === generation.current) setIsRestoring(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setRestoreError(null);
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const requestGeneration = generation;
    const current = ++requestGeneration.current;
    let active = true;
    const isCurrent = () => active && current === requestGeneration.current;
    void authApi.getMyProfile().then(profile => {
      if (isCurrent()) setUser(profile);
    }).catch(error => {
      if (!isCurrent()) return;
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setRestoreError(error instanceof Error ? error.message : '인증 상태를 확인하지 못했습니다.');
    }).finally(() => {
      if (isCurrent()) setIsRestoring(false);
    });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (input: LoginRequest) => {
    const profile = await authApi.login(input);
    generation.current++;
    setRestoreError(null);
    setUser(profile);
  }, []);

  const signup = useCallback(async (input: SignupRequest) => { await authApi.signup(input); }, []);
  const logout = useCallback(async () => {
    await authApi.logout();
    generation.current++;
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isRestoring, restoreError, restoreSession, login, signup, logout }),
    [user, isRestoring, restoreError, restoreSession, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
