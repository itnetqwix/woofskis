'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Trophy,
  Users,
  Video,
  PlayCircle,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Edit,
  Trash2,
  Flame,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ContestConfigItem, ContestLifecycleStatus } from '@/types/tenant';
import { ContestSortOption } from '@/features/admin/hooks/use-contests-management';
import { nextContestStatus } from '@/services/contests-api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ContestBannerThumbnail } from '@/features/contests/components/contest-banner-thumbnail';

function ContestStatusBadge({ status }: { status: ContestLifecycleStatus }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
        <Radio className="h-2.5 w-2.5" /> ACTIVE
      </span>
    );
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-500">
        <Calendar className="h-2.5 w-2.5" /> SCHEDULED
      </span>
    );
  }
  if (status === 'JUDGING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
        JUDGING
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
        COMPLETED
      </span>
    );
  }
  if (status === 'ARCHIVED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
        ARCHIVED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
      {status}
    </span>
  );
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
  onOpenCreateModal: () => void;
  onEditContest: (contest: ContestConfigItem) => void;
  onTransitionStatus: (contestId: string, status: ContestLifecycleStatus) => void;
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
  onOpenCreateModal,
  onEditContest,
  onTransitionStatus,
  onDuplicateContest,
  onDeleteContest,
  onResetDefaults,
  isLoading = false,
}: ContestsManagementTableProps) {
  const statusPills: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Contests' },
    { id: 'DRAFT', label: 'Drafts' },
    { id: 'SCHEDULED', label: 'Scheduled' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'JUDGING', label: 'Judging' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Total Contests */}
        <div className="shadow-xs space-y-1 rounded-2xl border border-border/80 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Contests
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-tight text-foreground">
            {metrics.totalContests}
          </div>
          <p className="text-[11px] text-muted-foreground">In this deployment</p>
        </div>

        {/* Active Live Intake */}
        <div className="shadow-xs space-y-1 rounded-2xl border border-border/80 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Intake
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-tight text-emerald-500">
            {metrics.activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {metrics.judgingCount > 0
              ? `${metrics.judgingCount} in judging`
              : 'Accepting video submissions'}
          </p>
        </div>

        {/* Total Prize Purse */}
        <div className="shadow-xs space-y-1 rounded-2xl border border-border/80 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Prize Pool
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-tight text-amber-500">
            ${metrics.totalPrizePool.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">Committed rewards to creators</p>
        </div>

        {/* Total Ingestion */}
        <div className="shadow-xs space-y-1 rounded-2xl border border-border/80 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Ingestion
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-black tracking-tight text-foreground">
            {metrics.totalEntries.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {metrics.totalVotes.toLocaleString()} community votes cast
          </p>
        </div>
      </div>

      {/* 2. TOOLBAR & FILTER CONTROLS */}
      <div className="shadow-xs flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contests by title, tagline, categories..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Sort + Create */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as ContestSortOption)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="prize_high">Highest Prize Pool</option>
            <option value="entries">Most Entries</option>
            <option value="votes">Most Community Votes</option>
            <option value="deadline">Nearest Deadline</option>
          </select>

          {/* Create Button */}
          <Button
            onClick={onOpenCreateModal}
            className="gap-1.5 bg-primary text-xs font-bold text-white shadow-md shadow-primary/25 hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            <span>Create Contest</span>
          </Button>
        </div>
      </div>

      {/* 3. STATUS FILTER PILLS */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        {statusPills.map((pill) => {
          const isSelected = statusFilter === pill.id;
          const count = statusCounts[pill.id] ?? 0;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onStatusFilterChange(pill.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                isSelected
                  ? 'shadow-xs bg-primary text-primary-foreground'
                  : 'border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              <span>{pill.label}</span>
              <span
                className={cn(
                  'py-0.2 rounded-full px-1.5 font-mono text-[10px]',
                  isSelected
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. CONTESTS DATA GRID / CARDS */}
      {contests.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">
            {isLoading ? 'Loading contests' : 'No contests match your filters'}
          </h3>
          <p className="mx-auto max-w-sm text-xs text-muted-foreground">
            Try adjusting your search query or status filters, or create a contest.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" onClick={onOpenCreateModal} className="gap-1.5 font-bold">
              <Plus className="h-4 w-4" />
              <span>Create Contest</span>
            </Button>
            <Button size="sm" variant="outline" onClick={onResetDefaults}>
              Reload contests
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contests.map((contest) => {
            const nextStatus = nextContestStatus(contest.status);
            const advanceLabel =
              nextStatus === 'SCHEDULED'
                ? 'Schedule'
                : nextStatus === 'ACTIVE'
                  ? 'Activate'
                  : nextStatus === 'JUDGING'
                    ? 'Start judging'
                    : nextStatus === 'COMPLETED'
                      ? 'Complete'
                      : nextStatus === 'ARCHIVED'
                        ? 'Archive'
                        : null;

            return (
              <div
                key={contest.id}
                className="shadow-xs group space-y-4 rounded-2xl border border-border/80 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* TOP ROW: BRAND PILL + STATUS + ACTION DROPDOWN */}
                <div className="flex flex-col justify-between gap-3 border-b border-border/50 pb-3.5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    {/* Contest Banner Thumbnail */}
                    <ContestBannerThumbnail bannerUrl={contest.bannerUrl} title={contest.title} />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-foreground transition-colors group-hover:text-primary">
                          {contest.title}
                        </h3>

                        <ContestStatusBadge status={contest.status} />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {contest.organizationName ? (
                          <span className="font-bold text-foreground">
                            {contest.organizationName}
                          </span>
                        ) : null}
                        {contest.organizationName ? <span>•</span> : null}
                        <span>ID: {contest.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons & Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {nextStatus && advanceLabel && (
                      <Button
                        size="sm"
                        onClick={() => onTransitionStatus(contest.id, nextStatus)}
                        className="h-8 gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>{advanceLabel}</span>
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditContest(contest)}
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>

                    {/* Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                            href={`/admin/contests/${contest.id}/creators`}
                            className="flex items-center gap-2 text-xs font-semibold"
                          >
                            <Users className="h-3.5 w-3.5 text-primary" />
                            <span>Creators</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/creator"
                            className="flex items-center gap-2 text-xs font-semibold"
                          >
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
                </div>

                {/* MIDDLE ROW: TAGLINE + CATEGORIES */}
                <div className="flex flex-col justify-between gap-3 text-xs sm:flex-row sm:items-center">
                  <p className="line-clamp-1 flex-1 text-xs text-muted-foreground">
                    {contest.tagline || contest.description}
                  </p>

                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {contest.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* BOTTOM ROW: TIMELINE & METRICS PILLS */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs sm:grid-cols-4">
                  {/* Prize Pool */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Prize Purse
                      </span>
                      <span className="font-mono text-sm font-black text-amber-500">
                        ${contest.prizePool.total.toLocaleString()} {contest.prizePool.currency}
                      </span>
                    </div>
                    <Trophy className="h-4 w-4 text-amber-500" />
                  </div>

                  {/* Submission Count */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Entries Ingested
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {contest.entriesCount.toLocaleString()}
                      </span>
                    </div>
                    <Video className="h-4 w-4 text-primary" />
                  </div>

                  {/* Community Votes */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Community Votes
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {contest.votesCount.toLocaleString()}
                      </span>
                    </div>
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>

                  {/* Timeline Window */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-2.5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Deadline
                      </span>
                      <span className="block truncate font-mono text-xs font-bold text-foreground">
                        {new Date(contest.deadlineDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
