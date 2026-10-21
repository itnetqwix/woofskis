'use client';

import React, { useState } from 'react';
import { ContestPresentation } from '@/features/contests/components/contest-presentation';
import {
  contestBannerSrc,
  DEFAULT_CONTEST_BANNER_URL,
} from '@/features/contests/lib/contest-banner';
import {
  DEFAULT_CONTEST_TIMEZONE,
  isValidIanaTimeZone,
} from '@/features/contests/lib/contest-schedule';
import { ActiveContestInfo } from '@/types/creator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CreatorContestBoardProps {
  contests: ActiveContestInfo[];
  selectedId: string | null;
  onSelect: (contestId: string) => void;
  onSubmitEntry?: (contestId: string) => void;
}

function formatCardDate(
  iso: string | null | undefined,
  timeZone: string | null | undefined
): string {
  if (!iso) return 'Not set';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not set';
  const zone = timeZone && isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_CONTEST_TIMEZONE;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function statusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
    case 'JUDGING':
      return 'border-primary/30 bg-primary/10 text-primary';
    case 'COMPLETED':
    case 'ARCHIVED':
      return 'border-border bg-muted text-muted-foreground';
    default:
      return 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400';
  }
}

function ContestCardBanner({ bannerUrl, title }: { bannerUrl?: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = contestBannerSrc(bannerUrl);
  const src = failed ? DEFAULT_CONTEST_BANNER_URL : resolved;

  return (
    <div className="relative aspect-[2.4/1] w-full overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        onError={() => {
          if (src !== DEFAULT_CONTEST_BANNER_URL) setFailed(true);
        }}
      />
      <span className="sr-only">{title} banner</span>
    </div>
  );
}

function ContestDetailsDialog({
  contest,
  open,
  onOpenChange,
  onSubmitEntry,
}: {
  contest: ActiveContestInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitEntry?: (contestId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,52rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:p-6 [&>button]:z-10 [&>button]:rounded-full [&>button]:bg-background/90 [&>button]:opacity-100">
        {contest ? (
          <div className="space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle>{contest.title}</DialogTitle>
              <DialogDescription>
                {contest.tagline || 'Contest details, schedule, and submission requirements.'}
              </DialogDescription>
            </DialogHeader>
            <ContestPresentation
              contest={{
                id: contest.id,
                title: contest.title,
                description: contest.description,
                tagline: contest.tagline,
                status: contest.status,
                bannerUrl: contest.bannerUrl || contest.thumbnailUrl,
                submissionOpenAt: contest.startDate,
                submissionDeadlineAt: contest.deadline,
                votingClosesAt: contest.votingClosesAt,
                timezone: contest.timezone,
                categoryName: contest.categories[0],
                prizeSummary: contest.prizeSummary,
              }}
            />
            <article className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground">Submission requirements</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Formats: {contest.allowedFormats.join(', ')}</li>
                  <li>Duration: 1–{contest.maxDurationSeconds} seconds</li>
                  <li>Maximum file size: {contest.maxFileSizeMb}MB</li>
                  <li>Uploads are accepted only while the contest status is ACTIVE.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground">Rules</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {contest.rulesSummary || 'Rules unavailable'}
                </p>
              </div>
              {contest.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contest.categories.map((category) => (
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
            {contest.status === 'ACTIVE' && onSubmitEntry ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onSubmitEntry(contest.id);
                  }}
                >
                  Submit entry
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <DialogHeader className="sr-only">
            <DialogTitle>Contest details</DialogTitle>
            <DialogDescription>No contest is selected.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreatorContestBoard({
  contests,
  selectedId,
  onSelect,
  onSubmitEntry,
}: CreatorContestBoardProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openContest = contests.find((contest) => contest.id === openId) ?? null;

  return (
    <section className="space-y-4" aria-label="Creator contests">
      <p className="text-xs text-muted-foreground sm:text-sm">
        Every contest in this deployment is listed here, including contests that were just created.
      </p>

      {contests.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card px-5 py-6 text-sm text-muted-foreground">
          No contests are available yet.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contests.map((contest) => {
            const selected = contest.id === selectedId;
            return (
              <li key={contest.id}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-pressed={selected}
                  onClick={() => {
                    onSelect(contest.id);
                    setOpenId(contest.id);
                  }}
                  className={cn(
                    'group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all duration-200',
                    'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                    selected ? 'border-primary/50 ring-2 ring-primary/30' : 'border-border/80'
                  )}
                >
                  <ContestCardBanner
                    bannerUrl={contest.bannerUrl || contest.thumbnailUrl}
                    title={contest.title}
                  />
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-bold text-foreground">
                        {contest.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          statusClass(contest.status)
                        )}
                      >
                        {contest.status}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      <p className="truncate">
                        Opens {formatCardDate(contest.startDate, contest.timezone)}
                      </p>
                      <p className="truncate">
                        Deadline {formatCardDate(contest.deadline, contest.timezone)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ContestDetailsDialog
        contest={openContest}
        open={openContest !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        onSubmitEntry={onSubmitEntry}
      />
    </section>
  );
}
