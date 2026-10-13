'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Film, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoThumbnailCardProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  durationSeconds?: number | null;
  className?: string;
  onClick?: () => void;
  showDuration?: boolean;
}

/**
 * Compact video preview card with intersection-observed muted autoplay
 * and graceful fallback to thumbnail poster or gradient icon.
 * Shared across Leaderboard and Creator Dashboard.
 */
export function VideoThumbnailCard({
  videoUrl,
  thumbnailUrl,
  title,
  durationSeconds,
  className,
  onClick,
  showDuration = true,
}: VideoThumbnailCardProps) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  // Reset error states when URLs change
  useEffect(() => {
    setVideoFailed(false);
    setThumbFailed(false);
  }, [videoUrl, thumbnailUrl]);

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
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cleanVideoUrl = videoUrl?.trim() || null;
  const cleanThumbUrl = thumbnailUrl?.trim() || null;

  const showVideo = inView && Boolean(cleanVideoUrl) && !videoFailed;
  const showThumb = (!showVideo || videoFailed) && Boolean(cleanThumbUrl) && !thumbFailed;

  return (
    <button
      ref={containerRef}
      type="button"
      onClick={onClick}
      className={cn(
        'group/thumb relative shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-black shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      aria-label={`Play ${title || 'video preview'}`}
    >
      {showVideo ? (
        <video
          src={cleanVideoUrl!}
          poster={cleanThumbUrl || undefined}
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
      ) : showThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanThumbUrl!}
          alt=""
          className="h-full w-full object-cover transition-transform group-hover/thumb:scale-105"
          onError={() => setThumbFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 via-black/40 to-black/80">
          <Film className="h-4 w-4 text-white/40" aria-hidden="true" />
        </span>
      )}

      {/* Hover / Active Play Button Overlay */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover/thumb:opacity-100">
        <Play className="h-4 w-4 fill-white text-white drop-shadow-sm" aria-hidden="true" />
      </span>

      {/* Duration Badge */}
      {showDuration && durationSeconds && durationSeconds > 0 ? (
        <span className="backdrop-blur-xs pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 font-mono text-[8px] font-medium text-white">
          {Math.round(durationSeconds)}s
        </span>
      ) : null}
    </button>
  );
}
