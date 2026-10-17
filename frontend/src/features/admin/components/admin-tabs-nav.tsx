'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Palette, ShieldCheck, Trophy, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminTabsNavProps {
  className?: string;
  contestsCount?: number;
  brandsCount?: number;
  pendingModerationCount?: number;
}

export function AdminTabsNav({
  className,
  contestsCount,
  brandsCount,
  pendingModerationCount,
}: AdminTabsNavProps) {
  const pathname = usePathname();

  const isContests = pathname.startsWith('/admin/contests');
  const isCreators = pathname.startsWith('/admin/creators');
  const isModeration = pathname.startsWith('/admin/moderation');

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3',
        className
      )}
    >
      <Link
        href="/admin/contests"
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
          isContests
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
      >
        <Layers className="h-4 w-4" />
        <span>Contests</span>
        {contestsCount !== undefined && (
          <span
            className={cn(
              'py-0.2 rounded-full px-1.5 font-mono text-[10px] font-bold',
              isContests
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {contestsCount}
          </span>
        )}
      </Link>

      <Link
        href="/admin/creators"
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
          isCreators
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
      >
        <Users className="h-4 w-4" />
        <span>Creators</span>
      </Link>

      <Link
        href="/admin/moderation"
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
          isModeration
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        <span>Moderation</span>
        {pendingModerationCount !== undefined && pendingModerationCount > 0 && (
          <span className="py-0.2 animate-pulse rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 font-mono text-[10px] font-bold text-amber-500">
            {pendingModerationCount}
          </span>
        )}
      </Link>
    </div>
  );
}
