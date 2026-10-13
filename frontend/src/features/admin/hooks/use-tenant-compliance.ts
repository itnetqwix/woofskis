'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TenantComplianceWarning, IssueWarningPayload, TenantBrandConfig } from '@/types/tenant';
import {
  getStoredWarnings,
  saveStoredWarnings,
  computeDeadlineTimestamp,
} from '@/lib/compliance-utils';
import { getStoredBrands } from '@/lib/theme-utils';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export function useTenantCompliance(targetTenantId?: string) {
  const [warnings, setWarnings] = useState<TenantComplianceWarning[]>([]);
  const [brands, setBrands] = useState<TenantBrandConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load state from localStorage on client mount
  const refreshData = useCallback(() => {
    const loadedWarnings = getStoredWarnings();
    const loadedBrands = getStoredBrands();
    setWarnings(loadedWarnings);
    setBrands(loadedBrands);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refreshData();

    const handleWarningIssued = (e: any) => {
      const freshWarnings = getStoredWarnings();
      setWarnings(freshWarnings);
    };

    const handleWarningResolved = (e: any) => {
      const freshWarnings = getStoredWarnings();
      setWarnings(freshWarnings);
    };

    const handleBrandsUpdated = (e: any) => {
      const freshBrands = getStoredBrands();
      setBrands(freshBrands);
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.TENANT_WARNINGS ||
        e.key === STORAGE_KEYS.BRANDS_CONFIG ||
        e.key === STORAGE_KEYS.ACTIVE_TENANT_ID
      ) {
        refreshData();
      }
    };

    window.addEventListener('cos_tenant_warning_issued', handleWarningIssued);
    window.addEventListener('cos_tenant_warning_resolved', handleWarningResolved);
    window.addEventListener('cos_tenant_status_updated', handleBrandsUpdated);
    window.addEventListener('cos_brands_updated', handleBrandsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('cos_tenant_warning_issued', handleWarningIssued);
      window.removeEventListener('cos_tenant_warning_resolved', handleWarningResolved);
      window.removeEventListener('cos_tenant_status_updated', handleBrandsUpdated);
      window.removeEventListener('cos_brands_updated', handleBrandsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshData]);

  // Filtered warnings for specific target tenant if provided
  const tenantWarnings = useMemo(() => {
    if (!targetTenantId) return warnings;
    return warnings.filter((w) => w.tenantId.toLowerCase() === targetTenantId.toLowerCase());
  }, [warnings, targetTenantId]);

  // Active (unresolved) warnings
  const activeWarnings = useMemo(() => {
    return tenantWarnings.filter((w) => w.status === 'ACTIVE');
  }, [tenantWarnings]);

  // Resolved warnings
  const resolvedWarnings = useMemo(() => {
    return tenantWarnings.filter((w) => w.status === 'RESOLVED');
  }, [tenantWarnings]);

  // Target brand configuration
  const targetBrand = useMemo(() => {
    if (targetTenantId) {
      return (
        brands.find(
          (b) =>
            b.id.toLowerCase() === targetTenantId.toLowerCase() ||
            b.slug.toLowerCase() === targetTenantId.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [brands, targetTenantId]);

  // Issue a new compliance warning
  const issueWarning = useCallback(
    (payload: IssueWarningPayload, issuedByEmail = 'superadmin@contestos.com') => {
      const matchingBrand = brands.find(
        (b) =>
          b.id.toLowerCase() === payload.tenantId.toLowerCase() ||
          b.slug.toLowerCase() === payload.tenantId.toLowerCase()
      );

      const brandName = payload.brandName || matchingBrand?.name || payload.tenantId;
      const id = `warn_${payload.tenantId}_${Date.now()}`;
      const deadlineTimestamp = computeDeadlineTimestamp(payload.deadline);

      const newWarning: TenantComplianceWarning = {
        id,
        tenantId: payload.tenantId,
        brandName,
        severity: payload.severity,
        reasonCode: payload.reasonCode,
        message: payload.message,
        deadline: payload.deadline,
        deadlineTimestamp,
        status: 'ACTIVE',
        issuedBy: issuedByEmail,
        issuedAt: new Date().toISOString(),
      };

      const currentStored = getStoredWarnings();
      const updated = [newWarning, ...currentStored];
      saveStoredWarnings(updated);
      setWarnings(updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cos_tenant_warning_issued', { detail: newWarning }));
      }

      return newWarning;
    },
    [brands]
  );

  // Mark an active warning as resolved / acknowledged
  const resolveWarning = useCallback(
    (warningId: string, resolutionNotes?: string, resolvedByEmail = 'admin@woofskis.com') => {
      const currentStored = getStoredWarnings();
      const updated = currentStored.map((w) => {
        if (w.id === warningId) {
          return {
            ...w,
            status: 'RESOLVED' as const,
            resolvedAt: new Date().toISOString(),
            resolvedBy: resolvedByEmail,
            resolutionNotes: resolutionNotes || 'Acknowledged and compliance remedy confirmed.',
          };
        }
        return w;
      });

      saveStoredWarnings(updated);
      setWarnings(updated);

      if (typeof window !== 'undefined') {
        const resolvedItem = updated.find((w) => w.id === warningId);
        window.dispatchEvent(
          new CustomEvent('cos_tenant_warning_resolved', { detail: resolvedItem })
        );
      }
    },
    []
  );

  // Dismiss a warning
  const dismissWarning = useCallback((warningId: string) => {
    const currentStored = getStoredWarnings();
    const updated = currentStored.map((w) => {
      if (w.id === warningId) {
        return {
          ...w,
          status: 'DISMISSED' as const,
          resolvedAt: new Date().toISOString(),
        };
      }
      return w;
    });

    saveStoredWarnings(updated);
    setWarnings(updated);
  }, []);

  // Tenant suspension is not handled here (M10-P02-T04). Status comes from
  // Organization.status via useTenantTheme / useSuperAdminOrganizations.

  return {
    warnings,
    tenantWarnings,
    activeWarnings,
    resolvedWarnings,
    hasActiveWarning: activeWarnings.length > 0,
    targetBrand,
    brands,
    isLoaded,
    issueWarning,
    resolveWarning,
    dismissWarning,
    refreshData,
  };
}
