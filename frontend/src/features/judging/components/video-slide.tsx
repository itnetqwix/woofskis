'use client';

import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { Pause, Play, Maximize, AlertCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ContestVideoItem, AggregatedScoreResult } from '@/types/contest';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { ScoreRevealOverlay } from '@/features/judging/components/score-reveal-overlay';
import { VideoActionRail } from '@/features/judging/components/video-action-rail';
import { type MediaPreload } from '@/features/judging/lib/feed-state';
import { notePlayback } from '@/features/judging/lib/playback-metrics';
import {
  applyMediaMuted,
  errorName,
  playbackAfterRejection,
  preferenceAfterAdvance,
  preferenceAfterSpeaker,
} from '@/features/judging/lib/playback-audio';
import { retainPlaybackUrl } from '@/features/judging/lib/playback-src';

export interface VideoSlideProps {
  video: ContestVideoItem;
  index: number;
  totalVideos: number;
  isActive: boolean;
  mountMedia: boolean;
  preloadMode: MediaPreload;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isRevealingScore: boolean;
  aggregatedResult: AggregatedScoreResult | null;
  revealCountdownProgress: number;
  previousCardHeight?: number;
  onPlaybackEnded?: () => void;
  onTogglePlayPause: () => void;
  onSetMuted: (muted: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onBufferingChange: (buffering: boolean) => void;
  onPlayStateChange: (playing: boolean) => void;
  onOpenComments?: () => void;
  onOpenShortcuts?: () => void;
  onNext?: () => void;
  replayGeneration?: number;
  loopVideo?: boolean;
}

const MAX_MEDIA_RETRIES = 2;

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VideoSlideComponent({
  video,
  index,
  totalVideos,
  isActive,
  mountMedia,
  preloadMode,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  isBuffering,
  isRevealingScore,
  aggregatedResult,
  revealCountdownProgress,
  previousCardHeight,
  onPlaybackEnded,
  onTogglePlayPause,
  onSetMuted,
  onTimeUpdate,
  onDurationChange,
  onBufferingChange,
  onPlayStateChange,
  onOpenComments,
  onOpenShortcuts,
  onNext,
  replayGeneration = 0,
  loopVideo = false,
}: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeRef = useRef(isActive);
  activeRef.current = isActive;
  const mediaEpochRef = useRef(0);
  const mediaTokenRef = useRef('');
  const replaySeenRef = useRef(replayGeneration);

  // Audio & Pause Pulse Indicators
  const [audioPulse, setAudioPulse] = useState<{ visible: boolean; isMuted: boolean }>({
    visible: false,
    isMuted: true,
  });
  const [soundBlocked, setSoundBlocked] = useState(false);
  const audioPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundBlockedRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  soundBlockedRef.current = soundBlocked;

  // Press-and-Hold to Pause State
  const [isHoldingToPause, setIsHoldingToPause] = useState<boolean>(false);
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const isHoldingRef = useRef<boolean>(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPlayingBeforeHoldRef = useRef<boolean>(false);

  const displayTags = React.useMemo(() => {
    const list: string[] = [];
    if (video.category && video.category.trim()) {
      list.push(video.category.trim());
    }
    if (video.tags && Array.isArray(video.tags)) {
      for (const tag of video.tags) {
        const trimmed = tag.trim();
        if (trimmed && !list.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
          list.push(trimmed);
        }
      }
    }
    return list;
  }, [video.category, video.tags]);

  // Tablet/desktop only: a tiny blurred copy of the current frame fills the space
  // around portrait or landscape video. The canvas is display:none on phones, so
  // painting is skipped there.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFillPaintRef = useRef(0);
  const paintFill = useCallback((el: HTMLVideoElement, force = false) => {
    const canvas = fillCanvasRef.current;
    if (!canvas || canvas.offsetParent === null || el.readyState < 2) return;
    const now = performance.now();
    if (!force && now - lastFillPaintRef.current < 400) return;
    lastFillPaintRef.current = now;
    try {
      canvas.getContext('2d')?.drawImage(el, 0, 0, canvas.width, canvas.height);
    } catch {
      // Frame not decodable yet.
    }
  }, []);
  const progressTrackRef = useRef<HTMLDivElement | null>(null);

  const [hasError, setHasError] = useState<boolean>(false);
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const playbackSrcRef = useRef({ id: video.id, url: video.videoUrl, retry: 0 });
  if (playbackSrcRef.current.id !== video.id || playbackSrcRef.current.retry !== retryAttempt) {
    playbackSrcRef.current = { id: video.id, url: video.videoUrl, retry: retryAttempt };
  } else {
    const retained = retainPlaybackUrl(playbackSrcRef.current.url, video.videoUrl);
    if (retained !== playbackSrcRef.current.url) {
      playbackSrcRef.current = { ...playbackSrcRef.current, url: retained };
    }
  }
  const playbackSrc = playbackSrcRef.current.url;
  const mediaToken = `${video.id}:${playbackSrc}:${retryAttempt}`;
  if (mediaTokenRef.current !== mediaToken) {
    mediaTokenRef.current = mediaToken;
    mediaEpochRef.current += 1;
  }
  const mediaEpoch = mediaEpochRef.current;
  const isCurrentMedia = () => activeRef.current && mediaEpoch === mediaEpochRef.current;

  // Only the active slide plays. Neighbors stay paused and muted so preload cannot leak audio.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!isActive || !mountMedia) {
      el.pause();
      if (!isActive) applyMediaMuted(el, true);
      return;
    }

    const epoch = mediaEpochRef.current;
    let cancelled = false;
    const preferenceMuted = preferenceAfterAdvance(isMuted);
    applyMediaMuted(el, preferenceMuted || soundBlockedRef.current);

    if (isPlaying && !isHoldingRef.current) {
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch((error: unknown) => {
          if (cancelled || epoch !== mediaEpochRef.current || !activeRef.current) return;
          if (errorName(error) === 'AbortError') return;
          const decision = playbackAfterRejection(preferenceMuted, errorName(error));
          if (decision.showTapForSound) {
            applyMediaMuted(el, true);
            soundBlockedRef.current = true;
            setSoundBlocked(true);
            el.play().catch(() => {
              if (!cancelled && activeRef.current) onPlayStateChange(false);
            });
            return;
          }
          onPlayStateChange(false);
        });
      }
    } else {
      el.pause();
    }

    return () => {
      cancelled = true;
    };
  }, [isActive, isPlaying, isMuted, mountMedia, onPlayStateChange, retryAttempt]);

  useEffect(() => {
    if (replaySeenRef.current === replayGeneration) return;
    replaySeenRef.current = replayGeneration;
    if (!isActive) return;
    const el = videoRef.current;
    if (!el) return;
    const epoch = mediaEpochRef.current;
    try {
      if (el.readyState >= 1) el.currentTime = 0;
    } catch {
      // Metadata is not available yet.
    }
    void el.play().catch((error: unknown) => {
      if (epoch !== mediaEpochRef.current || !activeRef.current) return;
      if (errorName(error) === 'AbortError') return;
      onPlayStateChange(false);
    });
  }, [isActive, onPlayStateChange, replayGeneration]);

  useEffect(() => {
    setHasError(false);
    setRetryAttempt(0);
    setIsMediaLoading(mountMedia);
  }, [video.id, mountMedia]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (audioPulseTimerRef.current) clearTimeout(audioPulseTimerRef.current);
    };
  }, []);

  const handleRetry = useCallback(() => {
    if (retryAttempt >= MAX_MEDIA_RETRIES) return;
    setHasError(false);
    setRetryAttempt((prev) => prev + 1);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current
        .play()
        .then(() => {
          onPlayStateChange(true);
        })
        .catch(() => {
          onPlayStateChange(false);
        });
    }
  }, [onPlayStateChange, retryAttempt]);

  const triggerAudioPulse = useCallback((nextMuted: boolean) => {
    if (audioPulseTimerRef.current) clearTimeout(audioPulseTimerRef.current);
    setAudioPulse({ visible: true, isMuted: nextMuted });
    audioPulseTimerRef.current = setTimeout(() => {
      setAudioPulse((prev) => ({ ...prev, visible: false }));
    }, 600);
  }, []);

  const handleAudioControl = useCallback(() => {
    const currentlySilent = isMutedRef.current || soundBlockedRef.current;
    const nextMuted = preferenceAfterSpeaker(currentlySilent);
    const el = videoRef.current;

    if (nextMuted) {
      if (el) applyMediaMuted(el, true);
      soundBlockedRef.current = false;
      setSoundBlocked(false);
      onSetMuted(true);
      triggerAudioPulse(true);
      return;
    }

    soundBlockedRef.current = false;
    setSoundBlocked(false);
    if (el) {
      applyMediaMuted(el, false);
      const pending = el.play();
      pending
        ?.then(() => onPlayStateChange(true))
        .catch((error: unknown) => {
          if (errorName(error) === 'AbortError') return;
          const decision = playbackAfterRejection(false, errorName(error));
          if (decision.showTapForSound) {
            applyMediaMuted(el, true);
            soundBlockedRef.current = true;
            setSoundBlocked(true);
            el.play().catch(() => onPlayStateChange(false));
            return;
          }
          onPlayStateChange(false);
        });
    }
    onSetMuted(false);
    triggerAudioPulse(false);
  }, [onPlayStateChange, onSetMuted, triggerAudioPulse]);

  // Gesture Handling: Single Tap = Toggle Audio | Press & Hold = Pause Video
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[data-interactive="true"]') ||
        target.closest('aside') ||
        target.closest('nav') ||
        target.closest('header')
      ) {
        return;
      }

      isPointerDownRef.current = true;
      hasMovedRef.current = false;
      isHoldingRef.current = false;
      pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

      // Start hold threshold timer (350ms)
      holdTimerRef.current = setTimeout(() => {
        if (isPointerDownRef.current && !hasMovedRef.current && isActive) {
          isHoldingRef.current = true;
          setIsHoldingToPause(true);

          if (videoRef.current && !videoRef.current.paused) {
            wasPlayingBeforeHoldRef.current = true;
            videoRef.current.pause();
          } else {
            wasPlayingBeforeHoldRef.current = isPlaying;
          }
        }
      }, 350);
    },
    [isActive, isPlaying]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current) return;

      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);

      // If user moved finger > 10px, they are swiping / scrolling!
      if (dx > 10 || dy > 10) {
        hasMovedRef.current = true;

        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }

        // If they were holding and then dragged, resume playback
        if (isHoldingRef.current) {
          isHoldingRef.current = false;
          setIsHoldingToPause(false);

          if (wasPlayingBeforeHoldRef.current && videoRef.current && isActive) {
            videoRef.current.play().catch(() => {});
          }
        }
      }
    },
    [isActive]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Case A: User released a hold -> Resume playback
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        setIsHoldingToPause(false);

        if (wasPlayingBeforeHoldRef.current && videoRef.current && isActive) {
          wasPlayingBeforeHoldRef.current = false;
          videoRef.current.play().catch(() => {});
        }
        return;
      }

      if (hasMovedRef.current && isActive && soundBlockedRef.current && !isMutedRef.current) {
        const el = videoRef.current;
        if (el) {
          applyMediaMuted(el, false);
          el.play()
            .then(() => {
              soundBlockedRef.current = false;
              setSoundBlocked(false);
            })
            .catch(() => {
              applyMediaMuted(el, true);
            });
        }
        return;
      }

      if (!hasMovedRef.current && isActive) {
        handleAudioControl();
      }
    },
    [handleAudioControl, isActive]
  );

  const handlePointerCancel = useCallback(() => {
    isPointerDownRef.current = false;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsHoldingToPause(false);

      if (wasPlayingBeforeHoldRef.current && videoRef.current && isActive) {
        wasPlayingBeforeHoldRef.current = false;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isActive]);

  return (
    <div
      className={cn(
        'relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden',
        'scroll-snap-align-start'
      )}
      style={{ height: '100%', minHeight: '100%' }}
    >
      {/* Dynamic Ambient Background Glow (Desktop) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden opacity-40 blur-3xl transition-all duration-700 dark:opacity-30 md:block"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3) 0%, hsl(var(--accent) / 0.1) 60%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      <div
        ref={frameRef}
        className={cn('relative h-full w-full overflow-hidden bg-black', 'touch-pan-y')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden h-full w-full scale-125 object-cover opacity-50 blur-2xl md:block"
          />
        )}
        <canvas
          ref={fillCanvasRef}
          width={32}
          height={32}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden h-full w-full scale-125 opacity-60 blur-2xl md:block"
        />

        {/* POLISHED REELS-STYLE LOADING / PROGRESS BAR (TOP EDGE OF CURRENT VIDEO) */}
        {isBuffering && !hasError && isActive && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-1 overflow-hidden bg-black/40">
            <div className="animate-reels-loader absolute h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_8px_rgba(127,196,28,0.8)]" />
          </div>
        )}

        {/* Instant visual poster backdrop to eliminate black/empty frame flash */}
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover md:object-contain"
          />
        )}

        {mountMedia ? (
          <video
            ref={videoRef}
            key={retryAttempt}
            src={playbackSrc}
            poster={video.thumbnailUrl || undefined}
            playsInline
            autoPlay={isActive && (isMuted || soundBlocked)}
            muted={!isActive || isMuted || soundBlocked}
            loop={loopVideo}
            preload={preloadMode === 'none' ? 'metadata' : preloadMode}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover md:object-contain"
            onSeeked={(e) => paintFill(e.currentTarget, true)}
            onLoadStart={() => {
              notePlayback(video.id, 'loadstart');
              setIsMediaLoading(true);
            }}
            onTimeUpdate={(e) => {
              paintFill(e.currentTarget);
              if (!isCurrentMedia() || e.currentTarget !== videoRef.current) return;
              onTimeUpdate(e.currentTarget.currentTime);
            }}
            onLoadedMetadata={(e) => {
              notePlayback(video.id, 'loadedmetadata');
              if (!isCurrentMedia() || e.currentTarget !== videoRef.current) return;
              onDurationChange(e.currentTarget.duration);
            }}
            onLoadedData={(e) => {
              if (e.currentTarget !== videoRef.current || mediaEpoch !== mediaEpochRef.current)
                return;
              notePlayback(video.id, 'loadeddata');
              setIsMediaLoading(false);
              paintFill(e.currentTarget, true);
            }}
            onCanPlay={(e) => {
              if (e.currentTarget !== videoRef.current || mediaEpoch !== mediaEpochRef.current)
                return;
              setIsMediaLoading(false);
              if (!activeRef.current) return;
              onBufferingChange(false);
              setHasError(false);
            }}
            onWaiting={(e) => {
              notePlayback(video.id, 'waiting');
              if (e.currentTarget !== videoRef.current || !isCurrentMedia()) return;
              setIsMediaLoading(true);
              onBufferingChange(true);
            }}
            onPlaying={(e) => {
              notePlayback(video.id, 'playing');
              if (e.currentTarget !== videoRef.current || mediaEpoch !== mediaEpochRef.current)
                return;
              setIsMediaLoading(false);
              if (!activeRef.current) return;
              onBufferingChange(false);
              onPlayStateChange(true);
              setHasError(false);
            }}
            onEnded={(e) => {
              if (e.currentTarget !== videoRef.current || !isCurrentMedia() || loopVideo) return;
              onPlayStateChange(false);
              onPlaybackEnded?.();
            }}
            onError={(e) => {
              notePlayback(video.id, 'error');
              if (e.currentTarget !== videoRef.current || mediaEpoch !== mediaEpochRef.current)
                return;
              setHasError(true);
              setIsMediaLoading(false);
              if (activeRef.current) onBufferingChange(false);
            }}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-black/85 via-black/40 to-transparent md:h-[45%]" />

        {/* PRESS-AND-HOLD PAUSED VISUAL FEEDBACK BADGE */}
        {isHoldingToPause && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-black/75 px-5 py-4 text-white shadow-2xl backdrop-blur-xl duration-150 animate-in fade-in zoom-in-95">
              <Pause className="h-9 w-9 fill-white text-white" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                Paused (Holding)
              </span>
            </div>
          </div>
        )}

        {/* SINGLE TAP AUDIO TOGGLE (MUTED / UNMUTED) PULSE FEEDBACK */}
        {audioPulse.visible && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-black/80 px-5 py-4 text-white shadow-2xl backdrop-blur-xl duration-200 animate-in fade-in zoom-in-95">
              {audioPulse.isMuted ? (
                <>
                  <VolumeX className="h-9 w-9 text-white/80" />
                  <span className="text-xs font-bold tracking-wide text-white/90">Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-9 w-9 text-accent drop-shadow-[0_0_12px_rgba(127,196,28,0.7)]" />
                  <span className="text-xs font-bold tracking-wide text-accent">Sound On</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Video Load Error Fallback (Only on Error) */}
        {isMediaLoading &&
          mountMedia &&
          isActive &&
          !hasError &&
          !video.thumbnailUrl &&
          isBuffering && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="pointer-events-none rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                Loading…
              </div>
            </div>
          )}

        {hasError && isActive && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 p-6 text-center text-white">
            <AlertCircle className="mb-3 h-12 w-12 animate-pulse text-destructive" />
            <h3 className="text-base font-bold">Video Stream Unavailable</h3>
            <p className="mt-1 max-w-xs text-xs text-white/70">
              Failed to load video stream. Click retry to reload the stream buffer.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto mt-4 gap-2 text-xs font-semibold"
              disabled={retryAttempt >= MAX_MEDIA_RETRIES}
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry Playback
            </Button>
          </div>
        )}

        {/* BOTTOM-LEFT CREATOR INFORMATION OVERLAY */}
        <div
          className={cn(
            'pointer-events-none absolute left-3 z-20 flex max-w-[calc(100%-4.75rem)] flex-col items-start gap-1.5 sm:left-4 sm:max-w-[calc(100%-5.25rem)]',
            'md:!bottom-[4.25rem] md:left-5 md:max-w-[calc(100%-6rem)]',
            'transition-[bottom,transform] duration-300 ease-out'
          )}
          style={{
            bottom:
              typeof previousCardHeight === 'number' && previousCardHeight > 0
                ? `${previousCardHeight + 12}px`
                : 'max(1.25rem, calc(1rem + env(safe-area-inset-bottom, 0px)))',
          }}
        >
          {/* Tap for sound button if autoplay sound was blocked */}
          {soundBlocked && isActive && !isMuted && (
            <button
              type="button"
              data-interactive="true"
              aria-label="Tap for sound"
              onClick={(e) => {
                e.stopPropagation();
                handleAudioControl();
              }}
              className="pointer-events-auto mb-1 inline-flex h-9 items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 text-xs font-semibold text-white backdrop-blur-md transition-transform active:scale-95"
            >
              <Volume2 className="h-4 w-4 text-[#fa4616]" />
              <span>Tap for sound</span>
            </button>
          )}

          {/* Creator Row */}
          <div className="flex min-w-0 items-center gap-2.5">
            <ProfileAvatar
              name={video.creatorName}
              url={video.creatorAvatarUrl}
              alt={video.creatorName || 'Creator'}
              className="h-9 w-9 shrink-0 rounded-full border border-white/30 object-cover text-xs font-bold shadow-md sm:h-10 sm:w-10"
            />
            <div className="flex min-w-0 flex-col justify-center">
              <span className="truncate text-sm font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] sm:text-base">
                {video.creatorName || 'Creator'}
              </span>
              {video.creatorHandle && (
                <span className="truncate text-[11px] font-medium text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-xs">
                  {video.creatorHandle}
                </span>
              )}
            </div>
          </div>

          {/* Video Title */}
          {video.title && (
            <h2 className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-sm">
              {video.title}
            </h2>
          )}

          {/* Tags / Category */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/15 bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 shadow-sm backdrop-blur-md sm:text-[11px] md:rounded-md md:border-white/10 md:bg-black/55 md:px-2 md:font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <VideoActionRail
          video={video}
          currentIndex={index}
          totalVideos={totalVideos}
          isMuted={isMuted || soundBlocked}
          previousCardHeight={previousCardHeight}
          onToggleMute={handleAudioControl}
          onOpenComments={onOpenComments}
          onOpenShortcuts={onOpenShortcuts}
        />

        {/* Tablet/Desktop playback control bar */}
        {isActive && mountMedia && (
          <div
            data-interactive="true"
            className="absolute inset-x-0 bottom-0 z-20 hidden items-center gap-3 px-4 pb-3 pt-2 text-white md:flex"
          >
            <button
              type="button"
              onClick={onTogglePlayPause}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-white" />
              )}
            </button>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/80">
              {formatClock(currentTime)} / {formatClock(duration)}
            </span>
            <div
              ref={progressTrackRef}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration) || 0}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={-1}
              onClick={(e) => {
                const track = progressTrackRef.current;
                const el = videoRef.current;
                if (!track || !el || !(duration > 0)) return;
                const rect = track.getBoundingClientRect();
                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                el.currentTime = ratio * duration;
                onTimeUpdate(el.currentTime);
              }}
              className="group/seek relative flex h-4 min-w-0 flex-1 cursor-pointer items-center"
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-75"
                  style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                />
              </div>
              <span
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow transition-transform group-hover/seek:scale-110"
                style={{ left: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              onClick={handleAudioControl}
              aria-label={isMuted || soundBlocked ? 'Unmute video' : 'Mute video'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isMuted || soundBlocked ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen?.();
                else void frameRef.current?.requestFullscreen?.();
              }}
              aria-label="Toggle fullscreen"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Score Reveal Overlay Layer */}
        {isRevealingScore && isActive && (
          <ScoreRevealOverlay
            result={aggregatedResult}
            countdownProgress={revealCountdownProgress}
            onNextNow={onNext || (() => {})}
          />
        )}
      </div>
    </div>
  );
}

export const VideoSlide = memo(VideoSlideComponent);
