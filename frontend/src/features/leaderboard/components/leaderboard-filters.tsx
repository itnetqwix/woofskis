'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface LeaderboardFiltersProps {
  searchQuery: string;
  totalEntriesCount: number;
  onSearchChange: (query: string) => void;
}

export function LeaderboardFilters({
  searchQuery,
  totalEntriesCount,
  onSearchChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search creator or video title"
          aria-label="Search leaderboard"
          className="h-9 w-full rounded-xl border border-border bg-card pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {totalEntriesCount} shown
      </span>
    </div>
  );
}
