'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  Calendar,
  Trophy,
  Users,
  Video,
  PlayCircle,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Radio,
  ChevronRight,
  X,
  Clock,
} from 'lucide-react';
import { ContestConfigItem, ContestLifecycleStatus } from '@/types/tenant';
import { ContestSortOption } from '@/features/admin/hooks/use-contests-management';
import { nextContestStatus, type ApiContestStatus } from '@/services/contests-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ContestBannerThumbnail } from '@/features/contests/components/contest-banner-thumbnail';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-500',
  SCHEDULED: 'border-blue-500/30 bg-blue-500/15 text-blue-500',
  JUDGING: 'border-primary/30 bg-primary/10 text-primary',
  COMPLETED: 'border-amber-500/30 bg-amber-500/15 text-amber-500',
  DELETED: 'border-destructive/30 bg-destructive/15 text-destructive',
};

function ContestStatusBadge({ status }: { status: ContestLifecycleStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
        STATUS_STYLES[status] ?? 'border-border bg-muted text-muted-foreground'
      )}
    >
      {status === 'ACTIVE' ? <Radio className="h-2.5 w-2.5" /> : null}
      {status}
    </span>
  );
}

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All statuses' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'JUDGING', label: 'Judging' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

const ADVANCE_LABELS: Partial<Record<ContestLifecycleStatus | ApiContestStatus, string>> = {
  SCHEDULED: 'Schedule',
  ACTIVE: 'Activate',
  JUDGING: 'Move to Judging',
  COMPLETED: 'Complete',
  ARCHIVED: 'Archive',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: React.ReactNode;
  valueClassName?: string;
  onClick?: () => void;
  href?: string;
}

function KpiCard({ label, value, hint, icon, valueClassName, onClick, href }: KpiCardProps) {
  const interactive = Boolean(onClick || href);
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className={cn('font-mono text-xl font-black leading-tight', valueClassName)}>{value}</div>
      <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
        <span className="truncate">{hint}</span>
        {interactive ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : null}
      </p>
    </>
  );
  const className = cn(
    'block w-full space-y-0.5 rounded-xl border border-border/80 bg-card px-3 py-2.5 text-left',
    interactive &&
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
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}

interface ContestsManagementTableProps {
  contests: ContestConfigItem[];
  searchQuery: string;
  statusFilter: string;
  sortBy: ContestSortOption;
  statusCounts: Record<string, number>;
  metrics: {
    totalContests: number;
    activeCount: number;
    scheduledCount: number;
    draftCount: number;
    judgingCount: number;
    completedCount: number;
    archivedCount: number;
    totalPrizePool: number;
    totalEntries: number;
    totalVotes: number;
  };
  isLoading?: boolean;
  onSearchChange: (q: string) => void;
  onStatusFilterChange: (s: string) => void;
  onSortByChange: (s: ContestSortOption) => void;
  onEditContest: (contest: ContestConfigItem) => void;
  onTransitionStatus: (contestId: string, status: ContestLifecycleStatus) => void | Promise<any>;
  onScheduleJudging?: (contestId: string, taglineConfirmation: string) => Promise<{ ok: boolean; message?: string } | any>;
  onDuplicateContest: (contestId: string) => void;
  onDeleteContest: (contestId: string) => void;
  onResetDefaults: () => void;
}

export function ContestsManagementTable({
  contests,
  searchQuery,
  statusFilter,
  sortBy,
  statusCounts,
  metrics,
  onSearchChange,
  onStatusFilterChange,
  onSortByChange,
  onEditContest,
  onTransitionStatus,
  onScheduleJudging,
  onDuplicateContest,
  onDeleteContest,
  onResetDefaults,
  isLoading = false,
}: ContestsManagementTableProps) {
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL';

  // Activation modal state
  const [activatingContest, setActivatingContest] = useState<ContestConfigItem | null>(null);
  const [activationInput, setActivationInput] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Judging modal state
  const [judgingContest, setJudgingContest] = useState<ContestConfigItem | null>(null);
  const [taglineInput, setTaglineInput] = useState('');
  const [judgingError, setJudgingError] = useState<string | null>(null);
  const [isSchedulingJudging, setIsSchedulingJudging] = useState(false);

  const handleOpenActivate = (contest: ContestConfigItem) => {
    setActivatingContest(contest);
    setActivationInput('');
    setActivationError(null);
  };

  const handleConfirmActivate = async () => {
    if (!activatingContest) return;
    if (activationInput.trim() !== 'ACTIVATE') {
      setActivationError('You must type ACTIVATE exactly to confirm.');
      return;
    }
    setIsActivating(true);
    setActivationError(null);
    try {
      const res = await onTransitionStatus(activatingContest.id, 'ACTIVE');
      if (res && res.ok === false) {
        setActivationError(res.message || 'Failed to activate contest.');
        return;
      }
      setActivatingContest(null);
      setActivationInput('');
    } catch (err: any) {
      setActivationError(err.message || 'Failed to activate contest.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleOpenScheduleJudging = (contest: ContestConfigItem) => {
    setJudgingContest(contest);
    setTaglineInput('');
    setJudgingError(null);
  };

  const expectedTagline = (judgingContest?.tagline ?? '').trim();
  const taglineMatches = taglineInput.trim() === expectedTagline;

  const handleConfirmScheduleJudging = async () => {
    if (!judgingContest) return;
    if (!taglineMatches) {
      setJudgingError('The entered tagline does not match the contest tagline.');
      return;
    }
    if (!onScheduleJudging) return;
    setIsSchedulingJudging(true);
    setJudgingError(null);
    try {
      const res = await onScheduleJudging(judgingContest.id, taglineInput);
      if (res && res.ok === false) {
        setJudgingError(res.message || 'Failed to schedule judging transition.');
        return;
      }
      setJudgingContest(null);
      setTaglineInput('');
    } catch (err: any) {
      setJudgingError(err.message || 'Failed to schedule judging transition.');
    } finally {
      setIsSchedulingJudging(false);
    }
  };

  const showListing = (status: string) => {
    onStatusFilterChange(status);
    document.getElementById('contest-listing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('ALL');
  };

  return (
    <div className="space-y-4">
      {/* KPI SUMMARY */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <KpiCard
          label="Total Contests"
          value={metrics.totalContests}
          hint="View all contests"
          icon={<Layers className="h-3.5 w-3.5 text-primary" />}
          onClick={() => showListing('ALL')}
        />
        <KpiCard
          label="Active Intake"
          value={metrics.activeCount}
          valueClassName="text-emerald-500"
          hint={
            metrics.judgingCount > 0
              ? `${metrics.judgingCount} in judging`
              : 'Accepting submissions'
          }
          icon={<Radio className="h-3.5 w-3.5 text-emerald-500" />}
          onClick={() => showListing('ACTIVE')}
        />
        <KpiCard
          label="Total Prize Pool"
          value={`$${metrics.totalPrizePool.toLocaleString()}`}
          valueClassName="text-amber-500"
          hint="Committed rewards"
          icon={<Trophy className="h-3.5 w-3.5 text-amber-500" />}
        />
        <KpiCard
          label="Total Submissions"
          value={metrics.totalEntries.toLocaleString()}
          hint={`${metrics.totalVotes.toLocaleString()} votes · Moderate`}
          icon={<Video className="h-3.5 w-3.5 text-blue-500" />}
          href="/admin/moderation"
        />
      </div>

      {/* SEARCH + FILTERS */}
      <div
        id="contest-listing"
        className="flex scroll-mt-20 flex-col gap-2 rounded-xl border border-border/80 bg-card p-2 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, tagline, category…"
            aria-label="Search contests"
            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({statusCounts[option.id] ?? 0})
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as ContestSortOption)}
            aria-label="Sort contests"
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="prize_high">Highest prize</option>
            <option value="entries">Most submissions</option>
            <option value="votes">Most votes</option>
            <option value="deadline">Nearest deadline</option>
          </select>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="col-span-2 h-9 gap-1 text-xs text-muted-foreground sm:col-span-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <p className="px-1 text-[11px] text-muted-foreground">
        Showing {contests.length} of {metrics.totalContests} contests
      </p>

      {/* CONTEST LIST */}
      {contests.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">
            {isLoading ? 'Loading contests' : 'No contests match your filters'}
          </h3>
          {!isLoading ? (
            <div className="flex items-center justify-center gap-2 pt-1">
              {hasActiveFilters ? (
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={onResetDefaults}>
                Reload contests
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_170px_90px_100px_auto] items-center gap-3 border-b border-border/60 bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
            <span>Contest</span>
            <span>Status</span>
            <span>Start – Deadline</span>
            <span className="text-right">Submissions</span>
            <span className="text-right">Prize</span>
            <span className="w-[260px] text-right">Actions</span>
          </div>
          <ul className="divide-y divide-border/60">
            {contests.map((contest) => {
              const nextStatus = nextContestStatus(contest.status);
              const advanceLabel = nextStatus ? ADVANCE_LABELS[nextStatus] : undefined;
              const submissionsHref = `/admin/contests/${contest.id}/creators`;

              return (
                <li
                  key={contest.id}
                  className="group grid grid-cols-1 gap-2 px-3 py-2.5 transition-colors hover:bg-muted/20 lg:grid-cols-[minmax(0,1fr)_110px_170px_90px_100px_auto] lg:items-center lg:gap-3"
                >
                  {/* Contest */}
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ContestBannerThumbnail
                      bannerUrl={contest.bannerUrl}
                      title={contest.title}
                      className="h-9 w-14 rounded-lg sm:h-9 sm:w-14"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={submissionsHref}
                          className="truncate text-sm font-bold text-foreground hover:text-primary"
                        >
                          {contest.title}
                        </Link>
                        <span className="lg:hidden">
                          <ContestStatusBadge status={contest.status} />
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {contest.categories.length > 0
                          ? contest.categories.join(' · ')
                          : contest.tagline || contest.description}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="hidden lg:block">
                    <ContestStatusBadge status={contest.status} />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground lg:text-xs">
                    <Calendar className="h-3 w-3 shrink-0 lg:hidden" />
                    <span className="font-mono">
                      {formatDate(contest.startDate)} – {formatDate(contest.deadlineDate)}
                    </span>
                    <span className="ml-auto flex items-center gap-3 font-mono lg:hidden">
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {contest.entriesCount.toLocaleString()}
                      </span>
                      <span className="text-amber-500">
                        ${contest.prizePool.total.toLocaleString()}
                      </span>
                    </span>
                  </div>

                  {/* Submissions */}
                  <div className="hidden text-right font-mono text-xs font-bold text-foreground lg:block">
                    {contest.entriesCount.toLocaleString()}
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      {contest.votesCount.toLocaleString()} votes
                    </span>
                  </div>

                  {/* Prize */}
                  <div className="hidden text-right font-mono text-xs font-bold text-amber-500 lg:block">
                    ${contest.prizePool.total.toLocaleString()}
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      {contest.prizePool.currency}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 lg:w-[260px] lg:justify-end">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 gap-1 px-2 text-[11px] font-semibold lg:flex-none"
                    >
                      <Link href={submissionsHref}>
                        <Video className="h-3.5 w-3.5 text-primary" />
                        Submissions
                      </Link>
                    </Button>
                    {/* DRAFT: Explicit confirmation modal with typed phrase ACTIVATE */}
                    {contest.status === 'DRAFT' ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenActivate(contest)}
                        className="h-7 flex-1 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-500 lg:flex-none"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Activate
                      </Button>
                    ) : null}

                    {/* ACTIVE: Move to Judging schedules 3-day transition, or displays scheduled badge */}
                    {contest.status === 'ACTIVE' ? (
                      contest.scheduledJudgingAt ? (
                        <span
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 text-[11px] font-bold text-amber-500"
                          title={`Scheduled to enter judging on ${new Date(contest.scheduledJudgingAt).toLocaleString()}`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Judging in 3d</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenScheduleJudging(contest)}
                          className="h-7 flex-1 gap-1 border border-amber-500/40 bg-amber-500/15 px-2 text-[11px] font-bold text-amber-500 hover:bg-amber-500/25 lg:flex-none"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Move to Judging
                        </Button>
                      )
                    ) : null}

                    {/* Other statuses: normal lifecycle transition */}
                    {contest.status !== 'DRAFT' && contest.status !== 'ACTIVE' && nextStatus && advanceLabel ? (
                      <Button
                        size="sm"
                        onClick={() => onTransitionStatus(contest.id, nextStatus)}
                        className="h-7 flex-1 gap-1 bg-emerald-600 px-2 text-[11px] font-bold text-white hover:bg-emerald-500 lg:flex-none"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        {advanceLabel}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditContest(contest)}
                      className="h-7 w-7 p-0"
                      title="Edit contest"
                      aria-label={`Edit ${contest.title}`}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          aria-label={`More actions for ${contest.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href="/" className="flex items-center gap-2 text-xs font-semibold">
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            <span>Open in Live Viewer</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={submissionsHref}
                            className="flex items-center gap-2 text-xs font-semibold"
                          >
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Creators & submissions</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/creator" className="flex items-center gap-2 text-xs font-semibold">
                            <Video className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Creator Studio Upload</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDuplicateContest(contest.id)}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Duplicate Contest</span>
                        </DropdownMenuItem>
                        {contest.status === 'ACTIVE' || contest.status === 'JUDGING' ? null : (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `You are about to delete this contest.\n\n${contest.title}`
                                );
                                if (confirmed) onDeleteContest(contest.id);
                              }}
                              className="flex items-center gap-2 text-xs font-semibold text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Contest</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 1. ACTIVATE CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(activatingContest)}
        onOpenChange={(open) => {
          if (!open) {
            setActivatingContest(null);
            setActivationInput('');
            setActivationError(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold sm:text-lg">
              Activate Contest
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              You are about to activate <strong>{activatingContest?.title}</strong>. Once
              activated, the contest will be open for creator submissions and its configuration
              will be locked according to lifecycle rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {activationError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs font-semibold text-destructive">
                {activationError}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Type <span className="font-mono font-bold text-emerald-500">ACTIVATE</span> to confirm:
              </label>
              <input
                type="text"
                value={activationInput}
                onChange={(e) => setActivationInput(e.target.value)}
                placeholder="ACTIVATE"
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setActivatingContest(null);
                setActivationInput('');
                setActivationError(null);
              }}
              disabled={isActivating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={activationInput.trim() !== 'ACTIVATE' || isActivating}
              onClick={handleConfirmActivate}
              className="bg-emerald-600 font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isActivating ? 'Activating…' : 'Confirm Activation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. SCHEDULE JUDGING CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(judgingContest)}
        onOpenChange={(open) => {
          if (!open) {
            setJudgingContest(null);
            setTaglineInput('');
            setJudgingError(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>Move Contest to Judging</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Moving an active contest to judging cannot happen immediately. The contest will
              remain active for <strong>another 3 days</strong> for final creator submissions and
              voting, after which it will transition to JUDGING automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">What happens next:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px]">
                <li>The transition will be scheduled for exactly 3 days from confirmation.</li>
                <li>The tagline will update to: <em>Submissions and voting close in 3 days</em>.</li>
                <li>The original tagline is safely preserved in history.</li>
                <li>At the 3-day mark, intake and voting lock and the contest enters JUDGING.</li>
              </ul>
            </div>

            {judgingError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs font-semibold text-destructive">
                {judgingError}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Type the contest&apos;s exact existing tagline to confirm:
              </label>
              <div className="rounded-md border border-border bg-background p-2 font-mono text-xs text-foreground select-all">
                {judgingContest?.tagline || <span className="italic text-muted-foreground">(No tagline - leave empty)</span>}
              </div>
              <input
                type="text"
                value={taglineInput}
                onChange={(e) => setTaglineInput(e.target.value)}
                placeholder={judgingContest?.tagline || ''}
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setJudgingContest(null);
                setTaglineInput('');
                setJudgingError(null);
              }}
              disabled={isSchedulingJudging}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!taglineMatches || isSchedulingJudging}
              onClick={handleConfirmScheduleJudging}
              className="bg-amber-600 font-bold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {isSchedulingJudging ? 'Scheduling…' : 'Schedule 3-Day Window'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
