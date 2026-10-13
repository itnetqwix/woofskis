'use client';

import { type ReactNode } from 'react';
import { ReduxProvider } from '@/providers/redux-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TenantThemeInit } from '@/components/providers/tenant-theme-init';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TenantThemeInit />
          {children}
        </ThemeProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
