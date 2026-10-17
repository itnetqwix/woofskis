'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { LeaderboardScreen } from '@/features/leaderboard/components/leaderboard-screen';

export default function LeaderboardPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <AppHeader />
      <TenantSwitcherHUD />
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <LeaderboardScreen />
      </main>
    </div>
  );
}
