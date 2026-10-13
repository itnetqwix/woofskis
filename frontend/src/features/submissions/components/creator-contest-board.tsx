'use client';

import React from 'react';
import { ActiveContestInfo } from '@/types/creator';
import { cn } from '@/lib/utils';
import { ContestPresentation } from '@/features/contests/components/contest-presentation';

interface CreatorContestBoardProps {
  contests: ActiveContestInfo[];
  selectedId: string | null;
  onSelect: (contestId: string) => void;
}

export function CreatorContestBoard({ contests, selectedId, onSelect }: CreatorContestBoardProps) {
  const selected = contests.find((contest) => contest.id === selectedId) ?? contests[0] ?? null;

  return (
    <section className="space-y-4" aria-label="Creator contests">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Contests</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Every contest in this deployment is listed here, including contests that were just
          created.
        </p>
      </div>

      {contests.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card px-5 py-6 text-sm text-muted-foreground">
          No contests are available yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <ul className="space-y-2">
            {contests.map((contest) => {
              const active = contest.id === selected?.id;
              return (
                <li key={contest.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(contest.id)}
                    className={cn(
                      'flex w-full min-w-0 flex-col gap-1 rounded-xl border px-3 py-3 text-left',
                      active
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <span className="truncate text-sm font-bold text-foreground">
                      {contest.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {contest.tagline || 'No tagline stored'}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {contest.status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected ? (
            <div className="min-w-0 space-y-4">
              <ContestPresentation
                contest={{
                  id: selected.id,
                  title: selected.title,
                  description: selected.description,
                  tagline: selected.tagline,
                  status: selected.status,
                  bannerUrl: selected.bannerUrl || selected.thumbnailUrl,
                  submissionOpenAt: selected.startDate,
                  submissionDeadlineAt: selected.deadline,
                  votingClosesAt: selected.votingClosesAt,
                  timezone: selected.timezone,
                  categoryName: selected.categories[0],
                  prizeSummary: selected.prizeSummary,
                }}
              />
              <article className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Submission requirements</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    <li>Formats: {selected.allowedFormats.join(', ')}</li>
                    <li>Duration: 1–{selected.maxDurationSeconds} seconds</li>
                    <li>Maximum file size: {selected.maxFileSizeMb}MB</li>
                    <li>Uploads are accepted only while the contest status is ACTIVE.</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Rules</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {selected.rulesSummary || 'Rules unavailable'}
                  </p>
                </div>
                {selected.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
