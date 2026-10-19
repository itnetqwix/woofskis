'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Film, Play, Star, Users, ChevronRight } from 'lucide-react';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { StarRating } from '@/features/judging/components/star-rating';
import { RATING_MAX } from '@/constants/rating-scale';
import {
  LastRatedVideo,
  formatAverageScore,
  formatVoteCount,
} from '@/features/judging/lib/feed-state';
import { ContestVideoItem } from '@/types/contest';
import { cn } from '@/lib/utils';

const AUTO_HIDE_MS = 5000;

export interface PreviousRatedCardProps {
  result: LastRatedVideo;
  previousVideo?: ContestVideoItem | null;
  isDismissed?: boolean;
  onDismiss?: () => void;
  onSelect?: () => void;
  onHeightChange?: (height: number) => void;
  /** `panel` is the persistent tablet/desktop sidebar card: no auto-hide, no dismiss. */
  variant?: 'overlay' | 'panel';
  className?: string;
}

export function PreviousRatedCard({
  result,
  previousVideo,
  isDismissed = false,
  onDismiss,
  onSelect,
  onHeightChange,
  variant = 'overlay',
  className,
}: PreviousRatedCardProps) {
  const isPanel = variant === 'panel';
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const autoHideRef = useRef({ onDismiss, onHeightChange, isDismissed });
  autoHideRef.current = { onDismiss, onHeightChange, isDismissed };

  useEffect(() => {
    if (isPanel) return;
    let unmountTimer: ReturnType<typeof setTimeout> | undefined;
    const hideTimer = setTimeout(() => {
      const { onDismiss: dismiss, onHeightChange: reportHeight, isDismissed: dismissed } =
        autoHideRef.current;
      if (dismissed) return;
      setIsExiting(true);
      reportHeight?.(0);
      dismiss?.();
      unmountTimer = setTimeout(() => setIsUnmounted(true), 280);
    }, AUTO_HIDE_MS);
    return () => {
      clearTimeout(hideTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDismissed && !isExiting && !isUnmounted) {
      setIsExiting(true);
      onHeightChange?.(0);
      const timer = setTimeout(() => setIsUnmounted(true), 280);
      return () => clearTimeout(timer);
    }
  }, [isDismissed, isExiting, isUnmounted, onHeightChange]);

  useEffect(() => {
    if (isPanel) return;
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
  }, [isExiting, isUnmounted, isPanel, onHeightChange]);

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

  if (isPanel) {
    const creatorName = previousVideo?.creatorName || result.creatorName || null;
    const creatorAvatar = previousVideo?.creatorAvatarUrl || result.creatorAvatarUrl || null;
    const tags = Array.from(
      new Set(
        [previousVideo?.category, ...(previousVideo?.tags ?? [])]
          .map((tag) => tag?.trim())
          .filter((tag): tag is string => Boolean(tag))
      )
    );

    return (
      <div
        className={cn(
          'flex w-full flex-col motion-safe:duration-300 motion-safe:animate-in motion-safe:fade-in',
          className
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Return to ${title}`}
          className="group relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {showThumb ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnail!}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
              <Film className="h-7 w-7 text-white/40" />
            </div>
          )}
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/65 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden="true" />
            {overallScoreValue}/10
          </span>
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition-transform duration-150 group-hover:scale-110">
            <Play className="ml-0.5 h-5 w-5 fill-white" aria-hidden="true" />
          </span>
        </button>

        {creatorName && (
          <div className="mt-3 flex min-w-0 items-center gap-2">
            <ProfileAvatar
              name={creatorName}
              url={creatorAvatar ?? undefined}
              alt={creatorName}
              className="h-7 w-7 shrink-0 rounded-full border border-border object-cover text-[10px] font-bold"
            />
            <span className="truncate text-xs font-semibold text-foreground">{creatorName}</span>
          </div>
        )}

        <p
          className="mt-2 line-clamp-2 text-base font-bold leading-snug text-foreground"
          title={title}
        >
          {title}
        </p>

        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {typeof votes === 'number' && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {formatVoteCount(votes)} {votes === 1 ? 'vote' : 'votes'}
          </p>
        )}

        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Your rating</span>
            <span className="text-sm font-bold text-foreground">
              {formattedUserRating !== null ? formattedUserRating : '—'}
            </span>
          </div>
          <div className="mt-1.5">
            <StarRating
              value={typeof userRating === 'number' ? Math.round(userRating) : null}
              readOnly
              tone="theme"
              size="card"
              scale={RATING_MAX}
              groupLabel="Your rating"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/50 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View details
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      data-interactive="true"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'relative box-border w-full max-w-full overflow-hidden rounded-2xl border-2 border-[#fa4616]',
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
        className="flex w-full cursor-pointer items-stretch gap-3 p-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa4616] active:bg-white/5 sm:p-3"
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
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#fa4616]">
                Previously rated
              </span>
              <span className="text-white/70">
                Your Rating:{' '}
                <span className="font-bold text-[#fa4616]">
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
        className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa4616]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
