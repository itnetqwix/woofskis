'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Keyboard, MessageCircle, Send, Trophy } from 'lucide-react';
import { ContestVideoItem } from '@/types/contest';
import { ShareSheet } from '@/features/judging/components/share-sheet';
import { buildScoreboardPath, buildVideoShareUrl } from '@/features/judging/lib/share-url';
import { cn } from '@/lib/utils';

export interface VideoActionRailProps {
  video: ContestVideoItem;
  currentIndex: number;
  totalVideos: number;
  isMuted: boolean;
  hasElevatedCard?: boolean;
  previousCardHeight?: number;
  onToggleMute: () => void;
  onOpenComments?: () => void;
  onOpenShortcuts?: () => void;
  // Deprecated navigation callbacks retained optionally for backward compatibility
  onSkip?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function VideoActionRail({
  video,
  isMuted,
  hasElevatedCard = false,
  previousCardHeight,
  onToggleMute,
  onOpenComments,
  onOpenShortcuts,
}: VideoActionRailProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareable = !video.id.startsWith('empty-');
  const shareUrl =
    shareable && typeof window !== 'undefined'
      ? buildVideoShareUrl(window.location.origin, video.id)
      : '';
  const scoreDisplay = video.communityScore > 0 ? video.communityScore.toFixed(1) : '—';
  const votesDisplay =
    video.totalVotes > 0
      ? `${video.totalVotes} ${video.totalVotes === 1 ? 'vote' : 'votes'}`
      : '0 votes';

  // Base style for icon action controls: consistent 48px touch target, thin low-contrast border, subtle translucent dark bg
  const baseActionButtonClass =
    'group flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa4616] hover:bg-black/70 active:scale-95 disabled:pointer-events-none disabled:opacity-50';

  const bottomStyle =
    typeof previousCardHeight === 'number' && previousCardHeight > 0
      ? `${previousCardHeight + 12}px`
      : hasElevatedCard
        ? 'max(12.25rem, calc(11.75rem + env(safe-area-inset-bottom, 0px)))'
        : 'max(1.5rem, calc(1.25rem + env(safe-area-inset-bottom, 0px)))';

  return (
    <aside
      aria-label="Video action rail"
      className={cn(
        'pointer-events-auto absolute right-2.5 z-20 flex flex-col items-center gap-3.5 sm:right-3',
        'transition-[bottom,transform] duration-300 ease-out'
      )}
      style={{
        bottom: bottomStyle,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Score Card: Compact information card displaying community score & vote count (NOT an action button) */}
      <div
        className="flex min-w-12 flex-col items-center justify-center rounded-xl border border-white/15 bg-black/45 px-1.5 py-1.5 text-center text-white shadow-sm backdrop-blur-md"
        title={`Community rating: ${scoreDisplay} / 10 across ${votesDisplay}`}
      >
        <div className="flex items-center gap-0.5 text-[#fa4616]">
          <span className="text-[13px] font-black leading-none tracking-tight text-white">
            {scoreDisplay}
          </span>
        </div>
        <span className="mt-1 whitespace-nowrap text-[10px] font-semibold leading-none text-white/80">
          {votesDisplay}
        </span>
      </div>

      {/* Comments Action Button: Compact 48px circle, consistent design language */}
      <button
        type="button"
        onClick={onOpenComments}
        aria-label="Comments"
        title="View and post comments"
        className={cn(
          baseActionButtonClass,
          'border-white/15 bg-black/45 text-white/90 hover:border-white/30 hover:bg-black/60 hover:text-white'
        )}
      >
        <MessageCircle
          className="h-6 w-6 transition-transform duration-150 group-hover:scale-110"
          aria-hidden="true"
        />
      </button>

      {shareable ? (
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="Share"
          title="Share this video"
          className={cn(
            baseActionButtonClass,
            'border-white/15 bg-black/45 text-white/90 hover:border-white/30 hover:bg-black/60 hover:text-white'
          )}
        >
          <Send
            className="h-6 w-6 transition-transform duration-150 group-hover:scale-110"
            aria-hidden="true"
          />
        </button>
      ) : null}

      {shareable && video.contestId ? (
        <Link
          href={buildScoreboardPath(video.contestId)}
          aria-label="Scoreboard"
          title="Contest scoreboard"
          className={cn(
            baseActionButtonClass,
            'border-white/15 bg-black/45 text-white/90 hover:border-white/30 hover:bg-black/60 hover:text-white'
          )}
        >
          <Trophy
            className="h-6 w-6 transition-transform duration-150 group-hover:scale-110"
            aria-hidden="true"
          />
        </Link>
      ) : null}

      {/* 4. Mute / Unmute Action Button: Compact 48px circle, consistent design language */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        title={isMuted ? 'Unmute (M or Tap video)' : 'Mute (M or Tap video)'}
        className={cn(
          baseActionButtonClass,
          'border-white/15 bg-black/45 text-white/90 hover:border-white/30 hover:bg-black/60 hover:text-white',
          !isMuted && 'border-white/25 bg-black/50 text-white'
        )}
      >
        {isMuted ? (
          <VolumeX
            className="h-6 w-6 transition-transform duration-150 group-hover:scale-110"
            aria-hidden="true"
          />
        ) : (
          <Volume2
            className="h-6 w-6 text-[#fa4616] transition-transform duration-150 group-hover:scale-110"
            aria-hidden="true"
          />
        )}
      </button>

      {/* 5. Desktop Keyboard Shortcuts Trigger (Hidden on Mobile) */}
      <ShareSheet open={shareOpen} url={shareUrl} title={video.title} onOpenChange={setShareOpen} />

      {onOpenShortcuts && (
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="Viewer keyboard shortcuts"
          title="Keyboard shortcuts"
          className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 shadow-md backdrop-blur-xl transition-all duration-150 hover:bg-black/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-90 md:flex"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      )}
    </aside>
  );
}
