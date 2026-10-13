'use client';

import React from 'react';
import { Trophy, RotateCcw, BarChart3, Star, CheckCheck, Sparkles, ArrowRight } from 'lucide-react';
import { ContestVideoItem, RatingSubmission } from '@/types/contest';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface QueueCompletedProps {
  videos: ContestVideoItem[];
  userRatings: Record<string, RatingSubmission>;
  onRestart: () => void;
}

export function QueueCompleted({ videos, userRatings, onRestart }: QueueCompletedProps) {
  const ratingsArray = Object.values(userRatings);
  const totalRated = ratingsArray.length;

  const averageRating =
    totalRated > 0
      ? (ratingsArray.reduce((acc, curr) => acc + curr.rating, 0) / totalRated).toFixed(1)
      : 'N/A';

  // Find highest rated video
  let topRatedVideo: ContestVideoItem | null = null;
  let maxRating = 0;

  for (const rating of ratingsArray) {
    if (rating.rating > maxRating) {
      maxRating = rating.rating;
      const found = videos.find((v) => v.id === rating.videoId);
      if (found) topRatedVideo = found;
    }
  }

  return (
    <div className="flex h-full w-full max-w-[440px] select-none flex-col items-center justify-center p-4 text-center duration-300 animate-in fade-in">
      <div className="relative flex w-full flex-col items-center rounded-3xl border border-white/15 bg-black/85 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-black/90">
        {/* Glow ambient decoration */}
        <div className="absolute -top-10 -z-10 h-36 w-36 rounded-full bg-primary/30 blur-3xl" />

        {/* Celebration Trophy Badge */}
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/40 bg-primary text-white shadow-lg shadow-primary/30">
          <Trophy className="h-8 w-8 text-accent" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Judging Queue Complete</span>
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
          All Entries Evaluated!
        </h2>
        <p className="mt-1 max-w-xs text-xs text-white/70">
          You have reviewed all competing showcase submissions. Your scores are permanently weighted
          into the consensus.
        </p>

        {/* Recap Statistics Grid */}
        <div className="my-5 grid w-full grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Total Reviewed
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-black text-white">
              <CheckCheck className="h-4 w-4 text-accent" />
              <span>
                {totalRated} / {videos.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Your Avg Score
            </span>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-black text-accent">
              <Star className="h-4 w-4 fill-accent" />
              <span>{averageRating} ★</span>
            </div>
          </div>
        </div>

        {/* Highlight Top-Rated Pick if available */}
        {topRatedVideo && (
          <div className="mb-5 flex w-full flex-col items-start rounded-2xl border border-primary/30 bg-primary/10 p-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Your Top Pick ({maxRating}.0 ★)
            </span>
            <span className="mt-0.5 line-clamp-1 text-xs font-bold text-white">
              {topRatedVideo.title}
            </span>
            <span className="text-[11px] text-white/70">
              by {topRatedVideo.creatorName} • {topRatedVideo.category}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full flex-col gap-2.5">
          <Button
            onClick={onRestart}
            size="default"
            className="min-h-[44px] w-full gap-2 bg-primary font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Judge Again / Loop Queue</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="default"
            className="min-h-[44px] w-full gap-2 border-white/20 bg-white/5 font-semibold text-white hover:bg-white/10"
          >
            <Link href="/leaderboard">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Explore Contest Leaderboard</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
