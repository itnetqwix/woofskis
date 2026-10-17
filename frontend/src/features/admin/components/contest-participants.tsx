'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Play, ShieldCheck, Trash2 } from 'lucide-react';
import {
  ApiContestParticipant,
  creatorDeletionNote,
  deleteAdminSubmission,
  listContestParticipants,
} from '@/services/admin-creators-api';
import {
  DeleteSubmissionDialog,
  SubmissionThumbnail,
  SubmissionVideoModal,
} from '@/features/admin/components/submission-media';
import { cn } from '@/lib/utils';

type ParticipantVideo = ApiContestParticipant['submissions'][number];

const SUBMISSION_STATUS_STYLES: Record<string, string> = {
  APPROVED: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-500',
  PENDING_REVIEW: 'border-amber-500/30 bg-amber-500/15 text-amber-500',
  REJECTED: 'border-rose-500/30 bg-rose-500/15 text-rose-500',
  FLAGGED: 'border-orange-500/30 bg-orange-500/15 text-orange-500',
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function SubmissionStatusBadge({ status, deleted }: { status: string; deleted: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold',
        deleted
          ? 'border-border bg-muted text-muted-foreground'
          : (SUBMISSION_STATUS_STYLES[status] ?? 'border-border bg-muted text-muted-foreground')
      )}
    >
      {deleted ? 'DELETED' : status.replace('_', ' ')}
    </span>
  );
}

function SubmissionRow({
  video,
  onWatch,
  onDelete,
}: {
  video: ParticipantVideo;
  onWatch: () => void;
  onDelete: () => void;
}) {
  const deletionNote = creatorDeletionNote(video);
  const canPlay = Boolean(video.videoUrl);

  return (
    <li className="flex items-center gap-2.5 rounded-lg bg-muted/30 p-2">
      <button
        type="button"
        disabled={!canPlay}
        onClick={onWatch}
        aria-label={`Play ${video.title}`}
        title={canPlay ? 'Play video' : 'Video playback is not available'}
        className="group relative shrink-0 disabled:cursor-not-allowed"
      >
        <SubmissionThumbnail
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
          videoUrl={video.videoUrl}
          className="h-16 w-12 rounded-md sm:h-16 sm:w-12"
        />
        {canPlay ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 text-white opacity-80 transition-opacity group-hover:opacity-100">
            <Play className="h-4 w-4 fill-white" />
          </span>
        ) : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-semibold text-foreground">{video.title}</p>
          <SubmissionStatusBadge status={video.status} deleted={Boolean(video.deletedAt)} />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Uploaded {formatWhen(video.createdAt)} · score {video.communityScore.toFixed(1)} ·{' '}
          {video.totalVotes} {video.totalVotes === 1 ? 'vote' : 'votes'}
        </p>
        {deletionNote ? (
          <p className="text-[11px] font-semibold text-destructive">{deletionNote}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDelete}
        title="Delete submission"
        aria-label={`Delete ${video.title}`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

export function ContestParticipants({ contestId }: { contestId: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [watching, setWatching] = useState<ParticipantVideo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParticipantVideo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: async ({ video, reason }: { video: ParticipantVideo; reason: string }) => {
      const envelope = await deleteAdminSubmission(video.id, reason);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Video could not be deleted');
      }
      return envelope.data;
    },
    onSuccess: async (_result, { video }) => {
      setDeleteTarget(null);
      setWatching((current) => (current?.id === video.id ? null : current));
      setNotice(`“${video.title}” was deleted and the creator was notified.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-contest-participants', contestId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-creators'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-creator'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-creator-videos'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-creator-contests'] }),
      ]);
    },
  });

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
        Loading submissions…
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
  const pageSubmissions = creators.flatMap((creator) => creator.submissions);
  const statusTotals = pageSubmissions.reduce<Record<string, number>>((totals, video) => {
    const key = video.deletedAt ? 'DELETED' : video.status;
    totals[key] = (totals[key] ?? 0) + 1;
    return totals;
  }, {});

  return (
    <div className="space-y-3">
      <Link
        href="/admin/contests"
        className="inline-flex items-center gap-1 text-xs font-bold text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to contests
      </Link>

      {notice ? <p className="text-xs font-semibold text-primary">{notice}</p> : null}

      {watching?.videoUrl ? (
        <SubmissionVideoModal
          videoId={watching.id}
          videoUrl={watching.videoUrl}
          onClose={() => setWatching(null)}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteSubmissionDialog
          title={deleteTarget.title}
          description={
            <>
              This removes {deleteTarget.title} from {contest.title}. Ratings and comments on this
              video are removed. The creator&apos;s account and the contest stay. The stored media
              file is not deleted.
            </>
          }
          isPending={remove.isPending}
          error={remove.isError && remove.error instanceof Error ? remove.error.message : null}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={(reason) => remove.mutate({ video: deleteTarget, reason })}
        />
      ) : null}

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black">{contest.title}</h2>
          <p className="text-xs text-muted-foreground">
            {contest.status} · {participatingCreatorCount}{' '}
            {participatingCreatorCount === 1 ? 'creator' : 'creators'} · {pageSubmissions.length}{' '}
            {pageSubmissions.length === 1 ? 'submission' : 'submissions'}
            {pagination.totalPages > 1 ? ' on this page' : ''}
          </p>
          {Object.keys(statusTotals).length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {Object.entries(statusTotals).map(([status, count]) => (
                <span
                  key={status}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                    SUBMISSION_STATUS_STYLES[status] ?? 'border-border bg-muted text-muted-foreground'
                  )}
                >
                  {status.replace('_', ' ')} {count}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Link
          href="/admin/moderation"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted sm:self-auto"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Moderation queue
        </Link>
      </div>

      {creators.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No creators have submitted to this contest.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {creators.map((creator) => (
            <li key={creator.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/creators/${creator.id}`}
                    className="text-sm font-black text-primary hover:underline"
                  >
                    {creator.name}
                  </Link>
                  <p className="break-all text-[11px] text-muted-foreground">{creator.email}</p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      'font-bold',
                      creator.accountStatus === 'BLOCKED' ? 'text-rose-500' : 'text-emerald-500'
                    )}
                  >
                    {creator.accountStatus === 'BLOCKED' ? 'Blocked' : 'Active'}
                  </span>
                  <p>
                    {creator.submissionCount} {creator.submissionCount === 1 ? 'video' : 'videos'}
                  </p>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {creator.submissions.map((video) => (
                  <SubmissionRow
                    key={video.id}
                    video={video}
                    onWatch={() => setWatching(video)}
                    onDelete={() => {
                      remove.reset();
                      setDeleteTarget(video);
                    }}
                  />
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
