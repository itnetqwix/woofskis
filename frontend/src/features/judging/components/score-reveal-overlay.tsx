'use client';

import React from 'react';
import { Award, ArrowRight, TrendingUp, CheckCircle2, Users } from 'lucide-react';
import { AggregatedScoreResult } from '@/types/contest';
import { Button } from '@/components/ui/button';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { BrandRatingGlyph, isRipskisBrand } from '@/features/judging/components/brand-rating-icons';

interface ScoreRevealOverlayProps {
  result: AggregatedScoreResult | null;
  countdownProgress: number; // 100 down to 0
  onNextNow: () => void;
}

export function ScoreRevealOverlay({
  result,
  countdownProgress,
  onNextNow,
}: ScoreRevealOverlayProps) {
  const { activeBrand } = useTenantTheme();
  const isRipskis = isRipskisBrand(activeBrand);
  if (!result) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-xl duration-200 animate-in fade-in zoom-in-95 sm:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/20 bg-black/85 p-5 text-center text-white shadow-2xl backdrop-blur-2xl sm:p-6">
        {/* Ambient Top Glow */}
        <div className="absolute -top-6 -z-10 h-24 w-24 rounded-full bg-primary/30 blur-2xl" />

        {/* Success Icon Pill */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Vote Verified & Recorded</span>
        </div>

        {/* User Vote vs Community Score Header */}
        <div className="mb-4 flex w-full items-center justify-around rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:p-3">
          {/* User Given Score */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">
              Your Rating
            </span>
            <div
              className={
                isRipskis
                  ? 'mt-0.5 flex items-center gap-1 text-lg font-black text-[#8BC144]'
                  : 'mt-0.5 flex items-center gap-1 text-lg font-black text-[#fa4616]'
              }
            >
              <BrandRatingGlyph
                brand={activeBrand?.id}
                filled
                className={isRipskis ? 'h-4 w-4 fill-[#8BC144] text-[#8BC144]' : 'h-4 w-4 fill-[#fa4616] text-[#fa4616]'}
              />
              <span>{result.userRating}.0</span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-white/15" />

          {/* Delta Impact */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/70">
              Impact
            </span>
            <div className="mt-0.5 flex items-center gap-1 text-sm font-bold text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{result.delta >= 0 ? `+${result.delta}` : result.delta} pts</span>
            </div>
          </div>
        </div>

        {/* Aggregated Community Score Callout */}
        <div className="relative mb-4 flex flex-col items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70">
            Updated Consensus Score
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-5xl font-black tracking-tight text-accent drop-shadow-[0_0_24px_rgba(127,196,28,0.4)]">
              {result.newCommunityScore.toFixed(1)}
            </span>
            <span className="text-base font-bold text-white/50">/ 10</span>
          </div>

          <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/75">
            <Users className="h-3.5 w-3.5 text-accent" />
            <span>Across {result.newTotalVotes} verified community votes</span>
          </div>
        </div>

        {/* Auto Progression Bar & Next Action */}
        <div className="mt-2 flex w-full flex-col gap-2">
          {/* Progress countdown bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-accent transition-all duration-75"
              style={{ width: `${countdownProgress}%` }}
            />
          </div>

          {/* Quick Advance Button */}
          <Button
            onClick={onNextNow}
            size="default"
            className="w-full gap-2 bg-primary font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
          >
            <span>Next Entry</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Badge Footer */}
        <div className="mt-3 flex items-center gap-1 text-[10px] text-white/60">
          <Award className="h-3 w-3 text-accent" />
          <span>Woofskis Real-Time Consensus Engine</span>
        </div>
      </div>
    </div>
  );
}
