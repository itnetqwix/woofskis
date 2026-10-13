'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Clock,
  Film,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Star,
  Users,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/common/profile-avatar';
import { useFriendProfile } from '@/features/friends/hooks/use-friend-profile';
import type { FriendProfileSubmission } from '@/services/friends-api';
import { cn } from '@/lib/utils';

interface FriendProfileModalProps {
  friendId: string | null;
  friendName?: string;
  avatarUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendProfileModal({
  friendId,
  friendName,
  avatarUrl: initialAvatarUrl,
  open,
  onOpenChange,
}: FriendProfileModalProps) {
  const { data, isLoading, isError, error, refetch } = useFriendProfile(open ? friendId : null);
  const [selectedVideo, setSelectedVideo] = useState<FriendProfileSubmission | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Reset selected video and active preview whenever modal opens, closes, or friend changes
  useEffect(() => {
    if (!open) {
      setSelectedVideo(null);
      setActivePreviewId(null);
    }
  }, [open, friendId]);

  useEffect(() => {
    if (selectedVideo) {
      setActivePreviewId(null);
    }
  }, [selectedVideo]);

  const friend = data?.friend;
  const stats = data?.stats;
  const submissions = data?.submissions ?? [];

  const displayName = friend?.name || friendName || 'Creator';
  const displayAvatar = friend?.avatarUrl ?? initialAvatarUrl ?? null;

  const formattedJoinedDate = friend?.createdAt
    ? new Date(friend.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-border/80 bg-card p-0 text-card-foreground shadow-2xl',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        <DialogHeader className="border-b border-border/60 bg-muted/20 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <ProfileAvatar
                name={displayName}
                url={displayAvatar}
                className="h-14 w-14 shrink-0 rounded-full border-2 border-primary/20 text-base font-bold shadow-md sm:h-16 sm:w-16 sm:text-lg"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="truncate text-lg font-black tracking-tight text-foreground sm:text-xl">
                    {displayName}
                  </DialogTitle>
                  <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Friend
                  </span>
                </div>
                <DialogDescription className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {formattedJoinedDate ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {formattedJoinedDate}
                    </span>
                  ) : (
                    <span>Creator Profile</span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          {stats ? (
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-4 text-center sm:gap-3">
              <div className="rounded-xl border border-border/60 bg-background/50 p-2 sm:p-2.5">
                <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  <Film className="h-3 w-3 text-primary" />
                  Submissions
                </p>
                <p className="mt-0.5 text-base font-black text-foreground sm:text-lg">
                  {stats.totalSubmissions}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-2 sm:p-2.5">
                <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  <Users className="h-3 w-3 text-primary" />
                  Total Votes
                </p>
                <p className="mt-0.5 text-base font-black text-foreground sm:text-lg">
                  {stats.totalVotes}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/50 p-2 sm:p-2.5">
                <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  Score
                </p>
                <p className="mt-0.5 text-base font-black text-foreground sm:text-lg">
                  {stats.communityScore > 0 ? `${stats.communityScore.toFixed(1)}/10` : '—'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {selectedVideo ? (
            /* Enlarged playable video player view */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                  className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to Submissions
                </Button>
                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Now Playing
                </span>
              </div>

              <EnlargedVideoPlayer
                submission={selectedVideo}
                onClose={() => setSelectedVideo(null)}
              />
            </div>
          ) : (
            /* Submissions Grid View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Film className="h-4 w-4 text-primary" />
                  Uploaded Submissions
                  {!isLoading && !isError ? ` (${submissions.length})` : ''}
                </h3>
              </div>

              {isLoading ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs">Loading friend&apos;s submissions...</p>
                </div>
              ) : isError ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                  <p className="text-xs font-semibold text-destructive">
                    {error instanceof Error ? error.message : 'Unable to load friend profile'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refetch()}
                    className="mt-3 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" /> Retry
                  </Button>
                </div>
              ) : submissions.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-6 text-center">
                  <Film className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs font-semibold text-foreground">
                    No public submissions yet
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {displayName} has not published any approved contest entries yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {submissions.map((sub) => (
                    <FriendSubmissionCard
                      key={sub.id}
                      submission={sub}
                      activePreviewId={activePreviewId}
                      setActivePreviewId={setActivePreviewId}
                      modalOpen={open && !selectedVideo}
                      onClick={() => {
                        setActivePreviewId(null);
                        setSelectedVideo(sub);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border/60 bg-muted/10 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact Facebook-style Video Card with 9:16 Video Preview
 */
function FriendSubmissionCard({
  submission,
  activePreviewId,
  setActivePreviewId,
  modalOpen,
  onClick,
}: {
  submission: FriendProfileSubmission;
  activePreviewId: string | null;
  setActivePreviewId: (id: string | null) => void;
  modalOpen: boolean;
  onClick: () => void;
}) {
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const cleanVideoUrl = submission.videoUrl?.trim() || null;
  const cleanThumbUrl = submission.thumbnailUrl?.trim() || null;

  const shouldPreview =
    modalOpen &&
    inView &&
    activePreviewId === submission.id &&
    Boolean(cleanVideoUrl) &&
    !videoFailed;

  // Observe whether card is in viewport inside the modal
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: '60px', threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When card leaves viewport, pause this preview if it was active
  useEffect(() => {
    if (!inView && activePreviewId === submission.id) {
      setActivePreviewId(null);
    }
  }, [inView, activePreviewId, submission.id, setActivePreviewId]);

  // Synchronize inline video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!shouldPreview) {
      video.pause();
      setIsVideoPlaying(false);
      try {
        video.currentTime = 0;
      } catch {
        // Ignore if metadata not loaded
      }
    } else {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsVideoPlaying(true)).catch(() => setIsVideoPlaying(false));
      }
    }
  }, [shouldPreview]);

  // When modal closes, ensure playback is immediately paused
  useEffect(() => {
    if (!modalOpen && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [modalOpen]);

  // Reset error states when URLs change
  useEffect(() => {
    setVideoFailed(false);
    setThumbFailed(false);
  }, [cleanVideoUrl, cleanThumbUrl]);

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setActivePreviewId(submission.id)}
      onMouseLeave={() => {
        if (activePreviewId === submission.id) {
          setActivePreviewId(null);
        }
      }}
      onFocus={() => setActivePreviewId(submission.id)}
      onBlur={() => {
        if (activePreviewId === submission.id) {
          setActivePreviewId(null);
        }
      }}
      className={cn(
        'shadow-xs group relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-border/70 bg-black text-left transition-all duration-200',
        'hover:scale-[1.02] hover:border-primary/50 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
      aria-label={`Play ${submission.title || 'video submission'}`}
    >
      {/* Background Poster / Thumbnail */}
      {cleanThumbUrl && !thumbFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanThumbUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-2 text-center">
          <Film className="h-6 w-6 text-white/30" />
          <span className="mt-1 line-clamp-1 px-1 text-[9px] text-white/50">
            {submission.title}
          </span>
        </div>
      )}

      {/* Muted Inline Video Preview (Rendered only when card is in view) */}
      {inView && cleanVideoUrl && !videoFailed ? (
        <video
          ref={videoRef}
          src={cleanVideoUrl}
          poster={cleanThumbUrl || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className={cn(
            'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
            isVideoPlaying ? 'opacity-100' : 'opacity-0'
          )}
          onError={() => {
            setVideoFailed(true);
            setIsVideoPlaying(false);
          }}
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : null}

      {/* Top Left: Category Badge */}
      {submission.category ? (
        <span className="shadow-xs pointer-events-none absolute left-2 top-2 z-10 max-w-[70%] truncate rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
          {submission.category}
        </span>
      ) : null}

      {/* Top Right: Duration Pill */}
      {submission.durationSeconds > 0 ? (
        <span className="shadow-xs pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-md">
          <Clock className="h-2.5 w-2.5" />
          {Math.round(submission.durationSeconds)}s
        </span>
      ) : null}

      {/* Center Play Indicator Overlay (Visible when not actively playing preview) */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200',
          isVideoPlaying ? 'opacity-0' : 'bg-black/25 opacity-90 group-hover:opacity-100'
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
          <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
        </div>
      </div>

      {/* Bottom Gradient with Video Title & Contest info */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-8 text-left transition-all">
        <p className="line-clamp-2 text-xs font-bold leading-snug text-white drop-shadow-sm transition-colors group-hover:text-primary">
          {submission.title}
        </p>
        <div className="mt-1 flex items-center justify-between text-[10px] text-white/70">
          <span className="max-w-[65%] truncate">{submission.contestTitle}</span>
          {submission.communityScore > 0 && (
            <span className="font-mono font-bold text-amber-400">
              ⭐ {submission.communityScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Enlarged Playable Video Player with Standard Controls and Graceful Error Handling
 */
function EnlargedVideoPlayer({
  submission,
  onClose,
}: {
  submission: FriendProfileSubmission;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(submission.durationSeconds || 15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const cleanVideoUrl = submission.videoUrl?.trim() || '';
  const cleanThumbUrl = submission.thumbnailUrl?.trim() || '';

  // Synchronize playback on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cleanVideoUrl) {
      setHasError(!cleanVideoUrl);
      return;
    }

    setHasError(false);
    setCurrentTime(0);
    setIsMuted(false);

    try {
      video.currentTime = 0;
    } catch {
      // Ignore if metadata isn't ready
    }

    let cancelled = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (!cancelled) {
            setIsPlaying(true);
            setIsMuted(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          // Autoplay with audio restricted by browser -> try muted autoplay
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
  }, [cleanVideoUrl, submission.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const target = containerRef.current || videoRef.current;
    if (!target) return;

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

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

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-12">
      {/* 9:16 Vertical Video Container */}
      <div className="flex flex-col items-center justify-center sm:col-span-6 md:col-span-5">
        <div
          ref={containerRef}
          className="group relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl border border-border bg-black shadow-xl"
        >
          {cleanVideoUrl && !hasError ? (
            <video
              ref={videoRef}
              src={cleanVideoUrl}
              poster={cleanThumbUrl || undefined}
              playsInline
              autoPlay
              loop
              muted={isMuted}
              className="h-full w-full cursor-pointer object-cover"
              onClick={togglePlay}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                const dur = e.currentTarget.duration;
                if (Number.isFinite(dur) && dur > 0) {
                  setDuration(dur);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setHasError(true)}
            />
          ) : (
            /* Graceful Playback Error State */
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-950 to-zinc-900 p-4 text-center">
              <Film className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">Playback Unavailable</p>
              <p className="text-[11px] text-muted-foreground">Unable to load playback source.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHasError(false);
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

          {/* Center Play Overlay */}
          {cleanVideoUrl && !hasError && !isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
                <Play className="ml-0.5 h-6 w-6 fill-white" />
              </div>
            </div>
          )}

          {/* Top Bar: Category Pill & Mute Button */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3">
            {submission.category ? (
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                {submission.category}
              </span>
            ) : (
              <span />
            )}

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

          {/* Bottom Controls Bar with Scrubber */}
          <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 text-xs text-white">
            {/* Scrubber Progress Bar */}
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

            {/* Control Icons Row */}
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

      {/* Video Details & Score Column */}
      <div className="space-y-4 sm:col-span-6 md:col-span-7">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {submission.category ? (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {submission.category}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">Contest Submission</span>
          </div>
          <h4 className="text-base font-bold text-foreground sm:text-lg">{submission.title}</h4>
          <p className="text-xs text-muted-foreground">Contest: {submission.contestTitle}</p>
        </div>

        {/* Community Score Deck */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Community Performance
            </span>
            <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-400">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>
                {submission.communityScore > 0 ? submission.communityScore.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">/ 10</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Verified Evaluator Votes</span>
            <span className="font-mono font-semibold text-foreground">
              {submission.totalVotes} votes
            </span>
          </div>
        </div>

        {/* Description / Notes if available */}
        {submission.description ? (
          <div className="space-y-1 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </p>
            <p className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-foreground/90">
              {submission.description}
            </p>
          </div>
        ) : null}

        {/* Submission Meta Specs */}
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-center text-[11px]">
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-semibold text-foreground">{submission.durationSeconds}s</p>
          </div>
          <div>
            <p className="text-muted-foreground">Aspect Ratio</p>
            <p className="font-semibold text-foreground">9:16 Vertical</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="w-full text-xs font-semibold"
        >
          Back to Submissions
        </Button>
      </div>
    </div>
  );
}
