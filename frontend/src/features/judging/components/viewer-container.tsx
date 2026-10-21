'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ShieldX,
  AlertTriangle,
  RefreshCw,
  Clock,
  Loader2,
  Film,
  History,
  Radio,
} from 'lucide-react';
import { useContestQueue } from '@/features/judging/hooks/use-contest-queue';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { VerticalVideoFeed } from '@/features/judging/components/vertical-video-feed';
import { RatingBar } from '@/features/judging/components/rating-bar';
import { PreviousRatedCard } from '@/features/judging/components/previous-rated-card';
import { UnratedEndDialog } from '@/features/judging/components/unrated-end-dialog';
import { StarCelebration } from '@/features/judging/components/star-celebration';
import { ratingToPrefill } from '@/constants/rating-scale';
import {
  isRatingActiveForVideo,
  readUnratedEndHintHidden,
  writeUnratedEndHintHidden,
} from '@/features/judging/lib/judging-flow';
import { CommentsSheet } from '@/features/judging/components/comments-sheet';
import { QueueCompleted } from '@/features/judging/components/queue-completed';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

export function ViewerContainer() {
  const { activeBrand } = useTenantTheme();
  const isWideLayout = useMediaQuery('(min-width: 768px)');
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
  const pauseMainPlayer = useCallback(() => setIsPlaying(false), [setIsPlaying]);

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
  const isRatingActive = isRatingActiveForVideo(currentVideo);
  const showRating =
    !isSuspended &&
    !queueError &&
    !isLoadingQueue &&
    !isCompleted &&
    Boolean(currentVideo) &&
    !isEmptyFallback &&
    !isRevealingScore &&
    isRatingActive;
  const showPrevious = Boolean(previousResult) && showRating && !isWideLayout;
  const showPreviousPanel = Boolean(previousResult) && !isSuspended && !queueError;
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
    if (isRatingActive && !readUnratedEndHintHidden()) {
      setHintOpen(true);
    }
  }, [currentVideo, isEmptyFallback, userRatings, isRatingActive]);

  const focusRating = useCallback(() => {
    setHintOpen(false);
    setRatingAttention(true);
    ratingRef.current?.focus();
    window.setTimeout(() => setRatingAttention(false), 1400);
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] select-none flex-col overflow-hidden bg-black text-white antialiased md:bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
        <div className="pointer-events-auto">
          <AppHeader overlay />
        </div>
        <div className="h-8 bg-gradient-to-b from-background/80 to-transparent md:hidden" />
      </div>

      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col items-center justify-center pt-[4.5rem] sm:pt-20 md:max-w-[1440px] md:flex-row md:items-stretch md:gap-5 md:px-5 md:pb-5 md:pt-[5.25rem] lg:gap-6 lg:px-8 lg:pb-6">
        {/* Last Rated Video Column (Tablet & Desktop) */}
        <aside
          aria-label="Last rated video"
          className="no-scrollbar hidden md:flex md:w-[31%] md:min-w-0 md:shrink-0 md:flex-col md:overflow-y-auto"
        >
          <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-4 flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary">
                <History className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-tight text-foreground">
                  Last Rated Video
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Here&apos;s what you just rated</p>
              </div>
            </div>
            {isWideLayout && showPreviousPanel && previousResult ? (
              <PreviousRatedCard
                key={previousResult.videoId}
                variant="panel"
                result={previousResult}
                previousVideo={previousVideo}
                onSelect={returnToLastRated}
                onReplay={pauseMainPlayer}
                mainPlaying={isPlaying}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <Film className="h-6 w-6 text-muted-foreground/60" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">Videos you rate will appear here.</p>
              </div>
            )}
          </div>
        </aside>

        <div className="flex h-full min-h-0 w-full max-w-[480px] flex-col md:w-auto md:min-w-0 md:max-w-none md:flex-1 md:gap-3.5">
          {/* Judging Heading (Tablet & Desktop) */}
          <div className="hidden shrink-0 items-end justify-between gap-4 md:flex">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Live Judging
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground lg:text-3xl">
                {isRatingActive ? (
                  <>Rate <span className="text-primary">This Video</span></>
                ) : (
                  <>Watch <span className="text-primary">This Video</span></>
                )}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
                {isRatingActive
                  ? 'Watch the video and give your rating. The next video will play automatically.'
                  : 'Watch the video. The next video will play automatically.'}
              </p>
            </div>
            {currentVideo && !isEmptyFallback && totalVideos > 0 && (
              <div className="w-36 shrink-0 pb-1 text-right lg:w-44">
                <p className="text-xs font-medium text-muted-foreground">
                  Video {Math.min(currentIndex + 1, totalVideos)} of {totalVideos}
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{
                      width: `${Math.min(100, ((currentIndex + 1) / totalVideos) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating Section - above the video on phones, below it on tablet/desktop */}
          {showRating && (
            <div className="relative z-30 w-full shrink-0 pb-1.5 pt-1 md:order-last md:w-full md:pb-0 md:pt-0">
              <RatingBar
                ref={ratingRef}
                className="w-full"
                onRate={submitRating}
                disabled={isSubmittingRating || !isRatingActive}
                closed={!isRatingActive}
                userRating={storedRating}
                onSkip={skipVideo}
                error={ratingError}
                attention={ratingAttention}
                progress={duration > 0 ? currentTime / duration : 0}
                tone={isWideLayout ? 'theme' : 'onDark'}
              />
            </div>
          )}
          {/* Tablet/desktop: hold the rating panel's space during score reveal or loading for active contests */}
          {!showRating && isRatingActive && (
            <div aria-hidden="true" className="hidden md:order-last md:block md:h-[102px] md:shrink-0" />
          )}

          {/* Video Player Container - Positioned below Rating Section */}
          <div className="relative min-h-0 w-full flex-1 overflow-hidden sm:mb-3 sm:rounded-3xl sm:ring-1 sm:ring-white/10 md:mb-0 md:w-full md:rounded-2xl md:border md:border-border md:bg-black md:shadow-md md:ring-0">
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
                        src={activeBrand?.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
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
                  previousCardHeight={isWideLayout ? 0 : previousCardHeight}
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
