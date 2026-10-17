'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  ChevronRight,
  Inbox,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

interface SummaryCardProps {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  valueClassName?: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  valueClassName,
  active,
  onClick,
  href,
}: SummaryCardProps) {
  const interactive = Boolean(onClick || href);
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className={cn('font-mono text-xl font-black leading-tight', valueClassName)}>
        {value.toLocaleString()}
      </div>
      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
        <span className="truncate">{hint}</span>
        {interactive ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
      </p>
    </>
  );
  const className = cn(
    'block w-full space-y-0.5 rounded-xl border bg-card px-3 py-2.5 text-left',
    active ? 'border-primary bg-primary/10' : 'border-border/80',
    interactive &&
      !active &&
      'transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

const SELECT_CLASS =
  'h-9 min-w-0 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none';

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

  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;
    const timer = setTimeout(() => {
      setSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

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

  const hasActiveFilters = searchInput.trim() !== '' || status !== '' || contestId !== '';

  const filterByStatus = (next: '' | 'ACTIVE' | 'BLOCKED') => {
    setStatus(next);
    setPage(1);
    document
      .getElementById('creator-listing')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatus('');
    setContestId('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="Total Creators"
          value={summary?.totalCreators ?? 0}
          hint="Show all creators"
          icon={<Users className="h-3.5 w-3.5 text-primary" />}
          active={status === ''}
          onClick={() => filterByStatus('')}
        />
        <SummaryCard
          label="Active"
          value={summary?.activeCreators ?? 0}
          valueClassName="text-emerald-500"
          hint="Show active"
          icon={<UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
          active={status === 'ACTIVE'}
          onClick={() => filterByStatus('ACTIVE')}
        />
        <SummaryCard
          label="Blocked"
          value={summary?.blockedCreators ?? 0}
          valueClassName="text-rose-500"
          hint="Show blocked"
          icon={<Ban className="h-3.5 w-3.5 text-rose-500" />}
          active={status === 'BLOCKED'}
          onClick={() => filterByStatus('BLOCKED')}
        />
        <SummaryCard
          label="Videos"
          value={summary?.totalVideos ?? 0}
          hint={`${summary?.approvedVideos ?? 0} approved · ${summary?.rejectedVideos ?? 0} rejected`}
          icon={<Video className="h-3.5 w-3.5 text-blue-500" />}
        />
        <SummaryCard
          label="Under Moderation"
          value={summary?.underModerationVideos ?? 0}
          valueClassName="text-amber-500"
          hint={
            summary && summary.flaggedVideos > 0
              ? `${summary.pendingVideos} pending · ${summary.flaggedVideos} flagged`
              : 'Open moderation queue'
          }
          icon={<Inbox className="h-3.5 w-3.5 text-amber-500" />}
          href="/admin/moderation"
        />
      </div>

      <div
        id="creator-listing"
        className="flex scroll-mt-20 flex-col gap-2 rounded-xl border border-border/80 bg-card p-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search creators"
            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <select
            aria-label="Status filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as '' | 'ACTIVE' | 'BLOCKED');
              setPage(1);
            }}
            className={SELECT_CLASS}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <select
            aria-label="Contest filter"
            value={contestId}
            onChange={(event) => {
              setContestId(event.target.value);
              setPage(1);
            }}
            className={cn(SELECT_CLASS, 'sm:max-w-[14rem]')}
          >
            <option value="">All contests</option>
            {(contestsQuery.data ?? []).map((contest) => (
              <option key={contest.id} value={contest.id}>
                {contest.title}
              </option>
            ))}
          </select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="col-span-2 inline-flex h-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground sm:col-span-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <p className="px-1 text-[11px] text-muted-foreground">
        {query.isFetching && !query.isLoading
          ? 'Updating…'
          : pagination
            ? `Showing ${creators.length} of ${pagination.totalCount} creators`
            : null}
      </p>

      {notice ? <p className="text-xs font-semibold text-primary">{notice}</p> : null}
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
        <div className="space-y-2 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <Users className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">No creators match this view</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="h-8 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-muted"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
            <div className="hidden grid-cols-[minmax(0,1fr)_80px_170px_70px_130px_auto] items-center gap-3 border-b border-border/60 bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
              <span>Creator</span>
              <span>Status</span>
              <span>Videos · Approved / Pending / Rejected</span>
              <span className="text-right">Contests</span>
              <span>Last activity</span>
              <span className="w-[150px] text-right">Actions</span>
            </div>
            <ul className="divide-y divide-border/60">
              {creators.map((creator) => (
                <li
                  key={creator.id}
                  className="grid grid-cols-1 gap-1.5 px-3 py-2.5 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1fr)_80px_170px_70px_130px_auto] lg:items-center lg:gap-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/creators/${creator.id}`}
                        className="block truncate text-sm font-bold text-foreground hover:text-primary"
                      >
                        {creator.name}
                      </Link>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {creator.email}
                        <span className="hidden lg:inline">
                          {' · '}joined {formatDate(creator.createdAt)}
                        </span>
                      </p>
                    </div>
                    <span className="lg:hidden">
                      <StatusBadge status={creator.accountStatus} />
                    </span>
                  </div>

                  <div className="hidden lg:block">
                    <StatusBadge status={creator.accountStatus} />
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] lg:text-xs">
                    <span className="font-bold text-foreground">{creator.totalVideos}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-emerald-500" title="Approved">
                      {creator.approvedVideos}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-amber-500" title="Pending">
                      {creator.pendingVideos}
                      {creator.flaggedVideos > 0 ? (
                        <span
                          className="ml-1 inline-flex items-center gap-0.5 text-warning"
                          title={`${creator.flaggedVideos} flagged`}
                        >
                          <ShieldAlert className="h-3 w-3" />
                          {creator.flaggedVideos}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-rose-500" title="Rejected">
                      {creator.rejectedVideos}
                    </span>
                    <span className="ml-auto text-muted-foreground lg:hidden">
                      {creator.contestsParticipated} contests · active{' '}
                      {formatDate(creator.lastActivityAt)}
                    </span>
                  </div>

                  <div className="hidden text-right font-mono text-xs font-bold lg:block">
                    {creator.contestsParticipated}
                  </div>

                  <div
                    className="hidden text-xs text-muted-foreground lg:block"
                    title={formatWhen(creator.lastActivityAt)}
                  >
                    {formatDate(creator.lastActivityAt)}
                  </div>

                  <div className="lg:w-[150px]">
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
          </div>

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
    <div className="flex items-center gap-1.5 lg:justify-end">
      <Link
        href={`/admin/creators/${creator.id}`}
        className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-border px-2 text-[11px] font-semibold hover:bg-muted lg:flex-none"
      >
        View
      </Link>
      <button
        type="button"
        onClick={onWarn}
        title="Warn creator"
        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-border px-2 text-[11px] font-semibold hover:bg-muted lg:flex-none"
      >
        <ShieldAlert className="h-3.5 w-3.5 text-warning" />
        Warn
      </button>
      <button
        type="button"
        onClick={onStatus}
        title={creator.accountStatus === 'BLOCKED' ? 'Unblock creator' : 'Block creator'}
        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-destructive/40 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 lg:flex-none"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {creator.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
      </button>
    </div>
  );
}
