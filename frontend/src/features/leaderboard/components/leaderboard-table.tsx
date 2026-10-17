'use client';

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';
import { VideoThumbnailCard } from '@/components/common/video-thumbnail-card';

const PAGE_SIZE = 20;

interface LeaderboardTableProps {
  items: LeaderboardItem[];
  onOpenPreview: (item: LeaderboardItem) => void;
  onViewVoters: (item: LeaderboardItem) => void;
  onViewComments: (item: LeaderboardItem) => void;
  emptyTitle?: string;
  emptyDetail?: string;
}

function formatSubmitted(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function RankLabel({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : rank === 2
        ? 'border-zinc-400/45 bg-zinc-400/10 text-zinc-600 dark:text-zinc-300'
        : rank === 3
          ? 'border-orange-800/35 bg-orange-800/10 text-orange-900 dark:text-orange-400'
          : 'border-transparent text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-[1.7rem] shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums leading-none tracking-tight',
        tone
      )}
    >
      #{rank}
    </span>
  );
}

function Thumb({
  item,
  onOpen,
}: {
  item: LeaderboardItem;
  onOpen: (item: LeaderboardItem) => void;
}) {
  return (
    <VideoThumbnailCard
      videoUrl={item.videoUrl}
      thumbnailUrl={item.thumbnailUrl}
      title={item.title}
      durationSeconds={item.durationSeconds}
      onClick={() => onOpen(item)}
      className="h-12 w-8 shrink-0"
      showDuration={false}
    />
  );
}

function Creator({ item, compact = false }: { item: LeaderboardItem; compact?: boolean }) {
  const size = compact ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[10px]';
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {item.creatorAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.creatorAvatarUrl}
          alt=""
          className={cn(size, 'shrink-0 rounded-full object-cover')}
        />
      ) : (
        <span
          className={cn(
            size,
            'flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground'
          )}
        >
          {initials(item.creatorName)}
        </span>
      )}
      <span className={cn('truncate font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
        {item.creatorName}
      </span>
    </div>
  );
}

function Score({ item }: { item: LeaderboardItem }) {
  const hasVotes = item.totalVotes > 0;
  const label = hasVotes ? item.communityScore.toFixed(1) : '—';
  return (
    <div className="text-right">
      <p className="text-lg font-black tabular-nums leading-none text-foreground">{label}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        avg / 10
      </p>
    </div>
  );
}

export function LeaderboardTable({
  items,
  onOpenPreview,
  onViewVoters,
  onViewComments,
  emptyTitle = 'No approved submissions',
  emptyDetail = 'Approved videos for this contest will show up here.',
}: LeaderboardTableProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Trophy className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">{emptyTitle}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{emptyDetail}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-3">Rank</th>
              <th className="px-3 py-3">Video</th>
              <th className="px-3 py-3">Creator</th>
              <th className="px-3 py-3 text-right">Score</th>
              <th className="px-3 py-3 text-right">Votes</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b border-border/70 last:border-0',
                  item.rank === 1 && 'bg-amber-500/10'
                )}
              >
                <td className="px-3 py-3">
                  <RankLabel rank={item.rank} />
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenPreview(item)}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <Thumb item={item} onOpen={onOpenPreview} />
                    <span className="line-clamp-2 font-semibold text-foreground">{item.title}</span>
                  </button>
                </td>
                <td className="px-3 py-3">
                  <Creator item={item} />
                </td>
                <td className="px-3 py-3">
                  <Score item={item} />
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-foreground">
                  {item.totalVotes.toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Approved
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                  {formatSubmitted(item.submittedAt)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ActionButton onClick={() => onOpenPreview(item)}>View</ActionButton>
                    <ActionButton onClick={() => onViewVoters(item)}>Voters</ActionButton>
                    <ActionButton onClick={() => onViewComments(item)}>Comments</ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {slice.map((item) => (
          <li
            key={item.id}
            className={cn('min-w-0 px-2.5 py-2', item.rank === 1 && 'bg-amber-500/[0.07]')}
          >
            <div className="flex min-w-0 items-center gap-2">
              <RankLabel rank={item.rank} />
              <Thumb item={item} onOpen={onOpenPreview} />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpenPreview(item)}
                  className="block w-full truncate text-left text-sm font-semibold text-foreground"
                >
                  {item.title}
                </button>
                <div className="mt-0.5">
                  <Creator item={item} compact />
                </div>
              </div>
              <div className="shrink-0 pl-1 text-right">
                <p className="text-sm font-black tabular-nums leading-none text-foreground">
                  {item.totalVotes > 0 ? item.communityScore.toFixed(1) : '—'}
                </p>
                <p className="mt-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {item.totalVotes.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center justify-between gap-1.5 pl-8">
              <span className="text-[10px] text-muted-foreground">
                Approved · {formatSubmitted(item.submittedAt)}
              </span>
              <div className="flex flex-wrap justify-end gap-1">
                <ActionButton onClick={() => onOpenPreview(item)}>View</ActionButton>
                <ActionButton onClick={() => onViewVoters(item)}>Voters</ActionButton>
                <ActionButton onClick={() => onViewComments(item)}>Comments</ActionButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-xs">
        <span className="text-muted-foreground">
          {start + 1}–{start + slice.length} of {items.length}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            className="font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted"
    >
      {children}
    </button>
  );
}
