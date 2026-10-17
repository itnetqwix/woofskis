'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { LeaderboardScreen } from '@/features/leaderboard/components/leaderboard-screen';

export default function AdminLeaderboardPage() {
  return (
    <RoleGuard route="/admin/leaderboard">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        <AppHeader />
        <TenantSwitcherHUD />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Leaderboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Approved entries for the selected active contest, ranked by the stored community score.
            </p>
          </div>
          <AdminTabsNav />
          <LeaderboardScreen />
        </main>
      </div>
    </RoleGuard>
  );
}
