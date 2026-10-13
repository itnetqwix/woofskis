'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { openChatStream, type ChatStreamEvent } from '@/features/chat/chat-stream';
import { useAppSelector } from '@/store/hooks';
import {
  listChatConversations,
  listChatMessages,
  markChatRead,
  sendChatMessage,
  type ChatConversation,
  type ChatHistory,
  type ChatMessage,
} from '@/services/chat-api';

export const CHAT_CONVERSATIONS_KEY = ['creator-chat-conversations'] as const;

export function chatMessagesKey(friendshipId: string) {
  return ['creator-chat-messages', friendshipId] as const;
}

async function unwrap<T>(promise: Promise<{ success: boolean; message: string; data: T | null }>) {
  const envelope = await promise;
  if (!envelope.success || envelope.data === null) {
    throw new Error(envelope.message || 'Request failed');
  }
  return envelope.data;
}

function appendMessage(page: ChatHistory | undefined, message: ChatMessage): ChatHistory {
  const messages = page?.messages ?? [];
  if (messages.some((item) => item.id === message.id))
    return page ?? { messages, nextBefore: null };
  return { messages: [...messages, message], nextBefore: page?.nextBefore ?? null };
}

export interface PendingChatMessage {
  localId: string;
  friendshipId: string;
  body: string | null;
  attachmentLabel: string | null;
  status: 'sending' | 'failed';
  error?: string;
}

export function useCreatorChat(activeFriendshipId: string | null) {
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [earlier, setEarlier] = useState<ChatMessage[]>([]);
  const [earlierCursor, setEarlierCursor] = useState<string | null | undefined>(undefined);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [earlierError, setEarlierError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChatMessage[]>([]);
  const activeRef = useRef(activeFriendshipId);
  const userRef = useRef(userId);
  activeRef.current = activeFriendshipId;
  userRef.current = userId;

  const conversations = useQuery({
    queryKey: CHAT_CONVERSATIONS_KEY,
    queryFn: () => unwrap<ChatConversation[]>(listChatConversations()),
  });

  const history = useQuery({
    queryKey: activeFriendshipId
      ? chatMessagesKey(activeFriendshipId)
      : ['creator-chat-messages', 'none'],
    enabled: Boolean(activeFriendshipId),
    queryFn: () => unwrap<ChatHistory>(listChatMessages(activeFriendshipId as string)),
  });

  useEffect(() => {
    setEarlier([]);
    setEarlierCursor(undefined);
    setEarlierError(null);
    setPending([]);
  }, [activeFriendshipId]);

  useEffect(() => {
    if (!activeFriendshipId) return;
    let cancelled = false;
    void markChatRead(activeFriendshipId)
      .then(() => {
        if (cancelled) return;
        queryClient.setQueryData<ChatConversation[]>(CHAT_CONVERSATIONS_KEY, (current) =>
          current?.map((item) =>
            item.friendshipId === activeFriendshipId ? { ...item, unreadCount: 0 } : item
          )
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeFriendshipId, queryClient]);

  useEffect(() => {
    return openChatStream((event: ChatStreamEvent) => {
      if (event.type === 'message') {
        const message = event.message;
        if (message.friendshipId === activeRef.current) {
          queryClient.setQueryData<ChatHistory>(chatMessagesKey(message.friendshipId), (page) =>
            appendMessage(page, message)
          );
          if (message.senderId !== userRef.current) {
            void markChatRead(message.friendshipId);
          }
        }
        void queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY });
        return;
      }
      if (event.userId === userRef.current) return;
      if (event.friendshipId !== activeRef.current) return;
      queryClient.setQueryData<ChatHistory>(chatMessagesKey(event.friendshipId), (page) => {
        if (!page) return page;
        return {
          ...page,
          messages: page.messages.map((message) =>
            message.senderId === userRef.current && message.createdAt <= event.lastReadAt
              ? { ...message, read: true }
              : message
          ),
        };
      });
      setEarlier((current) =>
        current.map((message) =>
          message.senderId === userRef.current && message.createdAt <= event.lastReadAt
            ? { ...message, read: true }
            : message
        )
      );
    }, setConnection);
  }, [queryClient]);

  const send = useMutation({
    mutationFn: (input: {
      friendshipId: string;
      body?: string;
      attachment?: { objectKey: string; contentType: string; byteSize: number };
      localId: string;
    }) =>
      unwrap<ChatMessage>(
        sendChatMessage(input.friendshipId, {
          body: input.body,
          attachment: input.attachment,
        })
      ),
    onSuccess: (message, input) => {
      setPending((current) => current.filter((item) => item.localId !== input.localId));
      queryClient.setQueryData<ChatHistory>(chatMessagesKey(message.friendshipId), (page) =>
        appendMessage(page, message)
      );
      void queryClient.invalidateQueries({ queryKey: CHAT_CONVERSATIONS_KEY });
    },
    onError: (error, input) => {
      const message = error instanceof Error ? error.message : 'Message failed';
      setPending((current) =>
        current.map((item) =>
          item.localId === input.localId ? { ...item, status: 'failed', error: message } : item
        )
      );
    },
  });

  function trackPending(item: PendingChatMessage) {
    setPending((current) => [...current.filter((row) => row.localId !== item.localId), item]);
  }

  async function loadEarlier() {
    if (!activeFriendshipId || loadingEarlier) return;
    const cursor = earlierCursor === undefined ? history.data?.nextBefore : earlierCursor;
    if (!cursor) return;
    setLoadingEarlier(true);
    try {
      const page = await unwrap<ChatHistory>(listChatMessages(activeFriendshipId, cursor));
      setEarlier((current) => [...page.messages, ...current]);
      setEarlierCursor(page.nextBefore);
      setEarlierError(null);
    } catch (error) {
      setEarlierError(error instanceof Error ? error.message : 'Could not load earlier messages');
    } finally {
      setLoadingEarlier(false);
    }
  }

  const nextBefore =
    earlierCursor === undefined ? (history.data?.nextBefore ?? null) : earlierCursor;
  const messages = [...earlier, ...(history.data?.messages ?? [])].filter(
    (message, index, all) => all.findIndex((item) => item.id === message.id) === index
  );

  return {
    userId,
    connection,
    conversations,
    history,
    messages,
    pending: pending.filter((item) => item.friendshipId === activeFriendshipId),
    nextBefore,
    loadingEarlier,
    earlierError,
    loadEarlier,
    send,
    trackPending,
  };
}
