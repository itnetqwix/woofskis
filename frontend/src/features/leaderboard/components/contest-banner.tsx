'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Clock, CheckCircle2 } from 'lucide-react';
import { ContestLeaderboardMetadata } from '@/types/leaderboard';
import { ContestPresentation } from '@/features/contests/components/contest-presentation';

interface ContestBannerProps {
  metadata: ContestLeaderboardMetadata;
}

export function ContestBanner({ metadata }: ContestBannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const deadline = new Date(metadata.deadline).getTime();
      const difference = deadline - Date.now();
      if (Number.isFinite(deadline) && difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [metadata.deadline]);

  const isConcluded = metadata.status === 'CONCLUDED' || metadata.status === 'ARCHIVED';

  return (
    <div className="space-y-3">
      <ContestPresentation
        contest={{
          id: metadata.contestId,
          title: metadata.title,
          description: metadata.description,
          tagline: metadata.tagline,
          status: metadata.status,
          bannerUrl: metadata.bannerUrl,
          submissionOpenAt: metadata.startDate,
          submissionDeadlineAt: metadata.endDate || null,
          votingClosesAt: metadata.votingClosesAt,
          timezone: metadata.timezone,
          categoryName: metadata.season,
          prizeSummary: metadata.totalPrizePool || null,
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-5 py-3 text-xs">
        <div className="flex items-center gap-2">
          {isConcluded ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/30 bg-slate-400/15 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
              <CheckCircle2 className="h-3 w-3 text-slate-400" />
              <span>Contest concluded</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              <Radio className="h-3 w-3 text-emerald-400" />
              <span>Live consensus voting</span>
            </span>
          )}
        </div>
        {!isConcluded && metadata.deadline ? (
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-sans font-normal text-muted-foreground">Closes in:</span>
            <span className="rounded border border-border/80 bg-background px-1.5 py-0.5">
              {timeLeft.days}d
            </span>
            <span className="rounded border border-border/80 bg-background px-1.5 py-0.5">
              {String(timeLeft.hours).padStart(2, '0')}h
            </span>
            <span className="rounded border border-border/80 bg-background px-1.5 py-0.5">
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span className="rounded border border-border/80 bg-background px-1.5 py-0.5 text-primary">
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
