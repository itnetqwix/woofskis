'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Star,
  Trophy,
  Clock,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Tag,
  Calendar,
  Film,
} from 'lucide-react';
import { CreatorSubmissionItem } from '@/types/creator';
import { SubmissionStatusBadge } from '@/features/submissions/components/submission-status-badge';
import Link from 'next/link';

interface VideoPreviewModalProps {
  submission: CreatorSubmissionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResubmit?: (submission: CreatorSubmissionItem) => void;
}

export function VideoPreviewModal({
  submission,
  open,
  onOpenChange,
  onResubmit,
}: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  const cleanVideoUrl = submission?.videoUrl?.trim() || '';
  const cleanThumbUrl = submission?.thumbnailUrl?.trim() || '';

  // Synchronize playback state when modal opens or submission changes
  useEffect(() => {
    const video = videoRef.current;
    if (!open || !submission || !cleanVideoUrl) {
      if (video) {
        video.pause();
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setVideoError(false);
      return;
    }

    setVideoError(false);
    setCurrentTime(0);
    setIsMuted(false);

    if (video) {
      try {
        video.currentTime = 0;
      } catch {
        // Ignore if metadata not loaded yet
      }
      video.muted = false;
      video.volume = 1;

      let cancelled = false;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (cancelled) return;
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            if (cancelled) return;
            // Autoplay with sound restricted by browser -> try muted autoplay
            video.muted = true;
            setIsMuted(true);
            video
              .play()
              .then(() => {
                if (!cancelled) setIsPlaying(true);
              })
              .catch(() => {
                if (!cancelled) setIsPlaying(false);
              });
          });
      }

      return () => {
        cancelled = true;
        video.pause();
      };
    }
  }, [open, submission?.id, cleanVideoUrl]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  // Volume / Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 1;
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const target = playerContainerRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, []);

  // Timeline scrubber / seek
  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !videoRef.current || duration <= 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
      const newTime = newPercent * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!submission) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border border-border/80 bg-card p-0 text-card-foreground shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-border/60 bg-muted/20 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              <SubmissionStatusBadge status={submission.status} />
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {submission.category}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>
          <DialogTitle className="mt-1 line-clamp-1 text-base font-bold text-foreground sm:text-lg">
            {submission.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Contest: {submission.contestName}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body: Enlarged Video Player + Info Grid */}
        <div className="grid grid-cols-1 items-start gap-4 p-4 sm:p-6 md:grid-cols-12">
          {/* 9:16 Vertical Video Player Container (5 cols on md) */}
          <div className="flex flex-col items-center justify-center md:col-span-5">
            <div
              ref={playerContainerRef}
              className="group relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-border bg-black shadow-xl"
            >
              {cleanVideoUrl && !videoError ? (
                <video
                  key={submission.id}
                  ref={videoRef}
                  src={cleanVideoUrl}
                  poster={cleanThumbUrl || undefined}
                  className="h-full w-full cursor-pointer object-cover"
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (Number.isFinite(dur) && dur > 0) {
                      setDuration(dur);
                    } else if (submission.durationSeconds) {
                      setDuration(submission.durationSeconds);
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setVideoError(true)}
                  onClick={togglePlay}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-black via-zinc-950 to-zinc-900 p-4 text-center">
                  <Film className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">Video Stream Unavailable</p>
                  <p className="text-[11px] text-muted-foreground">
                    Unable to load playback source.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVideoError(false);
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="mt-2 h-7 text-xs"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Retry
                  </Button>
                </div>
              )}

              {/* Center Play/Pause indicator overlay */}
              {cleanVideoUrl && !videoError && !isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 fill-white" />
                  </div>
                </div>
              )}

              {/* Top Bar: Category Pill & Mute Quick Toggle */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3">
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  {submission.category}
                </span>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80"
                  aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              </div>

              {/* Bottom Standard Video Controls & Scrubber */}
              <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 text-xs text-white">
                {/* Seek Scrubber Progress Bar */}
                <div
                  ref={progressBarRef}
                  onClick={handleScrub}
                  className="group/scrub relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-white/25 backdrop-blur-md"
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-valuenow={currentTime}
                  aria-label="Seek video position"
                  tabIndex={0}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all group-hover/scrub:bg-primary-hover"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Control Icons & Time Row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="h-3.5 w-3.5 fill-white" />
                      ) : (
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <span className="font-mono text-[10px] text-white/80">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata & Actions Column (7 cols on md) */}
          <div className="space-y-4 md:col-span-7">
            {/* Status-specific highlight card */}
            {submission.status === 'APPROVED' && (
              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                      <Star className="h-4 w-4 fill-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Live in Contest Leaderboard
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Actively receiving community consensus votes
                      </p>
                    </div>
                  </div>
                  {submission.rank && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-500">
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Rank #{submission.rank}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="rounded-lg border border-emerald-500/20 bg-background/50 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Community Score</p>
                    <p className="mt-0.5 text-lg font-bold text-foreground">
                      ⭐ {submission.communityScore?.toFixed(1) || '4.8'} / 10
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-background/50 p-2.5 text-center">
                    <p className="text-[11px] text-muted-foreground">Total Evaluator Votes</p>
                    <p className="mt-0.5 text-lg font-bold text-foreground">
                      {submission.totalVotes || 0}
                    </p>
                  </div>
                </div>

                <Link href="/" onClick={() => onOpenChange(false)} className="block w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-emerald-500/30 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View Performance in Judging Stream</span>
                  </Button>
                </Link>
              </div>
            )}

            {submission.status === 'PENDING_REVIEW' && (
              <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 animate-spin text-amber-500" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Awaiting AI & Moderator Verification
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your submission is currently in the automated transcode and content clearance
                  queue. Turnaround estimated between 2 - 4 hours. Once verified, it will instantly
                  go live for global community voting.
                </p>
              </div>
            )}

            {submission.status === 'REJECTED' && (
              <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-semibold">Rejection Feedback & Action Required</span>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-background/80 p-3 font-medium text-foreground/90">
                  {submission.rejectionReason ||
                    'Content did not comply with short contest rules or audio copyright clearance requirements.'}
                </div>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onResubmit?.(submission);
                  }}
                  className="w-full gap-2 bg-destructive text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Resubmit Revised Entry Now</span>
                </Button>
              </div>
            )}

            {/* Description / Notes */}
            {submission.description && (
              <div className="space-y-1 text-xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Description / Creator Notes
                </p>
                <p className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-foreground/90">
                  {submission.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {submission.tags && submission.tags.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  Keywords & Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {submission.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Specs */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-center text-[11px]">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {submission.durationSeconds}s
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Format</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {submission.aspectRatio || '9:16'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">File Size</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {submission.fileSizeMb || 34.2} MB
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full text-xs font-semibold"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
