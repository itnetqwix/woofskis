import React from 'react';
import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { NotFoundView } from '@/features/not-found/components/not-found-view';

export const metadata: Metadata = {
  title: 'Oops! Page Not Found | Woofskis',
  description: 'Looks like this page wandered off. Let’s get you back to the fun on Woofskis!',
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <AppHeader />
      <TenantSwitcherHUD />
      <main className="flex flex-1 items-center justify-center">
        <NotFoundView />
      </main>
      <AppFooter />
    </div>
  );
}
