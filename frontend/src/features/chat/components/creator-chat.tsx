'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Loader2, Send, Smile, X } from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { Button } from '@/components/ui/button';
import { putFileToPresignedUrl, uploadFailureMessage } from '@/features/submissions/lib/s3-upload';
import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_ATTACHMENT_TYPES,
  CHAT_BODY_MAX,
  presignChatAttachment,
  type ChatAttachmentType,
  type ChatConversation,
} from '@/services/chat-api';
import { useCreatorChat, type PendingChatMessage } from '@/features/chat/hooks/use-creator-chat';
import { AppApiError } from '@/lib/axios';
import { cn } from '@/lib/utils';

const EMOJIS = [
  '😀',
  '😂',
  '😍',
  '😊',
  '😉',
  '😎',
  '🤔',
  '😢',
  '👍',
  '❤️',
  '🔥',
  '🎉',
  '👏',
  '🙏',
  '🤣',
  '💯',
];

function errorText(error: unknown): string {
  if (error instanceof AppApiError || error instanceof Error) return error.message;
  return 'Something went wrong';
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function asChatType(file: File): ChatAttachmentType | null {
  const raw = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  return (CHAT_ATTACHMENT_TYPES as readonly string[]).includes(raw)
    ? (raw as ChatAttachmentType)
    : null;
}

export function ChatInbox() {
  return <CreatorChat activeFriendshipId={null} inboxOnly />;
}

export function CreatorChat({
  activeFriendshipId,
  inboxOnly = false,
  focus = false,
}: {
  activeFriendshipId: string | null;
  inboxOnly?: boolean;
  focus?: boolean;
}) {
  const chat = useCreatorChat(activeFriendshipId);
  const list = chat.conversations.data ?? [];
  const active = list.find((item) => item.friendshipId === activeFriendshipId) ?? null;

  if (focus && activeFriendshipId) {
    return (
      <Thread
        friendshipId={activeFriendshipId}
        peerName={active?.peer.name ?? 'Friend'}
        peerAvatar={active?.peer.avatarUrl}
        chat={chat}
        showBack
      />
    );
  }

  return (
    <div className={cn('flex min-h-[70vh] flex-col gap-4', !inboxOnly && 'md:flex-row')}>
      <aside
        className={cn(
          'w-full md:w-80 md:shrink-0',
          !inboxOnly && activeFriendshipId && 'hidden md:block'
        )}
        aria-label="Conversations"
      >
        <ConversationList
          items={list}
          activeId={activeFriendshipId}
          loading={chat.conversations.isLoading}
          error={chat.conversations.isError ? errorText(chat.conversations.error) : null}
        />
      </aside>
      {inboxOnly ? null : (
        <section
          className={cn('min-w-0 flex-1', !activeFriendshipId && 'hidden md:flex md:flex-col')}
          aria-label="Conversation"
        >
          {activeFriendshipId ? (
            <Thread
              friendshipId={activeFriendshipId}
              peerName={active?.peer.name ?? 'Friend'}
              peerAvatar={active?.peer.avatarUrl}
              chat={chat}
            />
          ) : (
            <EmptyPane text="Choose a friend to start a conversation." />
          )}
        </section>
      )}
    </div>
  );
}

function ConversationList({
  items,
  activeId,
  loading,
  error,
}: {
  items: ChatConversation[];
  activeId: string | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Messages</h2>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading conversations
        </p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!loading && items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
          No conversations yet. Message an accepted friend.
        </p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.friendshipId}>
            <Link
              href={`/creator/friends/${item.friendshipId}`}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 transition-colors hover:border-primary/40',
                item.friendshipId === activeId && 'border-primary/50'
              )}
            >
              <ProfileAvatar
                name={item.peer.name}
                url={item.peer.avatarUrl}
                className="h-10 w-10 shrink-0 rounded-full"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {item.peer.name}
                  </span>
                  {item.lastMessage ? (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatWhen(item.lastMessage.createdAt)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {item.lastMessage?.preview ?? 'No messages yet'}
                  </span>
                  {item.unreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {item.unreadCount}
                    </span>
                  ) : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyPane({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function Thread({
  friendshipId,
  peerName,
  peerAvatar,
  chat,
  showBack = false,
}: {
  friendshipId: string;
  peerName: string;
  peerAvatar?: string | null;
  chat: ReturnType<typeof useCreatorChat>;
  showBack?: boolean;
}) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const files = useRef(new Map<string, File>());
  const sending = useRef(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const connectionLabel =
    chat.connection === 'live'
      ? 'Live'
      : chat.connection === 'connecting'
        ? 'Connecting'
        : 'Reconnecting';

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [chat.messages.length, chat.pending.length]);

  async function submit(retry?: PendingChatMessage, retryFile?: File | null) {
    if (sending.current) return;
    const text = (retry ? (retry.body ?? '') : draft).trim();
    const upload = retry ? (files.current.get(retry.localId) ?? retryFile ?? null) : file;
    if (!text && !upload) return;
    if (text.length > CHAT_BODY_MAX) {
      setComposeError(`Message cannot exceed ${CHAT_BODY_MAX} characters`);
      return;
    }
    sending.current = true;
    const localId = retry?.localId ?? crypto.randomUUID();
    if (upload) files.current.set(localId, upload);
    setComposeError(null);
    chat.trackPending({
      localId,
      friendshipId,
      body: text || null,
      attachmentLabel: upload?.name ?? retry?.attachmentLabel ?? null,
      status: 'sending',
    });
    if (!retry) {
      setDraft('');
      setFile(null);
      setEmojiOpen(false);
    }
    try {
      let attachment: { objectKey: string; contentType: string; byteSize: number } | undefined;
      if (upload) {
        if (upload.size > CHAT_ATTACHMENT_MAX_BYTES) {
          throw new Error('Attachment cannot exceed 100MB');
        }
        const contentType = asChatType(upload);
        if (!contentType) {
          throw new Error('Attachment must be a JPEG, PNG, WebP, GIF, MP4, WebM, or MOV');
        }
        setUploadPercent(0);
        const presign = await presignChatAttachment({
          friendshipId,
          contentType,
          fileSizeBytes: upload.size,
        });
        if (!presign.success || !presign.data) {
          throw new Error(presign.message || 'Could not prepare the upload');
        }
        await putFileToPresignedUrl(
          presign.data,
          upload,
          (progress) => {
            setUploadPercent(progress.percent);
          },
          'Attachment upload failed'
        );
        attachment = {
          objectKey: presign.data.objectKey,
          contentType,
          byteSize: upload.size,
        };
        setUploadPercent(null);
      }
      await chat.send.mutateAsync({
        friendshipId,
        localId,
        body: text || undefined,
        attachment,
      });
      files.current.delete(localId);
    } catch (error) {
      setUploadPercent(null);
      const message = uploadFailureMessage(error);
      setComposeError(message);
      chat.trackPending({
        localId,
        friendshipId,
        body: text || null,
        attachmentLabel: upload?.name ?? retry?.attachmentLabel ?? null,
        status: 'failed',
        error: message,
      });
    } finally {
      sending.current = false;
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col rounded-xl border border-border/60 bg-card/80">
      <header className="flex items-center gap-3 border-b border-border/60 px-3 py-3">
        <Button
          size="icon-sm"
          variant="ghost"
          className={showBack ? undefined : 'md:hidden'}
          onClick={() => router.push('/creator/friends')}
          aria-label="Back to friends"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ProfileAvatar name={peerName} url={peerAvatar} className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{peerName}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {connectionLabel}
          </p>
        </div>
      </header>

      <div ref={scroller} className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {chat.nextBefore ? (
          <Button
            size="sm"
            variant="ghost"
            className="self-center"
            disabled={chat.loadingEarlier}
            onClick={() => void chat.loadEarlier()}
          >
            {chat.loadingEarlier ? 'Loading' : 'Load earlier messages'}
          </Button>
        ) : null}
        {chat.history.isLoading ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading messages
          </p>
        ) : null}
        {chat.history.isError ? (
          <p className="text-xs text-destructive">{errorText(chat.history.error)}</p>
        ) : null}
        {chat.earlierError ? <p className="text-xs text-destructive">{chat.earlierError}</p> : null}
        {!chat.history.isLoading && chat.messages.length === 0 && chat.pending.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet. Say hello.
          </p>
        ) : null}
        {chat.messages.map((message) => {
          const mine = message.senderId === chat.userId;
          return (
            <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] space-y-1 rounded-2xl px-3 py-2 text-sm sm:max-w-[70%]',
                  mine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {message.body ? (
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                ) : null}
                {message.attachment?.kind === 'IMAGE' && message.attachment.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={message.attachment.url} alt="" className="max-h-64 rounded-lg" />
                ) : null}
                {message.attachment?.kind === 'VIDEO' && message.attachment.url ? (
                  <video src={message.attachment.url} controls className="max-h-64 rounded-lg" />
                ) : null}
                <p
                  className={cn(
                    'text-[10px]',
                    mine ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  )}
                >
                  {formatWhen(message.createdAt)}
                  {mine ? (message.read ? ' · Read' : ' · Sent') : ''}
                </p>
              </div>
            </div>
          );
        })}
        {chat.pending.map((item) => (
          <div key={item.localId} className="flex justify-end">
            <div className="max-w-[85%] space-y-1 rounded-2xl bg-primary/70 px-3 py-2 text-sm text-primary-foreground">
              {item.body ? <p className="whitespace-pre-wrap break-words">{item.body}</p> : null}
              {item.attachmentLabel ? <p className="text-xs">{item.attachmentLabel}</p> : null}
              <p className="text-[10px]">
                {item.status === 'sending' ? 'Sending' : 'Failed'}
                {item.status === 'failed' ? (
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => void submit(item)}
                  >
                    Retry
                  </button>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="space-y-2 border-t border-border/60 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {composeError ? <p className="text-xs text-destructive">{composeError}</p> : null}
        {uploadPercent !== null ? (
          <div
            className="h-1.5 overflow-hidden rounded-full bg-secondary"
            aria-label="Upload progress"
          >
            <div className="h-full bg-primary" style={{ width: `${uploadPercent}%` }} />
          </div>
        ) : null}
        {file ? (
          <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{file.name}</span>
            <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </p>
        ) : null}
        {emojiOpen ? (
          <div className="flex flex-wrap gap-1" aria-label="Emoji">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-md px-1.5 py-1 text-base hover:bg-secondary"
                onClick={() => setDraft((current) => `${current}${emoji}`.slice(0, CHAT_BODY_MAX))}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Insert emoji"
            onClick={() => setEmojiOpen((open) => !open)}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-secondary">
            <ImagePlus className="h-4 w-4" />
            <span className="sr-only">Attach image or video</span>
            <input
              type="file"
              accept={CHAT_ATTACHMENT_TYPES.join(',')}
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                setFile(next);
                event.target.value = '';
              }}
            />
          </label>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, CHAT_BODY_MAX))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Message"
            aria-label="Message"
            className="max-h-28 min-h-9 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button
            type="submit"
            size="icon-sm"
            aria-label="Send message"
            disabled={uploadPercent !== null}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
