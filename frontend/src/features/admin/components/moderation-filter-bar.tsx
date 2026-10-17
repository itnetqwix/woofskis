'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { ModerationFilterStatus, ModerationSortOption } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { SUBMISSION_CATEGORIES } from '@/constants/mock-creator-data';

const STATUS_OPTIONS: { id: ModerationFilterStatus; label: string }[] = [
  { id: 'ALL', label: 'All statuses' },
  { id: 'PENDING_REVIEW', label: 'Pending review' },
  { id: 'FLAGGED', label: 'Flagged' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

const SELECT_CLASS =
  'h-9 min-w-0 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:border-primary focus:outline-none';

interface ModerationFilterBarProps {
  filterStatus: ModerationFilterStatus;
  statusCounts: Record<ModerationFilterStatus, number>;
  searchQuery: string;
  categoryFilter: string;
  sortBy: ModerationSortOption;
  onFilterStatusChange: (status: ModerationFilterStatus) => void;
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (category: string) => void;
  onSortByChange: (sort: ModerationSortOption) => void;
}

export function ModerationFilterBar({
  filterStatus,
  statusCounts,
  searchQuery,
  categoryFilter,
  sortBy,
  onFilterStatusChange,
  onSearchChange,
  onCategoryFilterChange,
  onSortByChange,
}: ModerationFilterBarProps) {
  const hasActiveFilters =
    searchQuery.trim() !== '' || filterStatus !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-2 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search creator, title, tag, ID…"
          aria-label="Search submissions"
          className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as ModerationFilterStatus)}
          aria-label="Filter by status"
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label} ({statusCounts[option.id] ?? 0})
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          aria-label="Filter by category"
          className={SELECT_CLASS}
        >
          <option value="ALL">All categories</option>
          {SUBMISSION_CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as ModerationSortOption)}
          aria-label="Sort submissions"
          className={SELECT_CLASS}
        >
          <option value="urgency">Urgency & flags</option>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="creator">Creator name</option>
        </select>
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              onFilterStatusChange('ALL');
              onCategoryFilterChange('ALL');
            }}
            className="col-span-3 h-9 gap-1 text-xs text-muted-foreground md:col-span-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
