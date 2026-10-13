'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldX, AlertTriangle, RefreshCw, Clock, Loader2 } from 'lucide-react';
import { useContestQueue } from '@/features/judging/hooks/use-contest-queue';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { VerticalVideoFeed } from '@/features/judging/components/vertical-video-feed';
import { RatingBar } from '@/features/judging/components/rating-bar';
import { PreviousRatedCard } from '@/features/judging/components/previous-rated-card';
import { UnratedEndDialog } from '@/features/judging/components/unrated-end-dialog';
import { StarCelebration } from '@/features/judging/components/star-celebration';
import { ratingToPrefill } from '@/constants/rating-scale';
import {
  readUnratedEndHintHidden,
  writeUnratedEndHintHidden,
} from '@/features/judging/lib/judging-flow';
import { CommentsSheet } from '@/features/judging/components/comments-sheet';
import { QueueCompleted } from '@/features/judging/components/queue-completed';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';

export function ViewerContainer() {
  const { activeBrand } = useTenantTheme();
  const {
    videos,
    currentIndex,
    totalVideos,
    userRatings,
    isCompleted,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    isBuffering,
    isRevealingScore,
    aggregatedResult,
    revealCountdownProgress,
    submitRating,
    returnToLastRated,
    starBurst,
    nextVideo,
    goToVideo,
    skipVideo,
    restartQueue,
    retryQueue,
    previousResult,
    commentsOpen,
    openComments,
    closeComments,
    currentVideo,
    isLoadingQueue,
    queueError,
    ratingError,
    isSubmittingRating,
    isEmptyFallback,
    replayGeneration,
    feedCycle,
    togglePlayPause,
    setMutedState,
    setCurrentTime,
    setDuration,
    setIsBuffering,
    setIsPlaying,
  } = useContestQueue();

  const isSuspended = activeBrand?.status === 'SUSPENDED';
  const ratingRef = useRef<HTMLElement>(null);
  const [endedVideoId, setEndedVideoId] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [ratingAttention, setRatingAttention] = useState(false);
  const [dismissedPreviousId, setDismissedPreviousId] = useState<string | null>(null);
  const [previousCardHeight, setPreviousCardHeight] = useState<number>(0);
  const currentId = currentVideo?.id ?? null;
  const storedRating = currentVideo
    ? ratingToPrefill(userRatings[currentVideo.id]?.rating ?? currentVideo.viewerRating)
    : null;
  const ratedCurrent = storedRating !== null;
  const unratedEnded = Boolean(currentId && endedVideoId === currentId && !ratedCurrent);
  const showRating =
    !isSuspended &&
    !queueError &&
    !isLoadingQueue &&
    !isCompleted &&
    Boolean(currentVideo) &&
    !isEmptyFallback &&
    !isRevealingScore;
  const showPrevious = Boolean(previousResult) && showRating;
  const previousVideo = previousResult
    ? (videos.find((video) => video.id === previousResult.videoId) ?? null)
    : null;

  useEffect(() => {
    setEndedVideoId(null);
    setHintOpen(false);
    setRatingAttention(false);
  }, [currentId]);

  useEffect(() => {
    if (!isPlaying) return;
    setEndedVideoId(null);
    setHintOpen(false);
  }, [isPlaying]);

  const handlePlaybackEnded = useCallback(() => {
    if (!currentVideo || isEmptyFallback) return;
    const rating = userRatings[currentVideo.id]?.rating ?? currentVideo.viewerRating;
    if (typeof rating === 'number') return;
    setEndedVideoId(currentVideo.id);
    if (currentVideo.ratingOpen !== false && !readUnratedEndHintHidden()) {
      setHintOpen(true);
    }
  }, [currentVideo, isEmptyFallback, userRatings]);

  const focusRating = useCallback(() => {
    setHintOpen(false);
    setRatingAttention(true);
    ratingRef.current?.focus();
    window.setTimeout(() => setRatingAttention(false), 1400);
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] select-none flex-col overflow-hidden bg-black text-white antialiased">
      {/* Dynamic Ambient Background Glow & Stadium Atmosphere (Tablet & Desktop) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,#0c1a10_0%,#060c08_50%,#020403_100%)]" />
        <div
          className="absolute left-1/2 top-1/2 h-[750px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[130px] transition-all duration-700 dark:opacity-25"
          style={{
            background:
              'radial-gradient(circle, hsl(var(--primary)) 0%, hsl(var(--accent) / 0.45) 40%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
        <div className="pointer-events-auto">
          <AppHeader overlay />
        </div>
        <div className="h-8 bg-gradient-to-b from-background/80 to-transparent" />
      </div>

      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-center pt-[4.5rem] sm:pt-20 md:pb-3 md:pt-24 lg:pb-5">
        <div className="flex h-full min-h-0 w-full max-w-[480px] flex-col md:w-auto md:max-w-none md:items-center">
          {/* Rating Section - Positioned above video container */}
          {showRating && (
            <div className="relative z-30 w-full shrink-0 pb-1.5 pt-1 md:w-full md:pb-2">
              <RatingBar
                ref={ratingRef}
                className="w-full"
                onRate={submitRating}
                disabled={isSubmittingRating || currentVideo?.ratingOpen === false}
                closed={currentVideo?.ratingOpen === false}
                userRating={storedRating}
                onSkip={skipVideo}
                error={ratingError}
                attention={ratingAttention}
                progress={duration > 0 ? currentTime / duration : 0}
              />
            </div>
          )}

          {/* Video Player Container - Positioned below Rating Section */}
          <div className="relative min-h-0 w-full flex-1 overflow-hidden sm:mb-3 sm:rounded-3xl sm:ring-1 sm:ring-white/10 md:mb-0 md:aspect-[9/16] md:h-full md:max-h-[calc(100dvh-13.5rem)] md:w-auto md:flex-initial md:border md:border-white/15 md:shadow-[0_16px_48px_rgba(0,0,0,0.85),0_0_80px_rgba(250,70,22,0.15)] lg:max-h-[calc(100dvh-14.5rem)] 2xl:max-h-[860px]">
            <main className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {isSuspended ? (
                <div className="m-4 w-full max-w-lg space-y-6 rounded-3xl border border-rose-500/40 bg-card/90 p-6 text-center text-foreground shadow-2xl backdrop-blur-2xl duration-200 animate-in fade-in zoom-in-95 sm:p-8">
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-md grayscale"
                      style={{ backgroundColor: activeBrand?.colors.primary || '#fa4616' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeBrand?.logoUrl || '/logo/woofskis_logo.png'}
                        alt={activeBrand?.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="text-left">
                      <span className="block text-base font-black text-foreground">
                        {activeBrand?.name}
                      </span>
                    </div>
                  </div>

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/15 text-rose-400 shadow-xl shadow-rose-500/20">
                    <ShieldX className="h-8 w-8 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 font-mono text-xs font-bold text-rose-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>COMPLIANCE REVIEW & MAINTENANCE</span>
                    </div>

                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                      Contest Stream Temporarily Paused
                    </h2>

                    <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {activeBrand?.name} is currently offline while Platform Compliance conducts
                      scheduled policy and copyright verification. Live video judging is paused.
                    </p>
                  </div>
                </div>
              ) : queueError ? (
                <div className="m-4 w-full max-w-lg space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 text-center text-foreground shadow-2xl">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
                  <h2 className="text-xl font-black tracking-tight">Judging queue unavailable</h2>
                  <p className="text-sm text-muted-foreground">{queueError}</p>
                  <Button type="button" onClick={retryQueue} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </Button>
                </div>
              ) : isLoadingQueue ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-white/70">
                    Loading approved showcase entries…
                  </p>
                </div>
              ) : isCompleted ? (
                <QueueCompleted
                  videos={videos}
                  userRatings={userRatings}
                  onRestart={restartQueue}
                />
              ) : videos.length > 0 ? (
                <VerticalVideoFeed
                  videos={videos}
                  currentIndex={currentIndex}
                  totalVideos={totalVideos}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  currentTime={currentTime}
                  duration={duration}
                  isBuffering={isBuffering}
                  isRevealingScore={isRevealingScore}
                  aggregatedResult={aggregatedResult}
                  revealCountdownProgress={revealCountdownProgress}
                  isEmptyFallback={isEmptyFallback}
                  previousCardHeight={previousCardHeight}
                  onPlaybackEnded={handlePlaybackEnded}
                  onTogglePlayPause={togglePlayPause}
                  onSetMuted={setMutedState}
                  onTimeUpdate={setCurrentTime}
                  onDurationChange={setDuration}
                  onBufferingChange={setIsBuffering}
                  onPlayStateChange={setIsPlaying}
                  onOpenComments={openComments}
                  onNext={nextVideo}
                  onGoToVideo={goToVideo}
                  replayGeneration={replayGeneration}
                  feedCycle={feedCycle}
                />
              ) : null}
            </main>

            <StarCelebration burstId={starBurst} />

            {/* Bottom Previously Rated Card */}
            {showPrevious && previousResult && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 box-border w-full px-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1 md:px-3 md:pb-3">
                <div className="pointer-events-auto w-full">
                  <PreviousRatedCard
                    key={previousResult.videoId}
                    result={previousResult}
                    previousVideo={previousVideo}
                    isDismissed={dismissedPreviousId === previousResult.videoId}
                    onDismiss={() => {
                      setDismissedPreviousId(previousResult.videoId);
                      setPreviousCardHeight(0);
                    }}
                    onSelect={returnToLastRated}
                    onHeightChange={(height) => {
                      if (dismissedPreviousId !== previousResult.videoId) {
                        setPreviousCardHeight(height);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UnratedEndDialog
        open={hintOpen && unratedEnded}
        onOpenChange={(open) => {
          if (!open) setHintOpen(false);
        }}
        onRate={focusRating}
        onSkip={() => {
          setHintOpen(false);
          skipVideo();
        }}
        onDontShowAgain={writeUnratedEndHintHidden}
      />
      <CommentsSheet
        open={commentsOpen}
        submissionId={isEmptyFallback ? null : (currentVideo?.id ?? null)}
        onOpenChange={(open) => {
          if (open) openComments();
          else closeComments();
        }}
      />
    </div>
  );
}
