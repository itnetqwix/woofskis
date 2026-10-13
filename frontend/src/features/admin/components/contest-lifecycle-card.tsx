'use client';

import React, { useState } from 'react';
import {
  Flame,
  Radio,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Trophy,
  Crown,
  Medal,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ContestLifecycleState } from '@/types/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ContestLifecycleCardProps {
  lifecycleState: ContestLifecycleState;
  onStateChange: (state: ContestLifecycleState) => void;
  onTogglePause: () => void;
}

export function ContestLifecycleCard({
  lifecycleState,
  onStateChange,
  onTogglePause,
}: ContestLifecycleCardProps) {
  const [pauseModalOpen, setPauseModalOpen] = useState<boolean>(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState<boolean>(false);

  const isPaused = lifecycleState === 'PAUSED';

  // Mock Top 3 Leaderboard Contenders
  const topContenders = [
    {
      rank: 1,
      name: 'Elena Rostova',
      handle: '@speed_alps',
      score: 4.8,
      votes: 238,
      avatar:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
    {
      rank: 2,
      name: 'Kai Tanaka',
      handle: '@cyberdrift',
      score: 4.8,
      votes: 238,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    {
      rank: 3,
      name: 'Zack Miller',
      handle: '@zack_rolls',
      score: 4.7,
      votes: 185,
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 1. CONTEST LIFECYCLE & EMERGENCY ACTION HUB */}
      <div className="shadow-xs space-y-4 rounded-2xl border border-border/80 bg-card p-5 lg:col-span-7">
        <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-3.5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/40 bg-primary text-white shadow-md shadow-primary/20">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-foreground">
                  Woofskis Pet Video Challenge
                </h3>
                {/* Lifecycle Badge */}
                {lifecycleState === 'ACTIVE' && (
                  <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                    <Radio className="h-2.5 w-2.5" /> ACTIVE
                  </span>
                )}
                {lifecycleState === 'PAUSED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    <PauseCircle className="h-2.5 w-2.5" /> SUBMISSIONS PAUSED
                  </span>
                )}
                {lifecycleState === 'PENDING_RESULTS' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    CALCULATING WINNERS
                  </span>
                )}
                {lifecycleState === 'CLOSED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Season 01: Summer Horizon • $25,000 USD Prize Pool • 428 Submissions
              </p>
            </div>
          </div>

          {/* Quick Emergency Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isPaused ? (
              <Button
                size="sm"
                onClick={onTogglePause}
                className="h-8 gap-1.5 bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Resume Contest</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPauseModalOpen(true)}
                className="h-8 gap-1.5 border-amber-500/40 text-xs font-bold text-amber-500 hover:bg-amber-500/10"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                <span>Pause Intake</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSuspendModalOpen(true)}
              className="h-8 gap-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Emergency</span>
            </Button>
          </div>
        </div>

        {/* State description bar */}
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-muted-foreground">
              Submission Window
            </span>
            <span className="font-semibold text-foreground">Open (3d 18h remaining)</span>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-muted-foreground">
              Automated Ingestion Rate
            </span>
            <span className="font-semibold text-foreground">~42 entries / hour</span>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-2.5">
            <span className="block text-[10px] font-bold uppercase text-muted-foreground">
              Consensus Threshold
            </span>
            <span className="font-semibold text-foreground">50+ community votes/item</span>
          </div>
        </div>
      </div>

      {/* 2. LEADERBOARD & WINNER SELECTION TEASER */}
      <div className="shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Winner Consensus Teaser
            </h3>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
            Top 3 Leaders
          </span>
        </div>

        <div className="space-y-2">
          {topContenders.map((c) => (
            <div
              key={c.rank}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black',
                    c.rank === 1 && 'border border-amber-500/40 bg-amber-500/20 text-amber-500',
                    c.rank === 2 && 'border border-slate-400/40 bg-slate-400/20 text-slate-300',
                    c.rank === 3 && 'border border-orange-600/40 bg-orange-600/20 text-orange-400'
                  )}
                >
                  {c.rank === 1 ? <Crown className="h-3.5 w-3.5" /> : `#${c.rank}`}
                </div>

                <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0">
                  <span className="block truncate font-bold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.handle}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="text-right font-mono">
                  <span className="font-bold text-amber-500">{c.score}</span>
                  <span className="text-[10px] text-muted-foreground">/5.0</span>
                </div>
                <span className="text-[10px] text-muted-foreground">({c.votes} votes)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAUSE CONFIRMATION MODAL */}
      <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Pause Contest Submissions?</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-xs text-muted-foreground">
              Pausing intake will temporarily disable new video uploads in Creator Studio while
              keeping current active entries available for voting and moderation review.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setPauseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 font-bold text-white hover:bg-amber-500"
              onClick={() => {
                onTogglePause();
                setPauseModalOpen(false);
              }}
            >
              Confirm Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMERGENCY SUSPENSION MODAL */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold">Emergency Contest Suspension</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-xs text-muted-foreground">
              This action immediately locks all submission intake, freezes public voting scoring
              algorithms, and notifies security administrators.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="font-bold"
              onClick={() => {
                onStateChange('PAUSED');
                setSuspendModalOpen(false);
              }}
            >
              Confirm Emergency Lock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
