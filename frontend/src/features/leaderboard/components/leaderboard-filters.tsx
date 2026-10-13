'use client';

import React from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { LeaderboardViewMode, TimeframeFilter } from '@/types/leaderboard';
import { SUBMISSION_CATEGORIES } from '@/constants/mock-creator-data';
import { getStoredContests } from '@/lib/theme-utils';
import { isUuid } from '../lib/leaderboard-flow';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface LeaderboardFiltersProps {
  timeframe?: TimeframeFilter;
  category: string;
  searchQuery: string;
  selectedContestId: string;
  viewMode?: LeaderboardViewMode;
  totalEntriesCount: number;
  onTimeframeChange?: (tf: TimeframeFilter) => void;
  onCategoryChange: (cat: string) => void;
  onSearchChange: (query: string) => void;
  onContestSelect: (id: string) => void;
  onViewModeChange?: (mode: LeaderboardViewMode) => void;
  contestOptions?: Array<{ id: string; title: string }>;
}

export function LeaderboardFilters({
  category,
  searchQuery,
  selectedContestId,
  totalEntriesCount,
  onCategoryChange,
  onSearchChange,
  onContestSelect,
  contestOptions,
}: LeaderboardFiltersProps) {
  const storedContestOptions = React.useMemo(() => {
    const stored = getStoredContests();
    const map = new Map<string, { id: string; title: string }>();
    for (const c of stored) {
      if (isUuid(c.id) && !map.has(c.id)) {
        map.set(c.id, { id: c.id, title: c.title });
      }
    }
    return Array.from(map.values());
  }, []);

  const visibleContests = React.useMemo(() => {
    if (contestOptions && contestOptions.length > 0) return contestOptions;
    return storedContestOptions;
  }, [contestOptions, storedContestOptions]);

  const selectedContest =
    visibleContests.find((c) => c.id === selectedContestId) || visibleContests[0];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Search Box & Category Filter */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search creator, video title, tag..."
            className="shadow-xs h-9 w-full rounded-xl border border-border bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shadow-xs flex h-9 min-w-[140px] items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Select category"
            >
              <span className="truncate">{category === 'ALL' ? 'All Categories' : category}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[300px] w-[180px] overflow-y-auto">
            <DropdownMenuItem
              onClick={() => onCategoryChange('ALL')}
              className="flex cursor-pointer items-center justify-between text-xs font-semibold"
            >
              <span>All Categories</span>
              {category === 'ALL' && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary" />}
            </DropdownMenuItem>
            {SUBMISSION_CATEGORIES.map((cat) => {
              const isSelected = category === cat.name;
              return (
                <DropdownMenuItem
                  key={cat.name}
                  onClick={() => onCategoryChange(cat.name)}
                  className="flex cursor-pointer items-center justify-between text-xs font-semibold"
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="hidden text-xs text-muted-foreground md:inline">
          ({totalEntriesCount} ranked {totalEntriesCount === 1 ? 'entry' : 'entries'})
        </span>
      </div>

      {/* Right: Contest Selector Dropdown */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Contest:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shadow-xs flex h-9 min-w-[200px] max-w-[300px] items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label="Select contest"
            >
              <span className="truncate">{selectedContest?.title || 'Select contest'}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] w-[260px] overflow-y-auto">
            {visibleContests.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No contests available</div>
            )}
            {visibleContests.map((c) => {
              const isSelected = c.id === selectedContestId;
              return (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => onContestSelect(c.id)}
                  className="flex cursor-pointer items-center justify-between text-xs font-semibold"
                >
                  <span className="truncate">{c.title}</span>
                  {isSelected && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
