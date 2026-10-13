'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCredentials,
  logout as reduxLogout,
  updateUser as reduxUpdateUser,
} from '@/store/slices/auth-slice';
import { AuthUser, UserRole, LoginCredentials, CreatorRegisterPayload } from '@/types/auth';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { AppApiError, COS_UNAUTHORIZED_EVENT } from '@/lib/axios';
import {
  login as loginRequest,
  registerCreator as registerCreatorRequest,
  me as fetchMe,
  requireAuthData,
} from '@/services/auth-api';
import { mapApiUserToAuthUser, assertNoPasswordHash } from '@/features/auth/lib/map-auth-user';
import { toLoginRequest, toRegisterCreatorRequest } from '@/features/auth/lib/auth-payloads';
import { useAppStore } from '@/store/hooks';

/**
 * One in-flight GET /auth/me per token. Later mounts reuse the session
 * already stored in Redux and do not call the profile endpoint again.
 */

let currentUserRequest: { token: string; promise: Promise<AuthUser | null> } | null = null;

function loadCurrentUserOnce(token: string): Promise<AuthUser | null> {
  if (currentUserRequest?.token === token) return currentUserRequest.promise;
  const promise: Promise<AuthUser | null> = (async () => {
    try {
      const envelope = await fetchMe();
      const apiUser = requireAuthData(envelope, 'User profile not found');
      return mapApiUserToAuthUser(apiUser);
    } catch {
      if (currentUserRequest?.token === token) currentUserRequest = null;
      return null;
    }
  })();
  currentUserRequest = { token, promise };
  return promise;
}

function clearCurrentUserRequest(): void {
  currentUserRequest = null;
}

export function useAuthSession() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const reduxAuth = useAppSelector((state) => state.auth);

  const [activeUser, setActiveUser] = useState<AuthUser | null>(reduxAuth.user);
  const [token, setToken] = useState<string | null>(reduxAuth.token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClientReady, setIsClientReady] = useState<boolean>(false);

  const applySession = useCallback(
    (user: AuthUser, sessionToken: string) => {
      assertNoPasswordHash(user);
      setActiveUser(user);
      setToken(sessionToken);
      dispatch(setCredentials({ user, token: sessionToken }));
    },
    [dispatch]
  );

  const clearSession = useCallback(() => {
    clearCurrentUserRequest();
    dispatch(reduxLogout());
    setActiveUser(null);
    setToken(null);
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromMe = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        setIsClientReady(true);
        return;
      }

      const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!storedToken) {
        dispatch(reduxLogout());
        setActiveUser(null);
        setToken(null);
        setIsLoading(false);
        setIsClientReady(true);
        return;
      }

      const existing = store.getState().auth;
      if (existing.user && existing.token === storedToken) {
        setActiveUser(existing.user);
        setToken(storedToken);
        setIsLoading(false);
        setIsClientReady(true);
        return;
      }

      try {
        const user = await loadCurrentUserOnce(storedToken);
        if (cancelled) return;
        if (!user || user.role === 'PLATFORM_ADMIN' || user.role === 'superadmin') {
          clearSession();
          return;
        }
        applySession(user, storedToken);
      } catch {
        if (cancelled) return;
        clearSession();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsClientReady(true);
        }
      }
    };

    void hydrateFromMe();

    const handleAuthUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ user?: AuthUser | null; token?: string | null }>).detail;
      if (detail && detail.user && detail.token) {
        setActiveUser(detail.user);
        setToken(detail.token);
      } else {
        setActiveUser(null);
        setToken(null);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.AUTH_TOKEN && !e.newValue) {
        setActiveUser(null);
        setToken(null);
      }
    };

    const handleUnauthorized = () => {
      dispatch(reduxLogout());
      setActiveUser(null);
      setToken(null);
    };

    window.addEventListener('cos_auth_updated', handleAuthUpdated);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(COS_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener('cos_auth_updated', handleAuthUpdated);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COS_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [applySession, clearSession, dispatch, store]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const envelope = await loginRequest(toLoginRequest(credentials));
        const data = requireAuthData(envelope, 'Login successful payload missing');
        const user = mapApiUserToAuthUser(data.user);
        if (user.role === 'PLATFORM_ADMIN' || user.role === 'superadmin') {
          throw new AppApiError('This deployment does not include a business-owner sign-in.', 403);
        }
        applySession(user, data.token);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession]
  );

  const registerCreator = useCallback(
    async (payload: CreatorRegisterPayload): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const envelope = await registerCreatorRequest(toRegisterCreatorRequest(payload));
        const data = requireAuthData(envelope, 'Creator registration payload missing');
        const user = mapApiUserToAuthUser(data.user);
        applySession(user, data.token);
        router.push('/creator');
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession, router]
  );

  const logout = useCallback(
    (redirectTo: string = '/login') => {
      clearSession();
      router.push(redirectTo);
    },
    [clearSession, router]
  );

  const updateUserProfile = useCallback(
    (updates: Partial<AuthUser>) => {
      dispatch(reduxUpdateUser(updates));
      setActiveUser((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [dispatch]
  );

  const currentRole: UserRole = activeUser?.role || 'GUEST';
  const isAuthenticated: boolean = Boolean(token && activeUser && activeUser.role !== 'GUEST');

  const hasRole = useCallback(
    (role: UserRole) => {
      if (!activeUser) return role === 'GUEST';
      return activeUser.role === role;
    },
    [activeUser]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      if (!activeUser) return roles.includes('GUEST');
      return roles.includes(activeUser.role);
    },
    [activeUser]
  );

  return {
    user: activeUser,
    role: currentRole,
    token,
    isAuthenticated,
    isLoading,
    isClientReady,
    login,
    registerCreator,
    logout,
    updateUserProfile,
    hasRole,
    hasAnyRole,
  };
}
