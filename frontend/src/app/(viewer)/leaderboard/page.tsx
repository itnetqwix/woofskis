'use client';

import React, { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcherHUD } from '@/components/layout/tenant-switcher-hud';
import { ContestBanner } from '@/features/leaderboard/components/contest-banner';
import { LeaderboardFilters } from '@/features/leaderboard/components/leaderboard-filters';
import { LeaderboardTable } from '@/features/leaderboard/components/leaderboard-table';
import { LeaderboardVideoModal } from '@/features/leaderboard/components/leaderboard-video-modal';
import { VotersSheet } from '@/features/leaderboard/components/voters-sheet';
import { CommentsSheet } from '@/features/judging/components/comments-sheet';
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard';

export default function LeaderboardPage() {
  const {
    category,
    searchQuery,
    selectedContestId,
    metadata,
    rankedItems,
    previewItem,
    isPreviewOpen,
    totalCount,
    isLoading,
    error,
    setCategory,
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
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* GLOBAL APPLICATION HEADER */}
      <AppHeader />

      {/* FLOATING TENANT SWITCHER HUD */}
      <TenantSwitcherHUD />

      {/* MAIN CONTAINER */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* CONTEST HERO SECTION */}
        <section>
          {metadata ? (
            <ContestBanner metadata={metadata} />
          ) : (
            <div className="rounded-3xl border border-border/80 bg-card px-5 py-8 text-sm text-muted-foreground">
              {isLoading
                ? 'Loading contest…'
                : error || 'No active contest is available for the public leaderboard.'}
            </div>
          )}
        </section>

        {/* MULTI-DIMENSIONAL FILTERS & SEARCH */}
        <section className="space-y-4">
          <LeaderboardFilters
            category={category}
            searchQuery={searchQuery}
            selectedContestId={selectedContestId}
            totalEntriesCount={totalCount}
            onCategoryChange={setCategory}
            onSearchChange={setSearchQuery}
            onContestSelect={setSelectedContestId}
            contestOptions={contestOptions.length > 0 ? contestOptions : undefined}
          />
        </section>

        {/* ALL COMPETITION RANKINGS DATA GRID */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Leaderboard
              </h2>
              <p className="text-xs text-muted-foreground">
                Approved videos in this contest, highest community score first. Score is the 1–10
                average.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              Loading scoreboard…
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
            />
          )}
        </section>
      </main>

      {/* 9:16 VERTICAL VIDEO PREVIEW MODAL */}
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
