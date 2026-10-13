'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { listContests } from '@/services/contests-api';
import {
  listAdminCreators,
  setAdminCreatorStatus,
  warnAdminCreator,
  type ApiAdminCreator,
} from '@/services/admin-creators-api';

function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const blocked = status === 'BLOCKED';
  return (
    <span
      className={
        blocked
          ? 'inline-flex rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive'
          : 'inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600'
      }
    >
      {blocked ? 'Blocked' : 'Active'}
    </span>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  );
}

export function CreatorDirectory() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'BLOCKED'>('');
  const [contestId, setContestId] = useState('');
  const [page, setPage] = useState(1);
  const [warnTarget, setWarnTarget] = useState<ApiAdminCreator | null>(null);
  const [reason, setReason] = useState('');
  const [statusTarget, setStatusTarget] = useState<ApiAdminCreator | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const contestsQuery = useQuery({
    queryKey: ['admin-contest-filter'],
    queryFn: async () => {
      const envelope = await listContests();
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Contests could not be loaded');
      }
      return envelope.data;
    },
  });

  const query = useQuery({
    queryKey: ['admin-creators', search, status, contestId, page],
    queryFn: async () => {
      const envelope = await listAdminCreators({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
        contestId: contestId || undefined,
      });
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Creators could not be loaded');
      }
      return envelope.data;
    },
  });

  const warn = useMutation({
    mutationFn: async () => {
      if (!warnTarget) throw new Error('Choose a creator');
      const envelope = await warnAdminCreator(warnTarget.id, reason);
      if (!envelope.success) throw new Error(envelope.message || 'Warning could not be saved');
      return envelope.data;
    },
    onSuccess: async () => {
      setNotice(`Warning saved for ${warnTarget?.name ?? 'creator'}.`);
      setWarnTarget(null);
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    },
  });

  const changeStatus = useMutation({
    mutationFn: async (creator: ApiAdminCreator) => {
      const next = creator.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      const envelope = await setAdminCreatorStatus(creator.id, next);
      if (!envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Status could not be updated');
      }
      return envelope.data;
    },
    onSuccess: async (result) => {
      setStatusTarget(null);
      setNotice(result.accountStatus === 'BLOCKED' ? 'Creator blocked.' : 'Creator unblocked.');
      await queryClient.invalidateQueries({ queryKey: ['admin-creators'] });
    },
  });

  const summary = query.data?.summary;
  const creators = query.data?.creators ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard label="Total creators" value={summary?.totalCreators ?? 0} />
        <SummaryCard label="Active creators" value={summary?.activeCreators ?? 0} />
        <SummaryCard label="Blocked creators" value={summary?.blockedCreators ?? 0} />
        <SummaryCard label="Total videos" value={summary?.totalVideos ?? 0} />
        <SummaryCard label="Approved videos" value={summary?.approvedVideos ?? 0} />
        <SummaryCard
          label="Pending / under moderation"
          value={summary?.underModerationVideos ?? 0}
        />
        <SummaryCard label="Rejected videos" value={summary?.rejectedVideos ?? 0} />
      </div>
      {summary && summary.flaggedVideos > 0 ? (
        <p className="text-xs text-muted-foreground">
          Pending / under moderation includes {summary.pendingVideos} pending review and{' '}
          {summary.flaggedVideos} flagged.
        </p>
      ) : null}

      <form
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Search name or email
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Creator name or email"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </span>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <select
            aria-label="Status filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | 'ACTIVE' | 'BLOCKED');
              setPage(1);
            }}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </label>
        <label className="min-w-[12rem] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Contest
          </span>
          <select
            aria-label="Contest filter"
            value={contestId}
            onChange={(event) => {
              setContestId(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="">All contests</option>
            {(contestsQuery.data ?? []).map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          Search
        </button>
      </form>

      {notice ? <p className="text-sm font-semibold text-primary">{notice}</p> : null}
      {query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : 'Creators could not be loaded'}
        </p>
      ) : null}
      {warn.isError || changeStatus.isError ? (
        <p className="text-sm font-semibold text-destructive">
          {(warn.error ?? changeStatus.error) instanceof Error
            ? (warn.error ?? changeStatus.error)?.message
            : 'Action failed'}
        </p>
      ) : null}

      {query.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading creators…
        </div>
      ) : creators.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center">
          <Users className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No creators match this view.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Creator</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Videos</th>
                  <th className="px-3 py-3 font-semibold">Approved</th>
                  <th className="px-3 py-3 font-semibold">Pending</th>
                  <th className="px-3 py-3 font-semibold">Rejected</th>
                  <th className="px-3 py-3 font-semibold">Contests</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-3 py-3 font-semibold">Last activity</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{creator.name}</p>
                      <p className="break-all text-xs text-muted-foreground">{creator.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={creator.accountStatus} />
                    </td>
                    <td className="px-3 py-3">{creator.totalVideos}</td>
                    <td className="px-3 py-3">{creator.approvedVideos}</td>
                    <td className="px-3 py-3">
                      {creator.pendingVideos}
                      {creator.flaggedVideos > 0 ? (
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {creator.flaggedVideos} flagged
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">{creator.rejectedVideos}</td>
                    <td className="px-3 py-3">{creator.contestsParticipated}</td>
                    <td className="px-3 py-3 text-xs">{formatWhen(creator.createdAt)}</td>
                    <td className="px-3 py-3 text-xs">{formatWhen(creator.lastActivityAt)}</td>
                    <td className="px-4 py-3">
                      <CreatorActions
                        creator={creator}
                        onWarn={() => {
                          setReason('');
                          setWarnTarget(creator);
                        }}
                        onStatus={() => setStatusTarget(creator)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {creators.map((creator) => (
              <li key={creator.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-foreground">{creator.name}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{creator.email}</p>
                  </div>
                  <StatusBadge status={creator.accountStatus} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Videos</dt>
                    <dd className="font-semibold">{creator.totalVideos}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Approved</dt>
                    <dd className="font-semibold">{creator.approvedVideos}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pending</dt>
                    <dd className="font-semibold">
                      {creator.pendingVideos}
                      {creator.flaggedVideos > 0 ? ` · ${creator.flaggedVideos} flagged` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rejected</dt>
                    <dd className="font-semibold">{creator.rejectedVideos}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contests</dt>
                    <dd className="font-semibold">{creator.contestsParticipated}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Joined</dt>
                    <dd className="font-semibold">{formatWhen(creator.createdAt)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">
                  Last activity {formatWhen(creator.lastActivityAt)}
                </p>
                <div className="mt-3">
                  <CreatorActions
                    creator={creator}
                    onWarn={() => {
                      setReason('');
                      setWarnTarget(creator);
                    }}
                    onStatus={() => setStatusTarget(creator)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
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

      {warnTarget ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close warning"
            className="absolute inset-0 bg-black/60"
            onClick={() => setWarnTarget(null)}
          />
          <form
            className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={(event) => {
              event.preventDefault();
              warn.mutate();
            }}
          >
            <h3 className="text-base font-black">Warn {warnTarget.name}</h3>
            <p className="text-xs text-muted-foreground">
              This stores an administrative record. It does not block the account.
            </p>
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
                onClick={() => setWarnTarget(null)}
                className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={warn.isPending || reason.trim().length === 0}
                className="h-10 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                Issue warning
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {statusTarget ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close status confirmation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setStatusTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-base font-black">
              {statusTarget.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'} {statusTarget.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusTarget.accountStatus === 'BLOCKED'
                ? `${statusTarget.email} will be able to use creator tools again. Existing videos stay as they are.`
                : `Block ${statusTarget.name} (${statusTarget.email})? They will not be able to upload or use creator tools. Existing videos and contests stay.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate(statusTarget)}
                className="h-10 rounded-xl bg-destructive px-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {statusTarget.accountStatus === 'BLOCKED' ? 'Confirm unblock' : 'Confirm block'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreatorActions({
  creator,
  onWarn,
  onStatus,
}: {
  creator: ApiAdminCreator;
  onWarn: () => void;
  onStatus: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/creators/${creator.id}`}
        className="inline-flex h-9 items-center rounded-lg border border-border px-2.5 text-xs font-bold"
      >
        View profile
      </Link>
      <button
        type="button"
        onClick={onWarn}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-bold"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        Warn
      </button>
      <button
        type="button"
        onClick={onStatus}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-destructive/40 px-2.5 text-xs font-bold text-destructive"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {creator.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
      </button>
    </div>
  );
}
