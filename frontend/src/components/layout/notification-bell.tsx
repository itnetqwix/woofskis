'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsQueryKey } from '@/lib/query-keys';
import {
  type ApiNotification,
  type ApiNotificationList,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications-api';
import { cn } from '@/lib/utils';

const POLL_INTERVAL_MS = 60_000;

const EMPTY: ApiNotificationList = { items: [], unreadCount: 0 };

function targetPath(notification: ApiNotification): string {
  return notification.type === 'SUBMISSION_PENDING_REVIEW' ? '/admin/moderation' : '/creator';
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data = EMPTY } = useQuery({
    queryKey: notificationsQueryKey,
    refetchInterval: POLL_INTERVAL_MS,
    queryFn: async () => {
      const envelope = await listNotifications();
      return envelope.success && envelope.data ? envelope.data : EMPTY;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
  const readOne = useMutation({ mutationFn: markNotificationRead, onSettled: invalidate });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSettled: invalidate });

  const handleSelect = (notification: ApiNotification) => {
    if (!notification.readAt) readOne.mutate(notification.id);
    router.push(targetPath(notification));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:w-11"
          aria-label={
            data.unreadCount > 0 ? `Notifications (${data.unreadCount} unread)` : 'Notifications'
          }
        >
          <Bell className="h-5 w-5" />
          {data.unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-white">
              {data.unreadCount > 99 ? '99+' : data.unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
          <span>Notifications</span>
          {data.unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                readAll.mutate();
              }}
              className="flex items-center gap-1 normal-case text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No notifications yet
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {data.items.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleSelect(notification)}
                className="flex cursor-pointer items-start gap-2.5 py-2.5"
              >
                <span
                  className={cn(
                    'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                    notification.readAt ? 'bg-transparent' : 'bg-primary'
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-xs text-foreground',
                      notification.readAt ? 'font-medium' : 'font-bold'
                    )}
                  >
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
