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
      className="h-14 w-10"
      showDuration={false}
    />
  );
}

function Creator({ item }: { item: LeaderboardItem }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {item.creatorAvatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.creatorAvatarUrl}
          alt=""
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fa4616] text-[10px] font-bold text-white">
          {initials(item.creatorName)}
        </span>
      )}
      <span className="truncate text-sm font-medium text-foreground">{item.creatorName}</span>
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

function RowActions({
  item,
  onViewVoters,
  onViewComments,
}: {
  item: LeaderboardItem;
  onViewVoters: (item: LeaderboardItem) => void;
  onViewComments: (item: LeaderboardItem) => void;
}) {
  const buttonClass =
    'rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted';
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" className={buttonClass} onClick={() => onViewVoters(item)}>
        View voters
      </button>
      <button type="button" className={buttonClass} onClick={() => onViewComments(item)}>
        View comments
      </button>
    </div>
  );
}

export function LeaderboardTable({
  items,
  onOpenPreview,
  onViewVoters,
  onViewComments,
}: LeaderboardTableProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const slice = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Trophy className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
        <h3 className="text-sm font-bold text-foreground">No submissions</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Approved videos for this contest will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3 text-right">Overall rating</th>
              <th className="px-4 py-3 text-right">Total votes</th>
              <th className="px-4 py-3">Voters</th>
              <th className="px-4 py-3">Comments</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((item) => (
              <tr key={item.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb item={item} onOpen={onOpenPreview} />
                    <span className="line-clamp-2 font-semibold text-foreground">{item.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Creator item={item} />
                </td>
                <td className="px-4 py-3">
                  <Score item={item} />
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                  {item.totalVotes}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewVoters(item)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted"
                  >
                    View voters
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onViewComments(item)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted"
                  >
                    View comments
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {slice.map((item) => (
          <li key={item.id} className="space-y-3 p-3">
            <div className="flex items-start gap-3">
              <Thumb item={item} onOpen={onOpenPreview} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
                <div className="mt-2">
                  <Creator item={item} />
                </div>
              </div>
              <Score item={item} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {item.totalVotes}
                </span>{' '}
                votes
              </p>
              <RowActions item={item} onViewVoters={onViewVoters} onViewComments={onViewComments} />
            </div>
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <div
          className={cn(
            'flex items-center justify-between border-t border-border px-4 py-3 text-xs'
          )}
        >
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
      ) : null}
    </div>
  );
}
