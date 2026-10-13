'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { RoleGuard } from '@/components/auth/role-guard';
import { CreatorChat } from '@/features/chat/components/creator-chat';

export default function CreatorFriendConversationPage() {
  const params = useParams<{ friendshipId: string }>();
  const friendshipId = typeof params.friendshipId === 'string' ? params.friendshipId : '';

  return (
    <RoleGuard route="/creator/friends">
      <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
          <CreatorChat activeFriendshipId={friendshipId || null} focus />
        </main>
      </div>
    </RoleGuard>
  );
}
