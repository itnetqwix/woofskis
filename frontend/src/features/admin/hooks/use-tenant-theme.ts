'use client';

import { useCallback, useEffect, useState } from 'react';
import { TenantBrandConfig } from '@/types/tenant';
import {
  applyTenantTheme,
  deploymentBrandPlaceholder,
  getStoredActiveTenant,
  setActiveTenant,
} from '@/lib/theme-utils';

const WOOFSKIS = deploymentBrandPlaceholder('woofskis');
const RIPSKIS = deploymentBrandPlaceholder('ripskis');

/**
 * Provides current active tenant branding (Woofskis or Ripskis) and brand-switch capability.
 */
export function useTenantTheme() {
  const [activeBrand, setActiveBrand] = useState<TenantBrandConfig>(() => {
    return getStoredActiveTenant();
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const current = getStoredActiveTenant();
    setActiveBrand(current);
    applyTenantTheme(current);
    setIsLoaded(true);

    const onBrandSwitched = (e: Event) => {
      const customEvent = e as CustomEvent<TenantBrandConfig>;
      if (customEvent.detail) {
        setActiveBrand(customEvent.detail);
      }
    };
    window.addEventListener('cos_brand_switched', onBrandSwitched);
    return () => window.removeEventListener('cos_brand_switched', onBrandSwitched);
  }, []);

  const switchTenant = useCallback((brandIdOrSlug: string) => {
    const brand = setActiveTenant(brandIdOrSlug);
    setActiveBrand(brand);
    return brand;
  }, []);

  const refreshBranding = useCallback(async (_slug: string) => activeBrand, [activeBrand]);
  const updateBrand = useCallback((_brandId: string, _updates: Partial<TenantBrandConfig>) => {
    return;
  }, []);
  const createBrand = useCallback(
    (brandData: Omit<TenantBrandConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      return { ...activeBrand, ...brandData, id: activeBrand.id };
    },
    [activeBrand]
  );
  const deleteBrand = useCallback((_brandId: string) => {
    return;
  }, []);
  const resetToDefaultBrands = useCallback(() => {
    return;
  }, []);

  return {
    brands: [WOOFSKIS, RIPSKIS],
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

