'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Film } from 'lucide-react';
import {
  LastRatedVideo,
  formatAverageScore,
  formatVoteCount,
} from '@/features/judging/lib/feed-state';
import { ContestVideoItem } from '@/types/contest';
import { cn } from '@/lib/utils';

export interface PreviousRatedCardProps {
  result: LastRatedVideo;
  previousVideo?: ContestVideoItem | null;
  isDismissed?: boolean;
  onDismiss?: () => void;
  onSelect?: () => void;
  onHeightChange?: (height: number) => void;
  className?: string;
}

export function PreviousRatedCard({
  result,
  previousVideo,
  isDismissed = false,
  onDismiss,
  onSelect,
  onHeightChange,
  className,
}: PreviousRatedCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (isDismissed && !isExiting && !isUnmounted) {
      setIsExiting(true);
      onHeightChange?.(0);
      const timer = setTimeout(() => setIsUnmounted(true), 280);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, isExiting, isUnmounted, onHeightChange]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || isExiting || isUnmounted) {
      onHeightChange?.(0);
      return;
    }

    const reportHeight = () => {
      if (el && !isExiting && !isUnmounted) {
        const height = el.offsetHeight;
        onHeightChange?.(height);
      }
    };

    reportHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!isExiting && !isUnmounted) {
            onHeightChange?.(entry.target.clientHeight);
          }
        }
      });
      ro.observe(el);
      return () => {
        ro.disconnect();
        onHeightChange?.(0);
      };
    }
  }, [isExiting, isUnmounted, onHeightChange]);

  if (isUnmounted) return null;

  const thumbnail = previousVideo?.thumbnailUrl || result.thumbnailUrl || null;
  const videoUrl =
    previousVideo?.videoUrl || (result as { videoUrl?: string | null }).videoUrl || null;
  const title = previousVideo?.title || result.title || 'Previous video';
  const showThumb = Boolean(thumbnail) && !thumbFailed;
  const showVideoPreview = !showThumb && Boolean(videoUrl) && !videoFailed;
  const votes = result.voteCount ?? previousVideo?.totalVotes;

  // Scale format: / 10
  const userRating = result.userRating ?? previousVideo?.viewerRating ?? null;
  const formattedUserRating =
    typeof userRating === 'number'
      ? `${Number.isInteger(userRating) ? userRating : formatAverageScore(userRating)}/10`
      : null;

  const overallScore = result.averageScore ?? previousVideo?.communityScore ?? 0;
  const overallScoreValue =
    typeof overallScore === 'number'
      ? Number.isInteger(overallScore)
        ? overallScore
        : formatAverageScore(overallScore)
      : overallScore;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    onHeightChange?.(0);
    onDismiss?.();
    setTimeout(() => setIsUnmounted(true), 280);
  };

  return (
    <div
      ref={cardRef}
      data-interactive="true"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative box-border w-full max-w-full overflow-hidden rounded-2xl border-2 border-[#13491e]',
        'bg-gradient-to-r from-black/65 via-black/50 to-black/60 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl',
        'motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
        'motion-reduce:animate-none',
        isExiting && 'pointer-events-none translate-y-2 opacity-0 transition-all duration-300',
        className
      )}
      aria-label="Previously rated video"
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Return to ${title}`}
        className="flex w-full cursor-pointer items-stretch gap-3 p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8BC144] active:bg-white/5 sm:p-3"
      >
        <div className="relative flex min-h-[82px] w-[76px] shrink-0 items-center justify-center self-stretch overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-inner sm:w-[84px]">
          {showThumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnail!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setThumbFailed(true)}
            />
          ) : showVideoPreview ? (
            <video
              src={videoUrl!}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              className="pointer-events-none h-full w-full object-cover"
              onError={() => setVideoFailed(true)}
              aria-hidden="true"
              tabIndex={-1}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 via-black/40 to-black/80"
              data-thumbnail-fallback="poster"
              aria-hidden="true"
            >
              <Film className="h-6 w-6 text-white/40" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-7">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-white" title={title}>
              {title}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8BC144]">
                Previously rated
              </span>
              <span className="text-white/70">
                Your Rating:{' '}
                <span className="font-bold text-[#8BC144]">
                  {formattedUserRating !== null ? formattedUserRating : '—'}
                </span>
              </span>
            </div>
          </div>

          {/* Highlighted Overall Rating Element */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 shadow-sm backdrop-blur-sm sm:px-3 sm:py-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-bold text-white sm:text-sm">Overall Rating</span>
              {typeof votes === 'number' && (
                <span className="text-[10px] font-medium text-white/60 sm:text-[11px]">
                  {formatVoteCount(votes)} {votes === 1 ? 'vote' : 'votes'}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-baseline text-lg font-black tracking-tight text-white sm:text-xl">
              <span>{overallScoreValue}</span>
              <span className="text-white/80">/10</span>
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss previous video recap"
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8BC144]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
