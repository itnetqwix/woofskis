'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppApiError } from '@/lib/axios';
import {
  listSuperAdminOrganizations,
  reinstateOrganization,
  suspendOrganization,
  type SuperAdminOrganization,
} from '@/services/super-admin-api';

function failureMessage(error: unknown, fallback: string): string {
  if (error instanceof AppApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * M10-P02. Organization list plus suspend/reinstate against the SUPER_ADMIN API.
 * The API list is the only source for tenant status on the super-admin page.
 */
export function useSuperAdminOrganizations() {
  const [organizations, setOrganizations] = useState<SuperAdminOrganization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const envelope = await listSuperAdminOrganizations();
      if (!envelope.success || !Array.isArray(envelope.data)) {
        throw new Error(envelope.message || 'Organizations could not be loaded');
      }
      setOrganizations(envelope.data);
    } catch (error: unknown) {
      setLoadError(failureMessage(error, 'Organizations could not be loaded'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const replace = (updated: SuperAdminOrganization) => {
    setOrganizations((prev) => prev.map((org) => (org.id === updated.id ? updated : org)));
  };

  const suspend = useCallback(async (id: string, reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      const message = 'Suspension reason is required';
      setActionError(message);
      throw new Error(message);
    }
    setPendingId(id);
    setActionError(null);
    try {
      const envelope = await suspendOrganization(id, trimmed);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Organization could not be suspended');
      }
      replace(envelope.data);
      return envelope.data;
    } catch (error: unknown) {
      const message = failureMessage(error, 'Organization could not be suspended');
      setActionError(message);
      throw new Error(message);
    } finally {
      setPendingId(null);
    }
  }, []);

  const reinstate = useCallback(async (id: string) => {
    setPendingId(id);
    setActionError(null);
    try {
      const envelope = await reinstateOrganization(id);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Organization could not be reinstated');
      }
      replace(envelope.data);
      return envelope.data;
    } catch (error: unknown) {
      const message = failureMessage(error, 'Organization could not be reinstated');
      setActionError(message);
      throw new Error(message);
    } finally {
      setPendingId(null);
    }
  }, []);

  return {
    organizations,
    isLoading,
    loadError,
    actionError,
    pendingId,
    refresh,
    suspend,
    reinstate,
    clearActionError: () => setActionError(null),
  };
}
