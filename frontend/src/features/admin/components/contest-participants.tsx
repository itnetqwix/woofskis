'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { creatorDeletionNote, listContestParticipants } from '@/services/admin-creators-api';

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function ContestParticipants({ contestId }: { contestId: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['admin-contest-participants', contestId, page],
    queryFn: async () => {
      const envelope = await listContestParticipants(contestId, { page, limit: 20 });
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Participants could not be loaded');
      }
      return envelope.data;
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading creators…
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {query.error instanceof Error ? query.error.message : 'Participants could not be loaded'}
      </p>
    );
  }

  const { contest, participatingCreatorCount, creators, pagination } = query.data;

  return (
    <div className="space-y-4">
      <Link href="/admin/contests" className="text-xs font-bold text-primary">
        Back to contests
      </Link>
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-xl font-black">{contest.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {contest.status} · {participatingCreatorCount}{' '}
          {participatingCreatorCount === 1 ? 'creator' : 'creators'}
        </p>
      </div>

      {creators.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No creators have submitted to this contest.
        </p>
      ) : (
        <ul className="space-y-3">
          {creators.map((creator) => (
            <li key={creator.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/admin/creators/${creator.id}`}
                    className="text-sm font-black text-primary"
                  >
                    {creator.name}
                  </Link>
                  <p className="break-all text-xs text-muted-foreground">{creator.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {creator.accountStatus === 'BLOCKED' ? 'Blocked' : 'Active'} ·{' '}
                    {creator.submissionCount} {creator.submissionCount === 1 ? 'video' : 'videos'} ·
                    latest {formatWhen(creator.latestSubmissionAt)}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {creator.submissions.map((video) => (
                  <li key={video.id} className="rounded-xl bg-muted/40 px-3 py-2 text-xs">
                    <p className="font-semibold text-foreground">{video.title}</p>
                    <p className="text-muted-foreground">
                      {video.status} · uploaded {formatWhen(video.createdAt)}
                    </p>
                    {creatorDeletionNote(video) ? (
                      <p className="font-semibold text-destructive">{creatorDeletionNote(video)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-9 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="h-9 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
