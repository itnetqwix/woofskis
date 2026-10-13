'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTabsNav } from '@/features/admin/components/admin-tabs-nav';
import { CreatorProfile } from '@/features/admin/components/creator-profile';

export default function AdminCreatorProfilePage() {
  const params = useParams<{ id: string | string[] }>();
  const rawId = params?.id;
  const creatorId = (Array.isArray(rawId) ? rawId[0] : rawId) ?? '';

  return (
    <RoleGuard route="/admin/creators">
      <div className="relative flex min-h-screen w-full flex-col bg-background font-sans text-foreground antialiased">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <AdminTabsNav />
          {creatorId ? <CreatorProfile creatorId={creatorId} /> : null}
        </main>
      </div>
    </RoleGuard>
  );
}
