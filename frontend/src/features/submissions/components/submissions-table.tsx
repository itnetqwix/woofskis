'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Play,
  RotateCcw,
  Trash2,
  ExternalLink,
  Eye,
  AlertCircle,
  Star,
  Trophy,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Plus,
  ArrowUpDown,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { CreatorSubmissionItem, SubmissionFilterStatus } from '@/types/creator';
import { SUBMISSION_CATEGORIES } from '@/constants/mock-creator-data';
import { SubmissionStatusBadge } from '@/features/submissions/components/submission-status-badge';
import { VideoThumbnailCard } from '@/components/common/video-thumbnail-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SortOption } from '@/features/submissions/hooks/use-creator-submissions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SubmissionsTableProps {
  submissions: CreatorSubmissionItem[];
  filterStatus: SubmissionFilterStatus;
  statusCounts: Record<SubmissionFilterStatus, number>;
  searchQuery: string;
  categoryFilter: string;
  sortBy: SortOption;
  onFilterStatusChange: (status: SubmissionFilterStatus) => void;
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (cat: string) => void;
  onSortByChange: (sort: SortOption) => void;
  onPreview: (submission: CreatorSubmissionItem) => void;
  onResubmit: (submission: CreatorSubmissionItem) => void;
  onDelete: (submission: CreatorSubmissionItem) => void;
  onOpenUploadModal: () => void;
  onResetMockData: () => void;
}

export function SubmissionsTable({
  submissions,
  filterStatus,
  statusCounts,
  searchQuery,
  categoryFilter,
  sortBy,
  onFilterStatusChange,
  onSearchChange,
  onCategoryFilterChange,
  onSortByChange,
  onPreview,
  onResubmit,
  onDelete,
  onOpenUploadModal,
  onResetMockData,
}: SubmissionsTableProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedRejections, setExpandedRejections] = useState<Record<string, boolean>>({});

  const toggleExpandRejection = (id: string) => {
    setExpandedRejections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filterTabs: { id: SubmissionFilterStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Submissions', count: statusCounts.ALL },
    { id: 'APPROVED', label: 'Approved (Live)', count: statusCounts.APPROVED },
    { id: 'PENDING_REVIEW', label: 'Pending Review', count: statusCounts.PENDING_REVIEW },
    { id: 'REJECTED', label: 'Action Required', count: statusCounts.REJECTED },
  ];

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS & TABS BAR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex w-fit flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-muted/60 p-1">
          {filterTabs.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterStatusChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'border border-border/80 bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'py-0.2 rounded-full px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle & Reload */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'rounded-md p-1.5 text-xs transition-colors',
                viewMode === 'table'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Table view"
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-1.5 text-xs transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Grid cards view"
              aria-label="Grid cards view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onResetMockData}
            className="h-8 border-border/80 text-xs text-muted-foreground hover:text-foreground"
            title="Reload submissions from the API"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Reload
          </Button>
        </div>
      </div>

      {/* SEARCH, CATEGORY & SORT BAR */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entries by title, tag (#VFX, #Comedy)..."
            className="w-full rounded-xl border border-input bg-card py-1.5 pl-9 pr-4 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter & Sort Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {SUBMISSION_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Newest First</option>
            <option value="score">Highest Score</option>
            <option value="votes">Most Votes</option>
          </select>
        </div>
      </div>

      {/* SUBMISSIONS LIST CONTENT */}
      {submissions.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Submissions Found</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || categoryFilter !== 'ALL' || filterStatus !== 'ALL'
              ? 'No entries match your current search and filter criteria. Try resetting filters.'
              : 'You have not submitted any video entries yet. Upload your first short to enter the contest!'}
          </p>
          <div className="mt-5 flex items-center gap-3">
            {searchQuery || categoryFilter !== 'ALL' || filterStatus !== 'ALL' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFilterStatusChange('ALL');
                  onCategoryFilterChange('ALL');
                  onSearchChange('');
                }}
                className="text-xs"
              >
                Clear All Filters
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={onOpenUploadModal}
              className="gap-1.5 bg-primary text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit New Entry
            </Button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="min-w-[240px] px-4 py-3">
                    Video Entry
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Submitted
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Community Score
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {submissions.map((item) => {
                  const isRejected = item.status === 'REJECTED';
                  const isExpanded = expandedRejections[item.id];

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="group transition-colors hover:bg-muted/30">
                        {/* Thumbnail & Title */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* 9:16 Miniature Thumbnail Preview */}
                            <VideoThumbnailCard
                              videoUrl={item.videoUrl}
                              thumbnailUrl={item.thumbnailUrl}
                              title={item.title}
                              durationSeconds={item.durationSeconds}
                              onClick={() => onPreview(item)}
                              className="h-16 w-11"
                            />

                            {/* Title & Excerpt */}
                            <div className="min-w-0 space-y-0.5">
                              <button
                                type="button"
                                onClick={() => onPreview(item)}
                                className="line-clamp-1 block text-left font-bold text-foreground transition-colors hover:text-primary"
                              >
                                {item.title}
                              </button>
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                {item.description || item.contestName}
                              </p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.tags.slice(0, 2).map((t) => (
                                    <span
                                      key={t}
                                      className="rounded bg-muted/60 px-1.5 text-[10px] text-muted-foreground"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <span className="text-[9px] text-muted-foreground">
                                      +{item.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground/90">
                            {item.category}
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted-foreground">
                          {new Date(item.submittedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <SubmissionStatusBadge
                              status={item.status}
                              onClick={
                                isRejected ? () => toggleExpandRejection(item.id) : undefined
                              }
                            />
                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => toggleExpandRejection(item.id)}
                                className="text-[10px] text-destructive underline hover:text-destructive/80"
                              >
                                {isExpanded ? 'Hide reason' : 'View moderator feedback'}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Community Score / Votes / Rank */}
                        <td className="whitespace-nowrap px-4 py-3">
                          {item.status === 'APPROVED' && typeof item.communityScore === 'number' ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  {item.communityScore.toFixed(1)}
                                </span>
                                {item.rank && (
                                  <span className="py-0.2 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] font-bold text-emerald-500">
                                    Rank #{item.rank}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {item.totalVotes} evaluator votes
                              </p>
                            </div>
                          ) : item.status === 'PENDING_REVIEW' ? (
                            <span className="flex items-center gap-1 text-[11px] text-amber-500">
                              <Clock className="h-3 w-3 animate-spin" /> In AI Queue
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Actions Menu */}
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPreview(item)}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Preview video"
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Preview
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  aria-label="More actions"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs">
                                <DropdownMenuItem onClick={() => onPreview(item)}>
                                  <Eye className="mr-2 h-3.5 w-3.5" />
                                  <span>View Details & Media</span>
                                </DropdownMenuItem>

                                {item.status === 'APPROVED' && (
                                  <DropdownMenuItem asChild>
                                    <Link href="/">
                                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                      <span>View Live in Judging</span>
                                    </Link>
                                  </DropdownMenuItem>
                                )}

                                {item.status === 'REJECTED' && (
                                  <DropdownMenuItem
                                    onClick={() => onResubmit(item)}
                                    className="font-semibold text-primary"
                                  >
                                    <RotateCcw className="mr-2 h-3.5 w-3.5 text-primary" />
                                    <span>Resubmit Revised Entry</span>
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => onDelete(item)}
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  <span>Delete Submission</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Rejection Reason Alert Row */}
                      {isRejected && isExpanded && (
                        <tr className="border-y border-destructive/20 bg-destructive/5 duration-200 animate-in fade-in">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="flex flex-col items-start justify-between gap-3 text-xs sm:flex-row sm:items-center">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-destructive">
                                  <AlertCircle className="h-4 w-4 shrink-0" />
                                  <span>Moderator Rejection Feedback:</span>
                                </div>
                                <p className="max-w-3xl pl-5 text-foreground/90">
                                  {item.rejectionReason ||
                                    'Non-compliant audio stem or format rules violation.'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => onResubmit(item)}
                                className="shrink-0 gap-1.5 bg-destructive text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Resubmit Now
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((item) => {
            const isRejected = item.status === 'REJECTED';

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <VideoThumbnailCard
                      videoUrl={item.videoUrl}
                      thumbnailUrl={item.thumbnailUrl}
                      title={item.title}
                      durationSeconds={item.durationSeconds}
                      onClick={() => onPreview(item)}
                      className="h-24 w-16 rounded-xl"
                    />

                    {/* Meta */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                          {item.category}
                        </span>
                        <SubmissionStatusBadge status={item.status} size="sm" />
                      </div>

                      <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="line-clamp-2 block text-left text-sm font-bold text-foreground transition-colors hover:text-primary"
                      >
                        {item.title}
                      </button>

                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {item.contestName}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Alert Callout if Rejected */}
                  {isRejected && (
                    <div className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-[11px] text-destructive">
                      <p className="flex items-center gap-1 font-semibold">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Action Required:
                      </p>
                      <p className="line-clamp-2 text-foreground/90">{item.rejectionReason}</p>
                    </div>
                  )}

                  {/* Approved Performance Stats */}
                  {item.status === 'APPROVED' && (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                      <div className="flex items-center gap-1 font-bold text-foreground">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.communityScore?.toFixed(1)} / 10</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {item.totalVotes} votes
                      </span>
                      {item.rank && (
                        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">
                          Rank #{item.rank}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.submittedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>

                  <div className="flex items-center gap-1">
                    {isRejected ? (
                      <Button
                        size="sm"
                        onClick={() => onResubmit(item)}
                        className="h-7 gap-1 bg-destructive text-xs text-destructive-foreground hover:bg-destructive/90"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Resubmit
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(item)}
                        className="h-7 text-xs"
                      >
                        Preview
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
