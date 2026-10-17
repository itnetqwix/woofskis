'use client';

import React from 'react';
import { LeaderboardContestOption, LeaderboardSummary } from '@/features/leaderboard/hooks/use-leaderboard';

interface LeaderboardOverviewProps {
  contests: LeaderboardContestOption[];
  selectedContestId: string;
  summary: LeaderboardSummary | null;
  catalogReady: boolean;
  catalogError: string | null;
  isLoading: boolean;
  onContestSelect: (id: string) => void;
  /** Selector stays above the entries. Summary cards render below them. */
  part?: 'selector' | 'summary';
}

function formatScore(score: number, votes: number): string {
  if (votes <= 0) return '—';
  return score.toFixed(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LeaderboardOverview({
  contests,
  selectedContestId,
  summary,
  catalogReady,
  catalogError,
  isLoading,
  onContestSelect,
  part = 'selector',
}: LeaderboardOverviewProps) {
  const selected = contests.find((contest) => contest.id === selectedContestId) ?? null;

  if (part === 'summary') {
    if (!selected) return null;
    return (
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric label="Eligible submissions" value={isLoading || !summary ? '…' : String(summary.totalEntries)} />
        <Metric label="Participants" value={isLoading || !summary ? '…' : String(summary.totalParticipants)} />
        <Metric
          label="Votes"
          value={isLoading || !summary ? '…' : summary.totalVotes.toLocaleString()}
        />
        <Metric
          label="Leading entry"
          value={
            isLoading || !summary
              ? '…'
              : summary.leading
                ? summary.leading.title
                : 'No approved entries'
          }
          detail={
            summary?.leading
              ? `${formatScore(summary.leading.communityScore, summary.leading.totalVotes)} · ${summary.leading.totalVotes.toLocaleString()} votes`
              : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <label className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Contest
        </span>
        <select
          value={selectedContestId}
          onChange={(event) => onContestSelect(event.target.value)}
          disabled={!catalogReady || contests.length === 0}
          aria-label="Select active contest"
          className="h-9 min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
            {!catalogReady && <option value="">Loading contests…</option>}
            {catalogReady && contests.length === 0 && <option value="">No active contests</option>}
            {contests.map((contest) => {
              const ends = formatDate(contest.endDate);
              const prize = contest.prizeSummary ? ` · ${contest.prizeSummary}` : '';
              const schedule = ends ? ` · ends ${ends}` : '';
              return (
                <option key={contest.id} value={contest.id}>
                  {contest.title}
                  {schedule}
                  {prize}
                </option>
              );
            })}
          </select>
      </label>

      {catalogError && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
          {catalogError}
        </p>
      )}

      {catalogReady && !catalogError && contests.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
          <p className="text-sm font-bold text-foreground">No active contest</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The leaderboard appears when a contest status is ACTIVE.
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-foreground">{value}</p>
      {detail && <p className="truncate text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}
