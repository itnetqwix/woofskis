'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Film, Loader2 } from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { mimeTypeFromMediaUrl } from '@/features/submissions/lib/video-constraints';
import {
  deleteAdminSubmission,
  getAdminCreator,
  listAdminCreatorActivity,
  listAdminCreatorContests,
  listAdminCreatorSubmissions,
  setAdminCreatorStatus,
  warnAdminCreator,
  type ApiAdminCreatorProfile,
  type ApiAdminCreatorVideo,
  type ApiCreatorContestParticipation,
  type ApiCreatorStats,
  type ApiPagination,
  creatorDeletionNote,
} from '@/services/admin-creators-api';

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function decrementVideoStats(
  stats: ApiCreatorStats | undefined,
  status: string | undefined,
  votes: number,
  contestRemoved: boolean
): ApiCreatorStats {
  const base: ApiCreatorStats = {
    totalVideos: stats?.totalVideos ?? 0,
    approvedVideos: stats?.approvedVideos ?? 0,
    pendingVideos: stats?.pendingVideos ?? 0,
    rejectedVideos: stats?.rejectedVideos ?? 0,
    flaggedVideos: stats?.flaggedVideos ?? 0,
    underModerationVideos: stats?.underModerationVideos ?? 0,
    contestsParticipated: stats?.contestsParticipated ?? 0,
    totalRatingsReceived: stats?.totalRatingsReceived ?? 0,
    totalComments: stats?.totalComments ?? 0,
  };
  const next: ApiCreatorStats = {
    ...base,
    totalVideos: Math.max(0, base.totalVideos - 1),
    totalRatingsReceived: Math.max(0, base.totalRatingsReceived - (votes || 0)),
  };
  if (status === 'APPROVED') next.approvedVideos = Math.max(0, next.approvedVideos - 1);
  else if (status === 'PENDING_REVIEW') next.pendingVideos = Math.max(0, next.pendingVideos - 1);
  else if (status === 'REJECTED') next.rejectedVideos = Math.max(0, next.rejectedVideos - 1);
  else if (status === 'FLAGGED') next.flaggedVideos = Math.max(0, next.flaggedVideos - 1);
  next.underModerationVideos = next.pendingVideos + next.flaggedVideos;
  if (contestRemoved) {
    next.contestsParticipated = Math.max(0, next.contestsParticipated - 1);
  }
  return next;
}

function actionLabel(action?: string | null): string {
  if (!action || typeof action !== 'string') return '—';
  return action
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function CreatorProfile({ creatorId }: { creatorId: string }) {
  const queryClient = useQueryClient();
  const [watching, setWatching] = useState<ApiAdminCreatorVideo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiAdminCreatorVideo | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);
  const [videoPage, setVideoPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const profileQuery = useQuery({
    queryKey: ['admin-creator', creatorId],
    queryFn: async () => {
      const envelope = await getAdminCreator(creatorId);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Creator could not be loaded');
      }
      return envelope.data;
    },
  });

  const contestsQuery = useQuery({
    queryKey: ['admin-creator-contests', creatorId],
    queryFn: async () => {
      const envelope = await listAdminCreatorContests(creatorId);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Contests could not be loaded');
      }
      return envelope.data;
    },
  });

  const videosQuery = useQuery({
    queryKey: ['admin-creator-videos', creatorId, videoPage],
    queryFn: async () => {
      const envelope = await listAdminCreatorSubmissions(creatorId, { page: videoPage, limit: 20 });
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Videos could not be loaded');
      }
      return envelope.data;
    },
  });

  const activityQuery = useQuery({
    queryKey: ['admin-creator-activity', creatorId, activityPage],
    queryFn: async () => {
      const envelope = await listAdminCreatorActivity(creatorId, { page: activityPage, limit: 20 });
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Activity could not be loaded');
      }
      return envelope.data;
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-creator', creatorId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-creator-contests', creatorId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-creator-videos', creatorId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-creator-activity', creatorId] }),
      queryClient.invalidateQueries({ queryKey: ['admin-creators'] }),
    ]);
  };

  const remove = useMutation({
    mutationFn: async (video: ApiAdminCreatorVideo) => {
      const envelope = await deleteAdminSubmission(video.id);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Video could not be deleted');
      }
      return envelope.data;
    },
    onSuccess: (result, video) => {
      setDeleteTarget(null);
      setWatching((current) => (current?.id === video.id ? null : current));
      setNotice(
        result?.mediaObjectRetained
          ? 'Video removed from Woofskis. The stored media file was not deleted.'
          : 'Video removed.'
      );

      let contestRemoved = false;
      queryClient.setQueryData<{ creatorId: string; contests: ApiCreatorContestParticipation[] }>(
        ['admin-creator-contests', creatorId],
        (current) => {
          if (!current) return current;
          const contests = (current.contests ?? []).flatMap((contest) => {
            const submissions = (contest?.submissions ?? []).filter(
              (item) => item?.id !== video.id
            );
            if (submissions.length === (contest?.submissions ?? []).length) return [contest];
            if (submissions.length === 0) {
              contestRemoved = true;
              return [];
            }
            return [
              {
                ...contest,
                submissions,
                submissionCount: submissions.length,
              },
            ];
          });
          return { ...current, contests };
        }
      );

      queryClient.setQueryData<ApiAdminCreatorProfile>(['admin-creator', creatorId], (current) => {
        if (!current) return current;
        return {
          ...current,
          stats: decrementVideoStats(
            current.stats,
            video.status,
            video.totalVotes ?? 0,
            contestRemoved
          ),
          submissions: (current.submissions ?? []).filter((item) => item?.id !== video.id),
        };
      });

      queryClient.setQueriesData<{ items: ApiAdminCreatorVideo[]; pagination: ApiPagination }>(
        { queryKey: ['admin-creator-videos', creatorId] },
        (current) => {
          if (!current) return current;
          const before = current.items ?? [];
          const items = before.filter((item) => item?.id !== video.id);
          const previousTotal = current.pagination?.totalCount ?? before.length;
          const totalCount = Math.max(0, previousTotal - 1);
          const limit = current.pagination?.limit || 20;
          const totalPages = Math.max(1, Math.ceil(totalCount / limit));
          return {
            ...current,
            items,
            pagination: current.pagination
              ? {
                  ...current.pagination,
                  totalCount,
                  totalPages,
                  currentPage: Math.min(current.pagination.currentPage ?? 1, totalPages),
                  hasNextPage: (current.pagination.currentPage ?? 1) < totalPages,
                  hasPrevPage: (current.pagination.currentPage ?? 1) > 1,
                }
              : current.pagination,
          };
        }
      );

      const pageItems =
        queryClient.getQueryData<{ items: ApiAdminCreatorVideo[] }>([
          'admin-creator-videos',
          creatorId,
          videoPage,
        ])?.items ?? [];
      if (pageItems.length === 0 && videoPage > 1) {
        setVideoPage((current) => Math.max(1, current - 1));
      }
    },
  });

  const warn = useMutation({
    mutationFn: async () => {
      const envelope = await warnAdminCreator(creatorId, reason);
      if (!envelope.success) throw new Error(envelope.message || 'Warning could not be saved');
      return envelope.data;
    },
    onSuccess: async () => {
      setWarnOpen(false);
      setReason('');
      setNotice('Warning saved.');
      await refresh();
    },
  });

  const changeStatus = useMutation({
    mutationFn: async (next: 'ACTIVE' | 'BLOCKED') => {
      const envelope = await setAdminCreatorStatus(creatorId, next);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Status could not be updated');
      }
      return envelope.data;
    },
    onSuccess: async (result) => {
      setStatusOpen(false);
      setNotice(result?.accountStatus === 'BLOCKED' ? 'Creator blocked.' : 'Creator unblocked.');
      await refresh();
    },
  });

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading creator…
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {profileQuery.error instanceof Error
          ? profileQuery.error.message
          : 'Creator could not be loaded'}
      </p>
    );
  }

  const profile = profileQuery.data;
  const creator = profile?.creator;
  const stats = profile?.stats;
  const warnings = profile?.warnings ?? [];
  const blocked = creator?.accountStatus === 'BLOCKED';
  const videos = videosQuery.data?.items ?? [];
  const videoPagination = videosQuery.data?.pagination;
  const contests = contestsQuery.data?.contests ?? [];
  const activity = activityQuery.data?.items ?? [];
  const activityPagination = activityQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <Link href="/admin/creators" className="text-xs font-bold text-primary">
        Back to creators
      </Link>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
              <ProfileAvatar
                name={creator?.name}
                url={creator?.avatarUrl}
                className="h-full w-full text-xs"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-foreground sm:text-2xl">
                {creator?.name ?? '—'}
              </h2>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {creator?.email ?? '—'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span
                  className={
                    blocked
                      ? 'font-bold text-destructive'
                      : creator?.accountStatus === 'ACTIVE'
                        ? 'font-bold text-emerald-600'
                        : 'font-bold text-muted-foreground'
                  }
                >
                  {blocked ? 'Blocked' : creator?.accountStatus === 'ACTIVE' ? 'Active' : '—'}
                </span>
                {' · joined '}
                {formatWhen(creator?.createdAt)}
                {' · last activity '}
                {formatWhen(creator?.lastActivityAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReason('');
                setWarnOpen(true);
              }}
              className="h-10 rounded-xl border border-border px-3 text-xs font-bold"
            >
              Warn
            </button>
            <button
              type="button"
              onClick={() => setStatusOpen(true)}
              className="h-10 rounded-xl border border-destructive/40 px-3 text-xs font-bold text-destructive"
            >
              {blocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      </section>

      {notice ? <p className="text-sm font-semibold text-primary">{notice}</p> : null}
      {remove.isError || warn.isError || changeStatus.isError ? (
        <p className="text-sm font-semibold text-destructive">
          {remove.error instanceof Error
            ? remove.error.message
            : warn.error instanceof Error
              ? warn.error.message
              : changeStatus.error instanceof Error
                ? changeStatus.error.message
                : 'Action failed'}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total videos" value={stats?.totalVideos ?? 0} />
        <Stat label="Approved videos" value={stats?.approvedVideos ?? 0} />
        <Stat label="Pending videos" value={stats?.pendingVideos ?? 0} />
        <Stat label="Rejected videos" value={stats?.rejectedVideos ?? 0} />
        <Stat label="Contests participated" value={stats?.contestsParticipated ?? 0} />
        <Stat label="Ratings received" value={stats?.totalRatingsReceived ?? 0} />
        <Stat label="Comments" value={stats?.totalComments ?? 0} />
        {(stats?.flaggedVideos ?? 0) > 0 ? (
          <Stat label="Flagged videos" value={stats?.flaggedVideos ?? 0} />
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">
          Contests
        </h3>
        {contestsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading contests…</p>
        ) : contestsQuery.isError ? (
          <p className="text-sm text-destructive">
            {contestsQuery.error instanceof Error
              ? contestsQuery.error.message
              : 'Contests could not be loaded'}
          </p>
        ) : (contests ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            This creator has not entered a contest.
          </p>
        ) : (
          <ul className="space-y-3">
            {(contests ?? []).map((contest) => {
              const submissionCount = contest?.submissionCount ?? 0;
              const submissions = contest?.submissions ?? [];
              return (
                <li
                  key={contest?.contestId ?? contest?.title}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black">{contest?.title ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {contest?.status ?? '—'} · {submissionCount}{' '}
                        {submissionCount === 1 ? 'video' : 'videos'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      First {formatWhen(contest?.firstSubmissionAt)}
                      <br />
                      Latest {formatWhen(contest?.latestSubmissionAt)}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {submissions.map((video) => (
                      <li
                        key={video?.id ?? video?.title}
                        className="flex flex-col gap-1 rounded-xl bg-muted/40 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-semibold text-foreground">{video?.title ?? '—'}</span>
                        <span className="text-muted-foreground">
                          {video?.status ?? '—'} · {formatWhen(video?.createdAt)}
                          {creatorDeletionNote(video ?? {}) ? (
                            <span className="mt-1 block font-semibold text-destructive">
                              {creatorDeletionNote(video ?? {})}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">Videos</h3>
        {videosQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading videos…</p>
        ) : videosQuery.isError ? (
          <p className="text-sm text-destructive">
            {videosQuery.error instanceof Error
              ? videosQuery.error.message
              : 'Videos could not be loaded'}
          </p>
        ) : (videos ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            This creator has no videos.
          </p>
        ) : (
          <ul className="space-y-3">
            {(videos ?? []).map((video) => {
              const totalVotes = video?.totalVotes ?? 0;
              return (
                <li
                  key={video?.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card p-3 sm:p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <SubmissionThumbnail
                      title={video?.title}
                      thumbnailUrl={video?.thumbnailUrl}
                      videoUrl={video?.videoUrl}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-foreground">
                          {video?.title ?? '—'}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {video?.contestTitle ?? '—'} · {video?.contestStatus ?? '—'}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {video?.status ?? '—'} · uploaded {formatWhen(video?.createdAt)}
                          {video?.updatedAt ? ` · updated ${formatWhen(video.updatedAt)}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Score {video?.communityScore ?? 0} · {totalVotes}{' '}
                          {totalVotes === 1 ? 'rating' : 'ratings'}
                        </p>
                        {creatorDeletionNote(video ?? {}) ? (
                          <p className="mt-1 text-xs font-semibold text-destructive">
                            {creatorDeletionNote(video ?? {})}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setWatching(video)}
                          disabled={!video?.videoUrl}
                          className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40"
                        >
                          Watch
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(video)}
                          className="h-10 rounded-xl border border-destructive/40 px-3 text-xs font-bold text-destructive"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {videoPagination && (videoPagination.totalPages ?? 0) > 1 ? (
          <Pager
            page={videoPagination.currentPage ?? 1}
            totalPages={videoPagination.totalPages ?? 1}
            hasPrev={Boolean(videoPagination.hasPrevPage)}
            hasNext={Boolean(videoPagination.hasNextPage)}
            onPrev={() => setVideoPage((current) => Math.max(1, current - 1))}
            onNext={() => setVideoPage((current) => current + 1)}
          />
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">
          Warnings
        </h3>
        {(warnings ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            No warnings.
          </p>
        ) : (
          <ul className="space-y-2">
            {(warnings ?? []).map((warning) => (
              <li key={warning?.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm text-foreground">{warning?.reason ?? '—'}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Issued by {warning?.issuedBy?.name ?? 'Admin'} · {formatWhen(warning?.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-muted-foreground">
          Activity
        </h3>
        {activityQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading activity…</p>
        ) : activityQuery.isError ? (
          <p className="text-sm text-destructive">
            {activityQuery.error instanceof Error
              ? activityQuery.error.message
              : 'Activity could not be loaded'}
          </p>
        ) : (activity ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {(activity ?? []).map((item) => {
              const performerName = item?.performedBy?.name;
              const hasRelated = Boolean(item?.relatedContestTitle || item?.relatedSubmissionTitle);
              return (
                <li key={item?.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-bold text-foreground">{actionLabel(item?.action)}</p>
                  {item?.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item?.relatedContestTitle ? `Contest: ${item.relatedContestTitle}` : null}
                    {item?.relatedContestTitle && item?.relatedSubmissionTitle ? ' · ' : null}
                    {item?.relatedSubmissionTitle ? `Video: ${item.relatedSubmissionTitle}` : null}
                    {hasRelated && performerName ? ' · ' : null}
                    {performerName ? `By ${performerName}` : null}
                    {' · '}
                    {formatWhen(item?.createdAt)}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
        {activityPagination && (activityPagination.totalPages ?? 0) > 1 ? (
          <Pager
            page={activityPagination.currentPage ?? 1}
            totalPages={activityPagination.totalPages ?? 1}
            hasPrev={Boolean(activityPagination.hasPrevPage)}
            hasNext={Boolean(activityPagination.hasNextPage)}
            onPrev={() => setActivityPage((current) => Math.max(1, current - 1))}
            onNext={() => setActivityPage((current) => current + 1)}
          />
        ) : null}
      </section>

      {watching?.videoUrl ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close video"
            className="absolute inset-0 bg-black/70"
            onClick={() => setWatching(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-black">
            <video
              key={watching?.id}
              src={mimeTypeFromMediaUrl(watching.videoUrl) ? undefined : watching.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="max-h-[70dvh] w-full rounded-t-2xl bg-black object-contain"
              onLoadedMetadata={(event) => {
                event.currentTarget.muted = false;
                event.currentTarget.volume = 1;
              }}
            >
              {mimeTypeFromMediaUrl(watching.videoUrl) ? (
                <source src={watching.videoUrl} type={mimeTypeFromMediaUrl(watching.videoUrl)} />
              ) : null}
            </video>
            <button
              type="button"
              onClick={() => setWatching(null)}
              className="w-full bg-background py-3 text-xs font-bold text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close delete confirmation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-base font-black">Delete “{deleteTarget.title}”?</h3>
            <p className="text-sm text-muted-foreground">
              This removes {deleteTarget.title} from {deleteTarget?.contestTitle ?? 'the contest'}.
              Ratings and comments on this video are removed. {creator?.name ?? 'Creator'}&apos;s
              account and the contest stay. The stored media file is not deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleteTarget)}
                className="h-10 rounded-xl bg-destructive px-3 text-xs font-bold text-white"
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {warnOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close warning"
            className="absolute inset-0 bg-black/60"
            onClick={() => setWarnOpen(false)}
          />
          <form
            className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              warn.mutate();
            }}
          >
            <h3 className="text-base font-black">Warn {creator?.name ?? 'Creator'}</h3>
            <textarea
              aria-label="Warning reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              rows={4}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm"
              placeholder="Reason for the warning"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWarnOpen(false)}
                className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={warn.isPending || reason.trim().length === 0}
                className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
              >
                Issue warning
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {statusOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close status confirmation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setStatusOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-base font-black">
              {blocked ? 'Unblock' : 'Block'} {creator?.name ?? 'Creator'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {blocked
                ? `${creator?.email ?? 'This creator'} will be able to use creator tools again. Existing videos stay.`
                : `Block ${creator?.name ?? 'Creator'}${creator?.email ? ` (${creator.email})` : ''}? Creator tools will be rejected. Existing videos and contests stay.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusOpen(false)}
                className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate(blocked ? 'ACTIVE' : 'BLOCKED')}
                className="h-10 rounded-xl bg-destructive px-3 text-xs font-bold text-white"
              >
                {blocked ? 'Confirm unblock' : 'Confirm block'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubmissionThumbnail({
  title,
  thumbnailUrl,
  videoUrl,
}: {
  title?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const label = title?.trim() || 'Creator video';
  const imageSrc = thumbnailUrl?.trim() || '';

  useEffect(() => {
    setImageFailed(false);
    setFrameFailed(false);
  }, [imageSrc, videoUrl]);

  const showImage = Boolean(imageSrc) && !imageFailed;
  const showFrame = !showImage && Boolean(videoUrl) && !frameFailed;

  return (
    <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-32 sm:w-24">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={label}
          width={96}
          height={128}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : showFrame ? (
        <video
          src={videoUrl ?? undefined}
          width={96}
          height={128}
          muted
          playsInline
          preload="metadata"
          className="pointer-events-none h-full w-full object-cover"
          onLoadedData={(event) => {
            const element = event.currentTarget;
            if (element.currentTime < 0.1) {
              try {
                element.currentTime = 0.1;
              } catch {
                setFrameFailed(true);
              }
            }
          }}
          onError={() => setFrameFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-primary/25 to-muted px-1 text-center">
          <Film className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="line-clamp-3 text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value ?? 0}</p>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page?: number | null;
  totalPages?: number | null;
  hasPrev?: boolean | null;
  hasNext?: boolean | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page ?? 1} of {totalPages ?? 1}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={onPrev}
          className="h-9 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={onNext}
          className="h-9 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
