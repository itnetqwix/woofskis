'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { ContestVideoItem, AggregatedScoreResult } from '@/types/contest';
import {
  mediaSlot,
  easedScrollTop,
  FEED_SCROLL_MS,
  preloadForSlot,
  shouldMountMedia,
} from '@/features/judging/lib/feed-state';
import { useNetworkTier } from '@/features/judging/hooks/use-network-tier';
import { VideoSlide } from '@/features/judging/components/video-slide';
import { KeyboardShortcutsModal } from '@/features/judging/components/keyboard-shortcuts-modal';
import { cn } from '@/lib/utils';

export interface VerticalVideoFeedProps {
  videos: ContestVideoItem[];
  currentIndex: number;
  totalVideos: number;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isRevealingScore: boolean;
  aggregatedResult: AggregatedScoreResult | null;
  revealCountdownProgress: number;
  isEmptyFallback: boolean;
  previousCardHeight?: number;
  onPlaybackEnded: () => void;
  onTogglePlayPause: () => void;
  onSetMuted: (muted: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onBufferingChange: (buffering: boolean) => void;
  onPlayStateChange: (playing: boolean) => void;
  onOpenComments: () => void;
  onNext: () => void;
  onGoToVideo: (index: number) => void;
  replayGeneration?: number;
  feedCycle?: number;
}

export function VerticalVideoFeed({
  videos,
  currentIndex,
  totalVideos,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  isBuffering,
  isRevealingScore,
  aggregatedResult,
  revealCountdownProgress,
  isEmptyFallback,
  previousCardHeight,
  onPlaybackEnded,
  onTogglePlayPause,
  onSetMuted,
  onTimeUpdate,
  onDurationChange,
  onBufferingChange,
  onPlayStateChange,
  onOpenComments,
  onNext,
  onGoToVideo,
  replayGeneration = 0,
  feedCycle = 0,
}: VerticalVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const transitionGenRef = useRef(0);
  const networkTier = useNetworkTier();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsModalOpen(true), []);
  const seenCycleRef = useRef(feedCycle);
  if (seenCycleRef.current !== feedCycle) {
    seenCycleRef.current = feedCycle;
    isProgrammaticScrollRef.current = true;
  }

  // A new shuffled cycle reorders the slides. Jump to the start before
  // scroll observation can treat the old position as a user swipe.
  useEffect(() => {
    const container = containerRef.current;
    const targetSlide = slideRefs.current[currentIndex];
    if (!container || !targetSlide) {
      isProgrammaticScrollRef.current = false;
      return;
    }
    isProgrammaticScrollRef.current = true;
    container.style.scrollBehavior = 'auto';
    targetSlide.scrollIntoView({ behavior: 'auto', block: 'start' });
    const timer = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 80);
    return () => window.clearTimeout(timer);
    // currentIndex is read from the render that starts the new cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCycle]);

  // One rAF animation. CSS scroll-behavior stays auto so it cannot start a
  // second smooth scroll. Snap stays off until the exact target is set.
  useEffect(() => {
    const container = containerRef.current;
    const targetSlide = slideRefs.current[currentIndex];
    if (!container || !targetSlide) return;

    const destination = slideOffset(container, targetSlide, currentIndex);
    if (Math.abs(container.scrollTop - destination) <= 2) return;

    const generation = ++transitionGenRef.current;
    const previousSnap = container.style.scrollSnapType;
    const start = container.scrollTop;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    isProgrammaticScrollRef.current = true;
    container.style.scrollSnapType = 'none';
    container.style.scrollBehavior = 'auto';

    const finish = () => {
      if (transitionGenRef.current !== generation) return;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = destination;
      container.style.scrollSnapType = previousSnap || 'y mandatory';
      container.scrollTop = destination;
      frame = window.requestAnimationFrame(() => {
        if (transitionGenRef.current !== generation) return;
        isProgrammaticScrollRef.current = false;
      });
    };

    if (reduced) {
      finish();
    } else {
      const t0 = performance.now();
      const step = (now: number) => {
        if (transitionGenRef.current !== generation) return;
        const progress = Math.min(1, (now - t0) / FEED_SCROLL_MS);
        container.style.scrollBehavior = 'auto';
        container.scrollTop = easedScrollTop(start, destination, progress);
        if (progress < 1) {
          frame = window.requestAnimationFrame(step);
          return;
        }
        finish();
      };
      frame = window.requestAnimationFrame(step);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (transitionGenRef.current === generation) transitionGenRef.current += 1;
      container.style.scrollSnapType = previousSnap || 'y mandatory';
      container.style.scrollBehavior = 'auto';
      isProgrammaticScrollRef.current = false;
    };
  }, [currentIndex]);

  // Track active slide as the user swipes or scrolls
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const containerTop = container.scrollTop;
    const slideHeight = container.clientHeight;
    if (slideHeight <= 0) return;

    const estimatedIndex = Math.round(containerTop / slideHeight);
    if (estimatedIndex >= 0 && estimatedIndex < videos.length && estimatedIndex !== currentIndex) {
      onGoToVideo(estimatedIndex);
    }
  }, [currentIndex, onGoToVideo, videos.length]);

  // Set up IntersectionObserver for precise slide detection on touch mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const indexAttr = entry.target.getAttribute('data-slide-index');
            if (indexAttr !== null) {
              const idx = parseInt(indexAttr, 10);
              if (!isNaN(idx) && idx !== currentIndex) {
                onGoToVideo(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: [0.55, 0.75],
      }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [currentIndex, onGoToVideo, videos.length]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Scroll-Snap Vertical Feed Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          'scroll-snap-y-mandatory no-scrollbar relative flex h-full w-full flex-col overflow-x-hidden overflow-y-scroll',
          'touch-pan-y select-none'
        )}
        style={{
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
        }}
      >
        {videos.map((video, idx) => {
          const isActive = idx === currentIndex;
          const slot = mediaSlot(idx, currentIndex, videos.length);

          return (
            <div
              key={video.id}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              data-slide-index={idx}
              className="scroll-snap-align-start relative flex h-full min-h-full w-full shrink-0 flex-col items-center justify-center p-0"
              style={{
                height: '100%',
                minHeight: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <VideoSlide
                video={video}
                index={idx}
                totalVideos={totalVideos}
                isActive={isActive}
                mountMedia={shouldMountMedia(slot, networkTier)}
                preloadMode={preloadForSlot(slot, networkTier)}
                isPlaying={isActive && isPlaying}
                isMuted={isMuted}
                currentTime={isActive ? currentTime : 0}
                duration={isActive ? duration : video.durationSeconds || 0}
                isBuffering={isActive && isBuffering}
                isRevealingScore={isActive && isRevealingScore}
                aggregatedResult={isActive ? aggregatedResult : null}
                revealCountdownProgress={isActive ? revealCountdownProgress : 100}
                previousCardHeight={previousCardHeight}
                onPlaybackEnded={isActive ? onPlaybackEnded : undefined}
                onTogglePlayPause={onTogglePlayPause}
                onSetMuted={onSetMuted}
                onTimeUpdate={onTimeUpdate}
                onDurationChange={onDurationChange}
                onBufferingChange={onBufferingChange}
                onPlayStateChange={onPlayStateChange}
                onOpenComments={onOpenComments}
                onOpenShortcuts={openShortcuts}
                onNext={onNext}
                replayGeneration={replayGeneration}
                loopVideo={isEmptyFallback}
              />
            </div>
          );
        })}
      </div>
      <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
    </div>
  );
}

function slideOffset(container: HTMLElement, slide: HTMLElement, index: number): number {
  if (index <= 0) return 0;
  if (slide.offsetTop > 0) return slide.offsetTop;
  return index * container.clientHeight;
}
