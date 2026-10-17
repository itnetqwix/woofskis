'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { ContestParticipants } from '@/features/admin/components/contest-participants';

export default function AdminContestCreatorsPage() {
  const params = useParams<{ id: string }>();
  const contestId = params?.id ?? '';

  return (
    <RoleGuard route="/admin/contests">
      <div className="relative flex min-h-screen w-full flex-col bg-background font-sans text-foreground antialiased">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Contest submissions
            </h1>
            <p className="text-xs text-muted-foreground">
              Every video submitted to this contest, grouped by creator, with moderation status.
            </p>
          </div>
          <AdminTabsNav />
          {contestId ? <ContestParticipants contestId={contestId} /> : null}
        </main>
      </div>
    </RoleGuard>
  );
}
