'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  UploadCloud,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { ActiveContestInfo } from '@/types/creator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActiveContestBannerProps {
  contest: ActiveContestInfo;
  onOpenUploadModal: () => void;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(deadlineIso: string): TimeRemaining {
  const total = new Date(deadlineIso).getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, isExpired: false };
}

export function ActiveContestBanner({
  contest,
  onOpenUploadModal,
  className,
}: ActiveContestBannerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(contest.deadline)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(contest.deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [contest.deadline]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 p-5 shadow-xl shadow-primary/5 sm:p-6',
        className
      )}
    >
      {/* Decorative background glow accents */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left info column */}
        <div className="flex-1 space-y-3">
          {/* Header tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Flame className="h-3.5 w-3.5 fill-primary" />
              Active Contest
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              {contest.season}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Trophy className="h-3.5 w-3.5 text-emerald-500" />
              Prize Pool: {contest.prizePool}
            </span>
          </div>

          {/* Title & Tagline */}
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground sm:text-2xl lg:text-3xl">
              {contest.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {contest.tagline}
            </p>
          </div>

          {/* Categories & Requirements */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Categories:</span>
            {contest.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-md border border-border/80 bg-background/60 px-2 py-0.5 text-xs font-medium text-foreground/80"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Rules highlight */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              Format: {contest.aspectRatioRequirement}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              Max: {contest.maxDurationSeconds}s duration
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              {contest.entryCount} creator entries registered
            </span>
          </div>
        </div>

        {/* Right countdown & CTA column */}
        <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:border-t-0 sm:pt-0 lg:flex-col lg:items-end">
          {/* Countdown Clock Box */}
          <div className="flex flex-col items-start sm:items-end">
            <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 animate-pulse text-primary" />
              <span>Submission Window Closes In</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex min-w-[48px] flex-col items-center rounded-lg border border-border bg-background/80 px-2.5 py-1.5 shadow-sm">
                <span className="font-mono text-lg font-black tracking-tight text-foreground">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Days
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">:</span>
              <div className="flex min-w-[48px] flex-col items-center rounded-lg border border-border bg-background/80 px-2.5 py-1.5 shadow-sm">
                <span className="font-mono text-lg font-black tracking-tight text-foreground">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Hrs
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">:</span>
              <div className="flex min-w-[48px] flex-col items-center rounded-lg border border-border bg-background/80 px-2.5 py-1.5 shadow-sm">
                <span className="font-mono text-lg font-black tracking-tight text-foreground">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Min
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">:</span>
              <div className="flex min-w-[48px] flex-col items-center rounded-lg border border-border bg-background/80 px-2.5 py-1.5 shadow-sm">
                <span className="animate-pulse font-mono text-lg font-black tracking-tight text-primary">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Sec
                </span>
              </div>
            </div>
          </div>

          {/* Main Action Button */}
          <Button
            size="lg"
            onClick={onOpenUploadModal}
            className="w-full gap-2 bg-primary font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:bg-primary-hover hover:shadow-primary/40 active:scale-[0.98] sm:w-auto"
          >
            <UploadCloud className="h-5 w-5" />
            <span>Submit Entry to Contest</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
