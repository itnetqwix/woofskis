'use client';

import { useEffect } from 'react';
import { applyTenantTheme, deploymentBrandPlaceholder } from '@/lib/theme-utils';

/** Static Woofskis product branding. No organization API. */
export function TenantThemeInit() {
  useEffect(() => {
    applyTenantTheme(deploymentBrandPlaceholder('woofskis'));
  }, []);

  return null;
}
