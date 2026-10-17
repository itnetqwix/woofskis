'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { CreatorDirectory } from '@/features/admin/components/creator-directory';

export default function AdminCreatorsPage() {
  return (
    <RoleGuard route="/admin/creators">
      <div className="relative flex min-h-screen w-full flex-col bg-background font-sans text-foreground antialiased">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Creators
            </h1>
            <p className="text-xs text-muted-foreground">
              Registered creator accounts, their videos, and account actions.
            </p>
          </div>
          <AdminTabsNav />
          <CreatorDirectory />
        </main>
      </div>
    </RoleGuard>
  );
}
