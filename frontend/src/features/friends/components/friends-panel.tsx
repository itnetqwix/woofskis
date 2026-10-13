'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageCircle, Search, UserPlus, Users } from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendProfileModal } from '@/features/friends/components/friend-profile-modal';
import { useCreatorFriends } from '@/features/friends/hooks/use-creator-friends';
import { AppApiError } from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { FriendRelationship } from '@/services/friends-api';

function errorText(error: unknown): string {
  if (error instanceof AppApiError || error instanceof Error) return error.message;
  return 'Something went wrong';
}

const RELATIONSHIP_LABEL: Record<FriendRelationship, string> = {
  NONE: 'Not friends',
  INCOMING: 'Incoming request',
  OUTGOING: 'Request sent',
  FRIENDS: 'Friends',
};

export function FriendsPanel() {
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [profileFriend, setProfileFriend] = useState<{
    friendId: string;
    friendName: string;
    avatarUrl?: string | null;
  } | null>(null);

  const { listQuery, searchResults, send, accept, reject, cancel, remove } =
    useCreatorFriends(query);

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(draft.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [draft]);

  const actionError = send.error || accept.error || reject.error || cancel.error || remove.error;
  const list = listQuery.data;

  function pending(userId: string, friendshipId: string | null) {
    return (
      (send.isPending && send.variables === userId) ||
      (accept.isPending && accept.variables === friendshipId) ||
      (reject.isPending && reject.variables === friendshipId) ||
      (cancel.isPending && cancel.variables === friendshipId) ||
      (remove.isPending && remove.variables === friendshipId)
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1 border-b border-border/60 pb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Friends
          </h1>
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Search other creators, send a request, and keep your accepted friends in one list.
        </p>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorText(actionError)}
        </p>
      ) : null}

      <section className="space-y-3" aria-label="Search creators">
        <label
          htmlFor="creator-friend-search"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          Find a creator
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="creator-friend-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search by name"
            className="pl-9"
            autoComplete="off"
          />
        </div>
        {query ? (
          <ul className="space-y-2">
            {searchResults.isLoading ? (
              <li className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching
              </li>
            ) : null}
            {searchResults.isError ? (
              <li className="text-xs text-destructive">{errorText(searchResults.error)}</li>
            ) : null}
            {searchResults.data?.length === 0 ? (
              <li className="text-xs text-muted-foreground">No creators match that name.</li>
            ) : null}
            {searchResults.data?.map((hit) => (
              <PersonRow
                key={hit.id}
                name={hit.name}
                avatarUrl={hit.avatarUrl}
                status={RELATIONSHIP_LABEL[hit.relationship]}
                onSelectProfile={
                  hit.relationship === 'FRIENDS'
                    ? () =>
                        setProfileFriend({
                          friendId: hit.id,
                          friendName: hit.name,
                          avatarUrl: hit.avatarUrl,
                        })
                    : undefined
                }
              >
                <RelationshipActions
                  userId={hit.id}
                  friendshipId={hit.friendshipId}
                  relationship={hit.relationship}
                  busy={pending(hit.id, hit.friendshipId)}
                  confirmRemoveId={confirmRemoveId}
                  onConfirmRemove={setConfirmRemoveId}
                  onSend={(id) => void send.mutate(id)}
                  onAccept={(id) => void accept.mutate(id)}
                  onReject={(id) => void reject.mutate(id)}
                  onCancel={(id) => void cancel.mutate(id)}
                  onRemove={(id) => void remove.mutate(id)}
                />
              </PersonRow>
            ))}
          </ul>
        ) : null}
      </section>

      {listQuery.isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading friends
        </p>
      ) : null}
      {listQuery.isError ? (
        <p className="text-xs text-destructive">{errorText(listQuery.error)}</p>
      ) : null}

      {list ? (
        <>
          <FriendSection title="Incoming requests" empty="No incoming requests.">
            {list?.incoming.map((item) => (
              <PersonRow
                key={item.id}
                name={item.user.name}
                avatarUrl={item.user.avatarUrl}
                status="Incoming request"
              >
                <RelationshipActions
                  userId={item.user.id}
                  friendshipId={item.id}
                  relationship="INCOMING"
                  busy={pending(item.user.id, item.id)}
                  confirmRemoveId={confirmRemoveId}
                  onConfirmRemove={setConfirmRemoveId}
                  onSend={(id) => void send.mutate(id)}
                  onAccept={(id) => void accept.mutate(id)}
                  onReject={(id) => void reject.mutate(id)}
                  onCancel={(id) => void cancel.mutate(id)}
                  onRemove={(id) => void remove.mutate(id)}
                />
              </PersonRow>
            ))}
          </FriendSection>

          <FriendSection title="Outgoing requests" empty="No outgoing requests.">
            {list?.outgoing.map((item) => (
              <PersonRow
                key={item.id}
                name={item.user.name}
                avatarUrl={item.user.avatarUrl}
                status="Request sent"
              >
                <RelationshipActions
                  userId={item.user.id}
                  friendshipId={item.id}
                  relationship="OUTGOING"
                  busy={pending(item.user.id, item.id)}
                  confirmRemoveId={confirmRemoveId}
                  onConfirmRemove={setConfirmRemoveId}
                  onSend={(id) => void send.mutate(id)}
                  onAccept={(id) => void accept.mutate(id)}
                  onReject={(id) => void reject.mutate(id)}
                  onCancel={(id) => void cancel.mutate(id)}
                  onRemove={(id) => void remove.mutate(id)}
                />
              </PersonRow>
            ))}
          </FriendSection>

          <FriendSection title="Friends" empty="You have not added any friends yet.">
            {list?.friends.map((item) => (
              <PersonRow
                key={item.id}
                name={item.user.name}
                avatarUrl={item.user.avatarUrl}
                status="Friends"
                onSelectProfile={() =>
                  setProfileFriend({
                    friendId: item.user.id,
                    friendName: item.user.name,
                    avatarUrl: item.user.avatarUrl,
                  })
                }
              >
                <RelationshipActions
                  userId={item.user.id}
                  friendshipId={item.id}
                  relationship="FRIENDS"
                  busy={pending(item.user.id, item.id)}
                  confirmRemoveId={confirmRemoveId}
                  onConfirmRemove={setConfirmRemoveId}
                  onSend={(id) => void send.mutate(id)}
                  onAccept={(id) => void accept.mutate(id)}
                  onReject={(id) => void reject.mutate(id)}
                  onCancel={(id) => void cancel.mutate(id)}
                  onRemove={(id) => void remove.mutate(id)}
                />
              </PersonRow>
            ))}
          </FriendSection>
        </>
      ) : null}

      <FriendProfileModal
        open={Boolean(profileFriend)}
        onOpenChange={(open) => {
          if (!open) setProfileFriend(null);
        }}
        friendId={profileFriend?.friendId ?? null}
        friendName={profileFriend?.friendName}
        avatarUrl={profileFriend?.avatarUrl}
      />
    </div>
  );
}

function FriendSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
        {items.length > 0 ? ` (${items.length})` : ''}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

function PersonRow({
  name,
  avatarUrl,
  status,
  onSelectProfile,
  children,
}: {
  name: string;
  avatarUrl?: string | null;
  status: string;
  onSelectProfile?: () => void;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
        onSelectProfile && 'hover:border-primary/40'
      )}
    >
      <div
        {...(onSelectProfile
          ? {
              role: 'button',
              tabIndex: 0,
              onClick: onSelectProfile,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectProfile();
                }
              },
              'aria-label': `View ${name}'s profile`,
              className:
                'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 -m-1 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            }
          : {
              className: 'flex min-w-0 items-center gap-3',
            })}
      >
        <ProfileAvatar name={name} url={avatarUrl} className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-sm font-semibold text-foreground',
              onSelectProfile && 'transition-colors group-hover:text-primary'
            )}
          >
            {name}
          </p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </li>
  );
}

function RelationshipActions({
  userId,
  friendshipId,
  relationship,
  busy,
  confirmRemoveId,
  onConfirmRemove,
  onSend,
  onAccept,
  onReject,
  onCancel,
  onRemove,
}: {
  userId: string;
  friendshipId: string | null;
  relationship: FriendRelationship;
  busy: boolean;
  confirmRemoveId: string | null;
  onConfirmRemove: (id: string | null) => void;
  onSend: (userId: string) => void;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  onCancel: (friendshipId: string) => void;
  onRemove: (friendshipId: string) => void;
}) {
  if (relationship === 'NONE') {
    return (
      <Button size="sm" disabled={busy} onClick={() => onSend(userId)} className="gap-1.5">
        <UserPlus className="h-3.5 w-3.5" />
        Add friend
      </Button>
    );
  }

  if (!friendshipId) return null;

  if (relationship === 'INCOMING') {
    return (
      <>
        <Button size="sm" disabled={busy} onClick={() => onAccept(friendshipId)}>
          Accept
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(friendshipId)}>
          Reject
        </Button>
      </>
    );
  }

  if (relationship === 'OUTGOING') {
    return (
      <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(friendshipId)}>
        Cancel request
      </Button>
    );
  }

  const confirming = confirmRemoveId === friendshipId;
  if (!confirming) {
    return (
      <>
        <Button size="sm" variant="outline" asChild>
          <Link href={`/creator/friends/${friendshipId}`}>
            <MessageCircle className="h-3.5 w-3.5" />
            Message
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onConfirmRemove(friendshipId)}
        >
          Remove
        </Button>
      </>
    );
  }
  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={() => {
          onRemove(friendshipId);
          onConfirmRemove(null);
        }}
      >
        Confirm remove
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => onConfirmRemove(null)}>
        Keep
      </Button>
    </>
  );
}
