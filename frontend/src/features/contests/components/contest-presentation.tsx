'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Trophy } from 'lucide-react';
import {
  contestPresentationFromFields,
  type ContestPresentationData,
} from '@/features/contests/lib/contest-presentation';
import { DEFAULT_CONTEST_BANNER_URL } from '@/features/contests/lib/contest-banner';
import { formatContestInstant } from '@/features/contests/lib/contest-schedule';

interface ContestPresentationProps {
  contest: ContestPresentationData;
}

export function ContestPresentation({ contest }: ContestPresentationProps) {
  const view = contestPresentationFromFields(contest);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shownSrc = failedSrc === view.bannerSrc ? DEFAULT_CONTEST_BANNER_URL : view.bannerSrc;
  const status = view.status || 'DRAFT';

  return (
    <article className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
      <div className="relative h-40 w-full bg-muted sm:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shownSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (shownSrc !== DEFAULT_CONTEST_BANNER_URL) setFailedSrc(view.bannerSrc);
          }}
        />
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
            {status}
          </span>
          {view.categoryName ? (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {view.categoryName}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {view.title}
          </h2>
          {view.tagline ? <p className="text-sm text-muted-foreground">{view.tagline}</p> : null}
        </div>
        {view.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {view.description}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Submission window
            </p>
            <p className="mt-1 text-sm text-foreground">
              Opens {formatContestInstant(view.submissionOpenAt, view.timezone)}
            </p>
            <p className="text-sm text-foreground">
              Deadline {formatContestInstant(view.submissionDeadlineAt, view.timezone)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Voting closure
            </p>
            <p className="mt-1 text-sm text-foreground">
              {view.votingClosesAt
                ? formatContestInstant(view.votingClosesAt, view.timezone)
                : 'Not scheduled'}
            </p>
            {view.prizeSummary ? (
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-foreground">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                {view.prizeSummary}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Times shown in {view.timezone}.</p>
      </div>
    </article>
  );
}
