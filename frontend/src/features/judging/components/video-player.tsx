'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ContestVideoItem } from '@/types/contest';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  video: ContestVideoItem;
  currentIndex: number;
  totalVideos: number;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  onTogglePlayPause: () => void;
  onToggleMute: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onBufferingChange: (buffering: boolean) => void;
  onPlayStateChange: (playing: boolean) => void;
  onRestartVideo?: () => void;
}

export function VideoPlayer({
  video,
  currentIndex,
  totalVideos,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  isBuffering,
  onTogglePlayPause,
  onToggleMute,
  onTimeUpdate,
  onDurationChange,
  onBufferingChange,
  onPlayStateChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [showPlayPulse, setShowPlayPulse] = useState<boolean>(false);
  const [pulseType, setPulseType] = useState<'play' | 'pause'>('play');
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);

  // Sync isPlaying state with HTML5 video element
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isPlaying) {
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented or stalled
          onPlayStateChange(false);
        });
      }
    } else {
      el.pause();
    }
  }, [isPlaying, onPlayStateChange, retryAttempt]);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Reset errors and attempt loading when video id changes
  useEffect(() => {
    setHasError(false);
    setRetryAttempt(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.id]);

  const handleRetry = useCallback(() => {
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
  }, [onPlayStateChange]);

  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't toggle if clicking on interactive controls
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[data-interactive="true"]')) {
        return;
      }
      setPulseType(isPlaying ? 'pause' : 'play');
      setShowPlayPulse(true);
      setTimeout(() => setShowPlayPulse(false), 550);
      onTogglePlayPause();
    },
    [isPlaying, onTogglePlayPause]
  );

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = newPercent * duration;
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    },
    [duration, onTimeUpdate]
  );

  return (
    <div className="relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Ambient Background Glow (Desktop) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden opacity-40 blur-3xl transition-all duration-700 dark:opacity-30 md:block"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.35) 0%, hsl(var(--accent) / 0.15) 50%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      {/* Main 9:16 Vertical Video Frame */}
      <div
        className={cn(
          'relative flex h-full w-full max-w-[420px] flex-col justify-between overflow-hidden',
          'rounded-none border-0 bg-black shadow-2xl sm:rounded-3xl sm:border sm:border-white/10 md:aspect-[9/16] md:h-[calc(100vh-140px)] md:max-h-[780px]'
        )}
        onClick={handleVideoClick}
      >
        {/* Poster Image Background for instant visual feedback */}
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="blur-xs absolute inset-0 h-full w-full object-cover opacity-40"
            aria-hidden="true"
          />
        )}

        {/* Native HTML5 Video Element */}
        <video
          ref={videoRef}
          key={`${video.id}-${retryAttempt}`}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          playsInline
          autoPlay
          muted={isMuted}
          loop
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => onDurationChange(e.currentTarget.duration)}
          onCanPlay={() => {
            onBufferingChange(false);
            setHasError(false);
          }}
          onWaiting={() => onBufferingChange(true)}
          onPlaying={() => {
            onBufferingChange(false);
            onPlayStateChange(true);
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
            onBufferingChange(false);
          }}
        />

        {/* Video Gradient Overlays for Readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

        {/* Play/Pause Pulse Feedback */}
        {showPlayPulse && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all duration-300 animate-in fade-in zoom-in">
              {pulseType === 'play' ? (
                <Play className="ml-1 h-10 w-10 fill-white" />
              ) : (
                <Pause className="h-10 w-10 fill-white" />
              )}
            </div>
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && !hasError && (
          <div className="backdrop-blur-xs pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/70 px-4 py-3 text-white backdrop-blur-md">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-medium tracking-wide">Buffering entry...</span>
            </div>
          </div>
        )}

        {/* Video Load Error Fallback */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 p-6 text-center text-white backdrop-blur-md">
            <AlertCircle className="mb-3 h-12 w-12 animate-pulse text-destructive" />
            <h3 className="text-base font-semibold">Video Stream Unavailable</h3>
            <p className="mt-1 text-xs text-white/70">
              Failed to load video stream. Click retry to reload the stream buffer.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 gap-2 text-xs"
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

        {/* TOP OVERLAY HEADER */}
        <div
          className="relative z-10 flex items-center justify-between p-4"
          data-interactive="true"
        >
          {/* Entry Counter & Category */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>
                Entry {String(currentIndex + 1).padStart(2, '0')} /{' '}
                {String(totalVideos).padStart(2, '0')}
              </span>
            </div>

            <div className="hidden items-center gap-1 rounded-full border border-primary/30 bg-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary-foreground backdrop-blur-md sm:inline-flex">
              <Sparkles className="h-3 w-3" />
              <span>{video.category}</span>
            </div>
          </div>

          {/* Audio Mute/Unmute Action */}
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className={cn(
              'h-9 w-9 rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition-all hover:bg-black/70 hover:text-white',
              isMuted ? 'text-white/80' : 'border-primary/50 text-primary'
            )}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4 animate-pulse" />
            )}
          </Button>
        </div>

        {/* BOTTOM OVERLAY: Creator Details & Scrubbable Timeline */}
        <div className="relative z-10 flex flex-col justify-end p-4 pb-2 text-white">
          {/* Creator Information Card */}
          <div className="mb-3 space-y-1.5">
            {/* Category tag on mobile if hidden from top */}
            <span className="inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md sm:hidden">
              {video.category}
            </span>

            {/* Creator Row */}
            <div className="flex items-center gap-2.5">
              {video.creatorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.creatorAvatarUrl}
                  alt={video.creatorName}
                  className="h-8 w-8 rounded-full border border-white/30 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {video.creatorName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white drop-shadow-sm">
                  {video.creatorName}
                </span>
                {video.creatorHandle && (
                  <span className="text-xs font-medium text-white/70">{video.creatorHandle}</span>
                )}
              </div>
            </div>

            {/* Video Title */}
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-white drop-shadow-md">
              {video.title}
            </h2>

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-white/80 hover:text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Custom Sleek Progress Bar & Scrubber */}
          <div
            data-interactive="true"
            className="group/progress relative flex flex-col gap-1 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={progressBarRef}
              className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/25 backdrop-blur-md transition-all duration-150 group-hover/progress:h-2.5"
              onClick={handleScrub}
            >
              {/* Progress Fill */}
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Time Stamp Counters */}
            <div className="flex items-center justify-between text-[10px] font-medium text-white/70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
