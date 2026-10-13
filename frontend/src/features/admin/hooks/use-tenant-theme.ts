'use client';

import { useCallback, useEffect, useState } from 'react';
import { TenantBrandConfig } from '@/types/tenant';
import { applyTenantTheme, deploymentBrandPlaceholder } from '@/lib/theme-utils';

const WOOFSKIS = deploymentBrandPlaceholder('woofskis');

/**
 * Deployment branding is static. There is no organization branding API.
 */
export function useTenantTheme() {
  const [activeBrand] = useState<TenantBrandConfig>(WOOFSKIS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    applyTenantTheme(WOOFSKIS);
    setIsLoaded(true);
  }, []);

  const switchTenant = useCallback((_brandIdOrSlug: string) => WOOFSKIS, []);
  const refreshBranding = useCallback(async (_slug: string) => WOOFSKIS, []);
  const updateBrand = useCallback((_brandId: string, _updates: Partial<TenantBrandConfig>) => {
    return;
  }, []);
  const createBrand = useCallback(
    (brandData: Omit<TenantBrandConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      return { ...WOOFSKIS, ...brandData, id: WOOFSKIS.id };
    },
    []
  );
  const deleteBrand = useCallback((_brandId: string) => {
    return;
  }, []);
  const resetToDefaultBrands = useCallback(() => {
    return;
  }, []);

  return {
    brands: [WOOFSKIS],
    activeBrand,
    isLoaded,
    switchTenant,
    refreshBranding,
    updateBrand,
    createBrand,
    deleteBrand,
    resetToDefaultBrands,
    applyLiveTheme: applyTenantTheme,
  };
}
