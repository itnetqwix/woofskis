'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Tv2,
  Music,
  BadgeCheck,
} from 'lucide-react';
import {
  AdminSubmissionItem,
  ModerationFilterStatus,
  ModerationSortOption,
  RejectionReasonCode,
} from '@/types/admin';
import { Button } from '@/components/ui/button';
import { SUBMISSION_CATEGORIES } from '@/constants/mock-creator-data';
import { cn } from '@/lib/utils';

interface ModerationTableProps {
  submissions: AdminSubmissionItem[];
  filterStatus: ModerationFilterStatus;
  statusCounts: Record<ModerationFilterStatus, number>;
  searchQuery: string;
  categoryFilter: string;
  sortBy: ModerationSortOption;
  selectedBatchIds: string[];
  onFilterStatusChange: (status: ModerationFilterStatus) => void;
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (cat: string) => void;
  onSortByChange: (sort: ModerationSortOption) => void;
  onToggleBatchSelect: (id: string) => void;
  onSelectAllBatch: (ids: string[]) => void;
  onClearBatchSelection: () => void;
  onInspectSubmission: (id: string) => void;
  onApprove: (id: string) => void;
  onRequestReject: (submission: AdminSubmissionItem) => void;
  onToggleFlag: (id: string) => void;
  onBatchApprove: (ids: string[]) => void;
  onRequestBatchReject: (ids: string[]) => void;
}

export function ModerationTable({
  submissions,
  filterStatus,
  statusCounts,
  searchQuery,
  categoryFilter,
  sortBy,
  selectedBatchIds,
  onFilterStatusChange,
  onSearchChange,
  onCategoryFilterChange,
  onSortByChange,
  onToggleBatchSelect,
  onSelectAllBatch,
  onClearBatchSelection,
  onInspectSubmission,
  onApprove,
  onRequestReject,
  onToggleFlag,
  onBatchApprove,
  onRequestBatchReject,
}: ModerationTableProps) {
  const isAllSelected =
    submissions.length > 0 && submissions.every((s) => selectedBatchIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      onClearBatchSelection();
    } else {
      onSelectAllBatch(submissions.map((s) => s.id));
    }
  };

  const filterTabs: { id: ModerationFilterStatus; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Items', count: statusCounts.ALL },
    { id: 'PENDING_REVIEW', label: 'Pending Queue', count: statusCounts.PENDING_REVIEW },
    { id: 'FLAGGED', label: 'Suspicious / Flagged', count: statusCounts.FLAGGED },
    { id: 'APPROVED', label: 'Approved Live', count: statusCounts.APPROVED },
    { id: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
  ];

  return (
    <div className="space-y-4">
      {/* 1. STATUS TABS BAR & FILTERS */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Pills */}
        <div className="flex w-fit flex-wrap items-center gap-1.5 rounded-2xl border border-border/80 bg-muted/60 p-1">
          {filterTabs.map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterStatusChange(tab.id)}
                className={cn(
                  'flex select-none items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'shadow-xs bg-card font-bold text-foreground ring-1 ring-border'
                    : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'py-0.2 rounded-full px-1.5 font-mono text-[10px]',
                    isActive
                      ? 'bg-primary/15 font-bold text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Category & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search creator, title, tag, ID..."
              className="h-9 w-full rounded-xl border border-border bg-card pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {SUBMISSION_CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as ModerationSortOption)}
            className="h-9 rounded-xl border border-border bg-card px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="urgency">Sort by: Urgency & Flags</option>
            <option value="newest">Sort by: Newest First</option>
            <option value="oldest">Sort by: Oldest First</option>
            <option value="creator">Sort by: Creator Name</option>
          </select>
        </div>
      </div>

      {/* 2. BULK ACTION TOOLBAR (Visible when items selected) */}
      {selectedBatchIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 shadow-sm duration-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold text-primary-foreground">
              {selectedBatchIds.length}
            </span>
            <span className="text-xs font-bold text-foreground">
              {selectedBatchIds.length === 1
                ? '1 item selected'
                : `${selectedBatchIds.length} items selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onBatchApprove(selectedBatchIds)}
              className="h-8 gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Approve Selected ({selectedBatchIds.length})</span>
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRequestBatchReject(selectedBatchIds)}
              className="h-8 gap-1.5 text-xs font-bold"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reject Selected ({selectedBatchIds.length})</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearBatchSelection}
              className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Deselect All
            </Button>
          </div>
        </div>
      )}

      {/* 3. DATA GRID TABLE */}
      <div className="shadow-xs overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 p-3.5 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="min-w-[200px] p-3.5">Video & Submission</th>
                <th className="min-w-[160px] p-3.5">Creator</th>
                <th className="min-w-[120px] p-3.5">Category</th>
                <th className="min-w-[130px] p-3.5">Technical Specs</th>
                <th className="min-w-[130px] p-3.5">Review Status</th>
                <th className="min-w-[110px] p-3.5">Submitted</th>
                <th className="min-w-[180px] p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/50" />
                      <span className="font-semibold text-foreground">
                        No Submissions Matching Filter
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Try adjusting search term or resetting category filters.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((item) => {
                  const isSelected = selectedBatchIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'group transition-colors hover:bg-muted/30',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleBatchSelect(item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Video Title & Thumbnail */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onInspectSubmission(item.id)}
                            className="group/thumb relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-black"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform group-hover/thumb:scale-110"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/thumb:opacity-100">
                              <Play className="h-3.5 w-3.5 fill-white text-white" />
                            </div>
                          </button>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => onInspectSubmission(item.id)}
                              className="line-clamp-1 text-left font-bold text-foreground transition-colors hover:text-primary"
                            >
                              {item.title}
                            </button>
                            <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                              <span>{item.id}</span>
                              <span>•</span>
                              <span>{item.durationSeconds}s runtime</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.creatorAvatarUrl}
                              alt={item.creatorName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <span className="truncate">{item.creatorName}</span>
                              {item.creatorVerified && (
                                <BadgeCheck className="h-3 w-3 shrink-0 text-blue-500" />
                              )}
                            </div>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {item.creatorHandle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {item.category}
                        </span>
                      </td>

                      {/* Technical Specs */}
                      <td className="p-3.5">
                        <div className="space-y-0.5 font-mono text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Tv2 className="h-3 w-3" />
                            <span>{item.resolution}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{item.audioBitrate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {item.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                            <Check className="h-3 w-3" /> Approved
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            <X className="h-3 w-3" /> Rejected
                          </span>
                        )}
                        {(item.status === 'FLAGGED' || item.isFlagged) && (
                          <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                            <AlertTriangle className="h-3 w-3" /> Flagged{' '}
                            {item.flagScore ? `(${item.flagScore}%)` : ''}
                          </span>
                        )}
                        {item.status === 'PENDING_REVIEW' && !item.isFlagged && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="p-3.5 text-[11px] text-muted-foreground">
                        {new Date(item.submittedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect In Split View */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onInspectSubmission(item.id)}
                            className="h-7 gap-1 px-2 text-[11px] font-semibold"
                            title="Inspect in Split Mode"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Inspect</span>
                          </Button>

                          {/* Quick Approve */}
                          {item.status !== 'APPROVED' && (
                            <Button
                              size="sm"
                              onClick={() => onApprove(item.id)}
                              className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
                              title="Instant Approve"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Quick Reject */}
                          {item.status !== 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onRequestReject(item)}
                              className="h-7 gap-1 px-2 text-[11px] font-semibold"
                              title="Reject with Reason"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}

                          {/* Flag Toggle */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onToggleFlag(item.id)}
                            className={cn(
                              'h-7 px-2 text-[11px]',
                              item.isFlagged && 'bg-warning/15 text-warning'
                            )}
                            title={item.isFlagged ? 'Clear Flag' : 'Flag Suspicious'}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
