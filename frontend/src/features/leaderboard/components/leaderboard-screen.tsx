'use client';

import React, { useState } from 'react';
import { LeaderboardFilters } from '@/features/leaderboard/components/leaderboard-filters';
import { LeaderboardOverview } from '@/features/leaderboard/components/leaderboard-overview';
import { LeaderboardTable } from '@/features/leaderboard/components/leaderboard-table';
import { LeaderboardVideoModal } from '@/features/leaderboard/components/leaderboard-video-modal';
import { ContestBanner } from '@/features/leaderboard/components/contest-banner';
import { VotersSheet } from '@/features/leaderboard/components/voters-sheet';
import { CommentsSheet } from '@/features/judging/components/comments-sheet';
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard';

export function LeaderboardScreen() {
  const {
    searchQuery,
    selectedContestId,
    metadata,
    rankedItems,
    previewItem,
    isPreviewOpen,
    totalCount,
    summary,
    isLoading,
    catalogReady,
    error,
    catalogError,
    setSearchQuery,
    setSelectedContestId,
    openPreview,
    closePreview,
    contestOptions,
  } = useLeaderboard();
  const [votersItemId, setVotersItemId] = useState<string | null>(null);
  const [commentsItemId, setCommentsItemId] = useState<string | null>(null);
  const votersItem = rankedItems.find((item) => item.id === votersItemId) ?? null;

  return (
    <div className="space-y-3">
      <LeaderboardOverview
        part="selector"
        contests={contestOptions}
        selectedContestId={selectedContestId}
        summary={summary}
        catalogReady={catalogReady}
        catalogError={catalogError}
        isLoading={isLoading}
        onContestSelect={setSelectedContestId}
      />

      {selectedContestId && (
        <>
          <div className="flex min-w-0 items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-foreground">Leaderboard</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                Approved submissions, highest community score first.
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {summary?.totalEntries ?? 0} eligible
            </span>
          </div>
          <LeaderboardFilters
            searchQuery={searchQuery}
            totalEntriesCount={totalCount}
            onSearchChange={setSearchQuery}
          />
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-destructive">
              {error}
            </div>
          ) : (
            <LeaderboardTable
              items={rankedItems}
              onOpenPreview={openPreview}
              onViewVoters={(item) => setVotersItemId(item.id)}
              onViewComments={(item) => setCommentsItemId(item.id)}
              emptyTitle={searchQuery.trim() ? 'No matching entries' : 'No approved submissions'}
              emptyDetail={
                searchQuery.trim()
                  ? 'Nothing in this contest matches that search. Ranks are unchanged.'
                  : 'Approved videos for this contest will show up here.'
              }
            />
          )}
        </>
      )}

      <LeaderboardOverview
        part="summary"
        contests={contestOptions}
        selectedContestId={selectedContestId}
        summary={summary}
        catalogReady={catalogReady}
        catalogError={catalogError}
        isLoading={isLoading}
        onContestSelect={setSelectedContestId}
      />

      {metadata ? (
        <ContestBanner metadata={metadata} />
      ) : selectedContestId && isLoading ? (
        <div className="rounded-xl border border-border bg-card px-3 py-3 text-xs text-muted-foreground">
          Loading contest…
        </div>
      ) : null}

      <LeaderboardVideoModal
        open={isPreviewOpen}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        item={isPreviewOpen ? previewItem : null}
      />
      <VotersSheet
        open={Boolean(votersItemId)}
        submissionId={votersItemId}
        title={votersItem?.title}
        onOpenChange={(open) => {
          if (!open) setVotersItemId(null);
        }}
      />
      <CommentsSheet
        open={Boolean(commentsItemId)}
        submissionId={commentsItemId}
        onOpenChange={(open) => {
          if (!open) setCommentsItemId(null);
        }}
      />
    </div>
  );
}
