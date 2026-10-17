'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Copy,
  CheckCheck,
  SlidersHorizontal,
  FileCheck2,
  FileX2,
  Music,
  Video as VideoIcon,
  Clock,
  Tv2,
  BadgeCheck,
  Radio,
  ExternalLink,
  Flame,
  Info,
} from 'lucide-react';
import { AdminSubmissionItem, RejectionReasonCode, ValidationChecklistState } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModerationSplitViewerProps {
  submission: AdminSubmissionItem | null;
  currentIndex: number;
  totalSubmissions: number;
  allSubmissions: AdminSubmissionItem[];
  onSelectSubmission: (id: string) => void;
  onApprove: (id: string) => void;
  onRequestReject: (submission: AdminSubmissionItem) => void;
  onToggleFlag: (id: string) => void;
  onToggleCheck: (id: string, checkKey: keyof ValidationChecklistState) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenShortcuts?: () => void;
}

export function ModerationSplitViewer({
  submission,
  currentIndex,
  totalSubmissions,
  allSubmissions,
  onSelectSubmission,
  onApprove,
  onRequestReject,
  onToggleFlag,
  onToggleCheck,
  onNext,
  onPrev,
  onOpenShortcuts,
}: ModerationSplitViewerProps) {
  // Video player internal state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showPlayPulse, setShowPlayPulse] = useState<boolean>(false);
  const [pulseType, setPulseType] = useState<'play' | 'pause'>('play');

  // Reset playback when active video changes
  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [submission?.id]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Play/pause toggle
  const handleTogglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPulseType('pause');
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setPulseType('play');
    }
    setShowPlayPulse(true);
    setTimeout(() => setShowPlayPulse(false), 500);
  }, [isPlaying]);

  // Time scrubber click
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

  const copySubmissionId = () => {
    if (!submission) return;
    navigator.clipboard.writeText(submission.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!submission) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Submissions Found</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          There are no video submissions matching the selected filter criteria. Select another
          filter tab or reset search query.
        </p>
      </div>
    );
  }

  const checks = submission.complianceChecks || {
    resolutionPass: true,
    aspectRatioPass: true,
    audioCleared: true,
    policyCompliant: true,
    durationCompliant: true,
  };

  const allChecksPass =
    checks.resolutionPass &&
    checks.aspectRatioPass &&
    checks.audioCleared &&
    checks.policyCompliant &&
    checks.durationCompliant;

  return (
    <div className="space-y-4">
      {/* MAIN SPLIT DECK */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* LEFT COLUMN: 9:16 VERTICAL VIDEO PLAYER & METADATA OVERLAY */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center justify-center lg:col-span-5">
          <div className="group relative aspect-[9/16] w-full max-w-[300px] select-none overflow-hidden rounded-2xl border border-border/80 bg-black shadow-2xl">
            {/* Native Video Element */}
            <video
              ref={videoRef}
              src={submission.videoUrl}
              poster={submission.thumbnailUrl}
              playsInline
              autoPlay
              loop
              muted={isMuted}
              preload="auto"
              className="absolute inset-0 h-full w-full cursor-pointer object-cover"
              onClick={handleTogglePlay}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onError={() => {
                setHasError(true);
                setIsBuffering(false);
              }}
            />

            {/* Top and bottom gradient shadows */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

            {/* Play/Pause Center Pulse */}
            {showPlayPulse && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md animate-in fade-in zoom-in">
                  {pulseType === 'play' ? (
                    <Play className="ml-1 h-8 w-8 fill-white" />
                  ) : (
                    <Pause className="h-8 w-8 fill-white" />
                  )}
                </div>
              </div>
            )}

            {/* TOP BAR OVERLAY */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 p-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Index Pill */}
                <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  <Layers className="h-3 w-3 text-primary" />
                  <span>
                    #{currentIndex + 1} of {totalSubmissions}
                  </span>
                </div>

                {/* Status Pill */}
                {submission.status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                    <Check className="h-3 w-3" /> Live Approved
                  </span>
                )}
                {submission.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 backdrop-blur-md">
                    <X className="h-3 w-3" /> Rejected
                  </span>
                )}
                {(submission.status === 'FLAGGED' || submission.isFlagged) && (
                  <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-warning/40 bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning backdrop-blur-md">
                    <AlertTriangle className="h-3 w-3" /> Suspicious Flag
                  </span>
                )}
                {submission.status === 'PENDING_REVIEW' && !submission.isFlagged && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md">
                    Pending Review
                  </span>
                )}
              </div>

              {/* Sound Mute Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95',
                  isMuted ? 'text-white/80' : 'border-primary/40 text-primary'
                )}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                )}
              </button>
            </div>

            {/* BOTTOM INFO & SCRUBBER */}
            <div className="absolute inset-x-0 bottom-0 z-20 space-y-2 p-3.5 text-white">
              {/* Creator Pill */}
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/30 bg-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.creatorAvatarUrl}
                    alt={submission.creatorName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-xs font-bold text-white drop-shadow-sm">
                      {submission.creatorName}
                    </span>
                    {submission.creatorVerified && (
                      <BadgeCheck className="h-3 w-3 shrink-0 text-blue-400" />
                    )}
                  </div>
                  <span className="block truncate text-[10px] text-white/70">
                    {submission.creatorHandle}
                  </span>
                </div>
              </div>

              {/* Video Title */}
              <p className="line-clamp-1 text-xs font-semibold text-white drop-shadow-sm">
                {submission.title}
              </p>

              {/* Technical specs pill */}
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/70">
                <span className="py-0.2 rounded bg-white/15 px-1.5 backdrop-blur-sm">
                  {submission.resolution}
                </span>
                <span className="py-0.2 rounded bg-white/15 px-1.5 backdrop-blur-sm">
                  {submission.fps} fps
                </span>
                <span className="py-0.2 rounded bg-white/15 px-1.5 backdrop-blur-sm">
                  {submission.fileSizeMb} MB
                </span>
              </div>

              {/* Custom Scrubber */}
              <div
                className="group/progress relative flex flex-col gap-1 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  ref={progressBarRef}
                  className="relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/30 backdrop-blur-md transition-all group-hover/progress:h-2.5"
                  onClick={handleScrub}
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between font-mono text-[9px] text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: VALIDATION CHECKLIST & DECISION CONTROL HUB */}
        {/* ============================================================ */}
        <div className="flex flex-col space-y-3 lg:col-span-7">
          {/* 1. SUBMISSION HEADLINE & CREATOR METADATA */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copySubmissionId}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>ID: {submission.id}</span>
                    {copiedId ? (
                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>

                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {submission.category}
                  </span>

                  <span className="text-[11px] text-muted-foreground">
                    Submitted{' '}
                    {new Date(submission.submittedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h2 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                  {submission.title}
                </h2>
              </div>

              {/* Navigation Arrows */}
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPrev}
                  className="h-8 w-8 rounded-lg"
                  title="Previous Item (K / Up Arrow)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onNext}
                  className="h-8 w-8 rounded-lg"
                  title="Next Item (J / Down Arrow)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description & Tags */}
            {submission.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {submission.description}
              </p>
            )}

            {submission.tags && submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {submission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Flag alert banner if flagged */}
            {(submission.status === 'FLAGGED' || submission.isFlagged) && (
              <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-warning">
                      Suspicious Flag Raised{' '}
                      {submission.flagScore ? `(AI Risk Score: ${submission.flagScore}%)` : ''}
                    </span>
                  </div>
                  <p className="text-xs leading-tight text-warning/90">
                    {submission.flagReason ||
                      'Flagged for content/audio review before public release.'}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection notice if already rejected */}
            {submission.status === 'REJECTED' && submission.rejectionReason && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <FileX2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-xs font-bold text-rose-500">Rejection Feedback Sent:</span>
                  <p className="text-xs leading-tight text-rose-400/90">
                    {submission.rejectionReason}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. AUTOMATED & MANUAL VALIDATION CHECKLIST */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Compliance & Quality Checklist
                </h3>
              </div>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  allChecksPass
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-amber-500/15 text-amber-500'
                )}
              >
                {allChecksPass ? '100% Passed' : 'Action Required'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {/* Check 1: Resolution */}
              <div
                onClick={() => onToggleCheck(submission.id, 'resolutionPass')}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all',
                  checks.resolutionPass
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                    : 'border-rose-500/30 bg-rose-500/5 text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Tv2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">Resolution (1080x1920)</span>
                    <span className="text-[10px] text-muted-foreground">
                      {submission.resolution}
                    </span>
                  </div>
                </div>
                {checks.resolutionPass ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-rose-500" />
                )}
              </div>

              {/* Check 2: Aspect Ratio */}
              <div
                onClick={() => onToggleCheck(submission.id, 'aspectRatioPass')}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all',
                  checks.aspectRatioPass
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                    : 'border-rose-500/30 bg-rose-500/5 text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">Aspect Ratio (9:16)</span>
                    <span className="text-[10px] text-muted-foreground">Vertical Fullscreen</span>
                  </div>
                </div>
                {checks.aspectRatioPass ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-rose-500" />
                )}
              </div>

              {/* Check 3: Audio Cleared */}
              <div
                onClick={() => onToggleCheck(submission.id, 'audioCleared')}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all',
                  checks.audioCleared
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                    : 'border-rose-500/30 bg-rose-500/5 text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Music className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">Audio License / Stems</span>
                    <span className="text-[10px] text-muted-foreground">
                      {submission.audioBitrate || 'Cleared'}
                    </span>
                  </div>
                </div>
                {checks.audioCleared ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-rose-500" />
                )}
              </div>

              {/* Check 4: Policy Compliance */}
              <div
                onClick={() => onToggleCheck(submission.id, 'policyCompliant')}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-xl border p-2.5 transition-all',
                  checks.policyCompliant
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                    : 'border-rose-500/30 bg-rose-500/5 text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold">Brand & Safety Guidelines</span>
                    <span className="text-[10px] text-muted-foreground">No Watermarks</span>
                  </div>
                </div>
                {checks.policyCompliant ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <X className="h-4 w-4 text-rose-500" />
                )}
              </div>
            </div>
          </div>

          {/* 3. ONE-CLICK SPEED MODERATION ACTION DECK */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Moderator Decision Controls
              </span>
              {onOpenShortcuts && (
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <span>Keyboard Hotkeys</span>
                  <span className="py-0.2 rounded bg-muted px-1.5 font-mono text-[10px]">?</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* APPROVE BUTTON (GREEN) */}
              <Button
                type="button"
                onClick={() => onApprove(submission.id)}
                className="h-9 gap-2 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Approve & Publish</span>
                <span className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px]">[A]</span>
              </Button>

              {/* REJECT BUTTON (RED) */}
              <Button
                type="button"
                variant="destructive"
                onClick={() => onRequestReject(submission)}
                className="h-9 gap-2 text-xs font-bold"
              >
                <X className="h-4 w-4" />
                <span>Reject with Reason</span>
                <span className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px]">[R]</span>
              </Button>

              {/* FLAG / UNFLAG BUTTON */}
              <Button
                type="button"
                variant="outline"
                onClick={() => onToggleFlag(submission.id)}
                className={cn(
                  'h-9 gap-2 border text-xs font-bold',
                  submission.isFlagged || submission.status === 'FLAGGED'
                    ? 'border-warning bg-warning/15 text-warning hover:bg-warning/25'
                    : 'border-border text-foreground hover:border-warning/50 hover:bg-muted'
                )}
              >
                <ShieldAlert className="h-4 w-4 text-warning" />
                <span>{submission.isFlagged ? 'Clear Flag' : 'Flag Suspicious'}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">[F]</span>
              </Button>
            </div>
          </div>

          {/* 4. QUEUE QUICK-SCROLLER STRIP */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Queue Timeline ({allSubmissions.length} Items)
              </span>
              <span className="text-[10px]">Click thumbnail to inspect</span>
            </div>

            <div className="scrollbar-thin flex items-center gap-2 overflow-x-auto pb-1">
              {allSubmissions.map((item, idx) => {
                const isSelected = item.id === submission.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSubmission(item.id)}
                    className={cn(
                      'relative h-16 w-11 shrink-0 select-none overflow-hidden rounded-xl border transition-all',
                      isSelected
                        ? 'scale-105 border-primary shadow-md ring-2 ring-primary/50'
                        : 'border-border/70 opacity-70 hover:border-border hover:opacity-100'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />

                    {/* Mini Status Dot */}
                    <div className="absolute right-1 top-1">
                      {item.status === 'APPROVED' && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-black" />
                      )}
                      {item.status === 'REJECTED' && (
                        <div className="h-2 w-2 rounded-full bg-rose-500 ring-1 ring-black" />
                      )}
                      {(item.status === 'FLAGGED' || item.isFlagged) && (
                        <div className="h-2 w-2 animate-ping rounded-full bg-warning ring-1 ring-black" />
                      )}
                      {item.status === 'PENDING_REVIEW' && !item.isFlagged && (
                        <div className="h-2 w-2 rounded-full bg-amber-400 ring-1 ring-black" />
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-black/70 p-0.5 text-center font-mono text-[8px] text-white">
                      #{idx + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
