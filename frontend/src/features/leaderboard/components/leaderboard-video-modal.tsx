'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  Trophy,
  Crown,
  Medal,
  Award,
  Radio,
  BadgeCheck,
  ExternalLink,
  Users,
  Flame,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeaderboardItem } from '@/types/leaderboard';
import { initials } from '@/lib/initials';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeaderboardVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LeaderboardItem | null;
}

export function LeaderboardVideoModal({ open, onOpenChange, item }: LeaderboardVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (open && item) {
      setIsPlaying(true);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.load();
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.catch(() => setIsPlaying(false));
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [open, item]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

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
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden border-border/80 bg-card p-0 shadow-2xl">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-12">
          {/* ======================================================== */}
          {/* LEFT: 9:16 VERTICAL VIDEO PLAYER */}
          {/* ======================================================== */}
          <div className="relative flex min-h-[420px] select-none items-center justify-center bg-black md:col-span-6 md:min-h-[540px]">
            <video
              ref={videoRef}
              src={item.videoUrl}
              poster={item.thumbnailUrl || undefined}
              playsInline
              autoPlay
              loop
              muted={isMuted}
              className="absolute inset-0 h-full w-full cursor-pointer object-contain"
              onClick={togglePlay}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />

            {/* Top gradient & Mute button */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-3">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-md">
                  Rank #{item.rank}
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  {item.category}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black/80"
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 animate-pulse text-primary" />
                )}
              </button>
            </div>

            {/* Bottom Scrubber */}
            <div className="absolute inset-x-0 bottom-0 z-10 space-y-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
              <div
                ref={progressBarRef}
                onClick={handleScrub}
                className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/30 backdrop-blur-md"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-white/80">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT: LEADERBOARD METADATA & SCORE BREAKDOWN */}
          {/* ======================================================== */}
          <div className="flex flex-col justify-between space-y-4 p-5 sm:p-6 md:col-span-6">
            <div className="space-y-4">
              {/* Header Rank Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.rank === 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                      <Crown className="h-3.5 w-3.5 fill-amber-400" /> Rank #1 Champion ($12,500)
                    </span>
                  )}
                  {item.rank === 2 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300/40 bg-slate-300/20 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                      <Medal className="h-3.5 w-3.5" /> Rank #2 Runner-Up ($7,500)
                    </span>
                  )}
                  {item.rank === 3 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-700/40 bg-amber-700/20 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                      <Award className="h-3.5 w-3.5" /> Rank #3 Finalist ($5,000)
                    </span>
                  )}
                  {item.rank > 3 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 font-mono text-xs font-bold text-foreground">
                      Rank #{item.rank} Contender
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-base font-black leading-snug tracking-tight text-foreground sm:text-lg">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Creator Card */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-muted/20 p-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
                  {item.creatorAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.creatorAvatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[#fa4616] text-[10px] font-bold text-white">
                      {initials(item.creatorName)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <span className="truncate">{item.creatorName}</span>
                    {item.creatorVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    )}
                  </div>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.creatorHandle}
                  </span>
                </div>
              </div>

              {/* Consensus Score Breakdown Deck */}
              <div className="space-y-2.5 rounded-2xl border border-border/80 bg-card p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Community Consensus Score
                  </span>
                  <div className="flex items-center gap-1 font-mono text-sm font-black text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{item.communityScore.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">/5.0</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Humor & Creative Execution</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.scoreBreakdown?.humorCreativity || 4.8}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Visual / VFX Quality & Polish</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.scoreBreakdown?.visualQuality || 4.9}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Audio Pacing & Sound Design</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.scoreBreakdown?.audioPacing || 4.7}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Viral Impact & Replayability</span>
                    <span className="font-mono font-bold text-foreground">
                      {item.scoreBreakdown?.viralPotential || 4.8}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono font-semibold">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {item.totalVotes} Total Verified Votes
                  </span>
                  <span>100% On-Chain Weighted</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                asChild
                className="h-10 flex-1 gap-2 bg-primary text-xs font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
              >
                <Link href="/">
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span>Rate in Live Judging Feed</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-10 text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
