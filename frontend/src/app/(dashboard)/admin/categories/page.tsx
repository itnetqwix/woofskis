'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { VideoCategoriesPanel } from '@/features/admin/components/video-categories-panel';

export default function AdminVideoCategoriesPage() {
  return (
    <RoleGuard route="/admin/categories">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        <AppHeader />
        <TenantSwitcherHUD />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Video categories
            </h1>
            <p className="text-xs text-muted-foreground">
              Official categories for creator uploads. Deactivating or refusing a delete keeps existing videos.
            </p>
          </div>
          <AdminTabsNav />
          <VideoCategoriesPanel />
        </main>
      </div>
    </RoleGuard>
  );
}
