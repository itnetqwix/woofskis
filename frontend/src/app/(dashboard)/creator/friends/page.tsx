'use client';

import React from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { FriendsPanel } from '@/features/friends/components/friends-panel';

export default function CreatorFriendsPage() {
  return (
    <RoleGuard route="/creator/friends">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <FriendsPanel />
        </main>
      </div>
    </RoleGuard>
  );
}
