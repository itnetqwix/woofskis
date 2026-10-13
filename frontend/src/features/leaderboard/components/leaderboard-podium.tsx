'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Star,
  Play,
  BadgeCheck,
  Radio,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Users,
} from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { initials } from '@/lib/initials';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LeaderboardPodiumProps {
  items: LeaderboardItem[];
  onOpenPreview: (item: LeaderboardItem) => void;
}

export function LeaderboardPodium({ items, onOpenPreview }: LeaderboardPodiumProps) {
  if (items.length === 0) return null;

  const rank1 = items.find((i) => i.rank === 1) || items[0];
  const rank2 = items.find((i) => i.rank === 2) || items[1];
  const rank3 = items.find((i) => i.rank === 3) || items[2];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Top 3 Winner Podium & Prize Allocation
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">Live Community Consensus Scores</span>
      </div>

      {/* PODIUM 3-COLUMN DECK (ORDER ON DESKTOP: RANK 2, RANK 1, RANK 3) */}
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3 lg:gap-6">
        {/* ======================================================== */}
        {/* RANK #2 (SILVER) - LEFT COLUMN */}
        {/* ======================================================== */}
        {rank2 && (
          <div className="order-2 flex flex-col items-center md:order-1">
            <div
              onClick={() => onOpenPreview(rank2)}
              className="group relative flex min-h-[380px] w-full cursor-pointer select-none flex-col justify-between rounded-3xl border border-slate-400/40 bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-400/10"
            >
              {/* Silver Subtle Ambient Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-slate-400/10 via-transparent to-transparent opacity-60" />

              {/* Top Medal & Rank Row */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-300 font-black text-slate-900 shadow-sm">
                    <Medal className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black leading-tight text-slate-300">
                      RANK #2
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">Runner-Up</span>
                  </div>
                </div>

                <span className="rounded-full border border-slate-300/40 bg-slate-300/15 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-200">
                  $7,500 USD
                </span>
              </div>

              {/* 9:16 Video Thumbnail Box */}
              <div className="relative my-3.5 aspect-[9/12] w-full overflow-hidden rounded-2xl border border-border/80 bg-black transition-colors group-hover:border-slate-300/60">
                {rank2.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rank2.thumbnailUrl}
                    alt={rank2.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-slate-300 group-hover:text-black">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </div>
                </div>

                {/* Bottom Thumbnail Overlay */}
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between font-mono text-[10px] text-white">
                  <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                    {rank2.category}
                  </span>
                  <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                    {rank2.durationSeconds}s
                  </span>
                </div>
              </div>

              {/* Creator & Score Footer */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-slate-300/50">
                    {rank2.creatorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rank2.creatorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#13491e] text-[9px] font-bold text-white">
                        {initials(rank2.creatorName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <span className="truncate">{rank2.creatorName}</span>
                      {rank2.creatorVerified && (
                        <BadgeCheck className="h-3 w-3 shrink-0 text-blue-400" />
                      )}
                    </div>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {rank2.creatorHandle}
                    </span>
                  </div>
                </div>

                <p className="line-clamp-1 text-xs font-bold text-foreground">{rank2.title}</p>

                {/* Score & Vote Stats */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono font-bold text-foreground">
                      {rank2.communityScore.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/5.0</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{rank2.totalVotes} votes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Podium Pedestal */}
            <div className="hidden h-12 w-full items-center justify-center rounded-b-2xl border-x border-b border-t-0 border-slate-400/30 bg-gradient-to-b from-slate-400/10 to-card text-sm font-black text-slate-300 md:flex">
              2nd Place
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RANK #1 (GOLD) - CENTER RAISED COLUMN */}
        {/* ======================================================== */}
        {rank1 && (
          <div className="order-1 flex flex-col items-center md:order-2">
            <div
              onClick={() => onOpenPreview(rank1)}
              className="group relative flex min-h-[440px] w-full cursor-pointer select-none flex-col justify-between rounded-3xl border-2 border-amber-500 bg-card p-5 ring-4 ring-amber-500/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20"
            >
              {/* Gold Ambient Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-500/15 via-transparent to-transparent opacity-80" />

              {/* Crown Top Floating Icon */}
              <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-md">
                <Crown className="h-3 w-3 fill-black" />
                <span>Champion Leader</span>
              </div>

              {/* Top Trophy & Prize Row */}
              <div className="relative z-10 flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 font-black text-black shadow-md shadow-amber-500/30">
                    <Crown className="h-5 w-5 fill-black" />
                  </div>
                  <div>
                    <span className="block text-sm font-black leading-tight text-amber-400">
                      RANK #1
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Grand Champion
                    </span>
                  </div>
                </div>

                <span className="shadow-xs rounded-full border border-amber-500/50 bg-amber-500/20 px-3 py-1 font-mono text-sm font-black text-amber-400">
                  $12,500 USD
                </span>
              </div>

              {/* 9:16 Video Thumbnail Box */}
              <div className="relative my-3.5 aspect-[9/12] w-full overflow-hidden rounded-2xl border border-amber-500/40 bg-black shadow-inner transition-colors group-hover:border-amber-400">
                {rank1.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rank1.thumbnailUrl}
                    alt={rank1.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-black">
                    <Play className="ml-1 h-6 w-6 fill-current" />
                  </div>
                </div>

                {/* Category & Duration */}
                <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between font-mono text-[11px] text-white">
                  <span className="rounded border border-white/10 bg-black/70 px-2 py-0.5 font-sans font-semibold backdrop-blur-sm">
                    {rank1.category}
                  </span>
                  <span className="rounded border border-white/10 bg-black/70 px-2 py-0.5 backdrop-blur-sm">
                    {rank1.durationSeconds}s
                  </span>
                </div>
              </div>

              {/* Creator & Score Footer */}
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 border-amber-400">
                    {rank1.creatorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rank1.creatorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#13491e] text-[9px] font-bold text-white">
                        {initials(rank1.creatorName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                      <span className="truncate">{rank1.creatorName}</span>
                      {rank1.creatorVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      )}
                    </div>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {rank1.creatorHandle}
                    </span>
                  </div>
                </div>

                <p className="line-clamp-1 text-sm font-black text-foreground">{rank1.title}</p>

                {/* Score & Vote Stats */}
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-mono text-sm font-black text-amber-400">
                      {rank1.communityScore.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/5.0</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{rank1.totalVotes} votes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Center Podium Pedestal */}
            <div className="hidden h-20 w-full items-center justify-center rounded-b-2xl border-x-2 border-b-2 border-t-0 border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-card text-base font-black text-amber-400 shadow-sm md:flex">
              1st Place Winner
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RANK #3 (BRONZE) - RIGHT COLUMN */}
        {/* ======================================================== */}
        {rank3 && (
          <div className="order-3 flex flex-col items-center md:order-3">
            <div
              onClick={() => onOpenPreview(rank3)}
              className="group relative flex min-h-[350px] w-full cursor-pointer select-none flex-col justify-between rounded-3xl border border-amber-700/40 bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber-600 hover:shadow-xl hover:shadow-amber-700/10"
            >
              {/* Bronze Subtle Ambient Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-700/10 via-transparent to-transparent opacity-60" />

              {/* Top Award & Rank Row */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700 font-black text-white shadow-sm">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black leading-tight text-amber-600">
                      RANK #3
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      3rd Finalist
                    </span>
                  </div>
                </div>

                <span className="rounded-full border border-amber-700/40 bg-amber-700/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-500">
                  $5,000 USD
                </span>
              </div>

              {/* 9:16 Video Thumbnail Box */}
              <div className="relative my-3.5 aspect-[9/12] w-full overflow-hidden rounded-2xl border border-border/80 bg-black transition-colors group-hover:border-amber-600/60">
                {rank3.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rank3.thumbnailUrl}
                    alt={rank3.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </div>
                </div>

                {/* Bottom Thumbnail Overlay */}
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between font-mono text-[10px] text-white">
                  <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                    {rank3.category}
                  </span>
                  <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">
                    {rank3.durationSeconds}s
                  </span>
                </div>
              </div>

              {/* Creator & Score Footer */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-amber-700/50">
                    {rank3.creatorAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rank3.creatorAvatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#13491e] text-[9px] font-bold text-white">
                        {initials(rank3.creatorName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <span className="truncate">{rank3.creatorName}</span>
                      {rank3.creatorVerified && (
                        <BadgeCheck className="h-3 w-3 shrink-0 text-blue-400" />
                      )}
                    </div>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {rank3.creatorHandle}
                    </span>
                  </div>
                </div>

                <p className="line-clamp-1 text-xs font-bold text-foreground">{rank3.title}</p>

                {/* Score & Vote Stats */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono font-bold text-foreground">
                      {rank3.communityScore.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/5.0</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{rank3.totalVotes} votes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Podium Pedestal */}
            <div className="hidden h-8 w-full items-center justify-center rounded-b-2xl border-x border-b border-t-0 border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-card text-xs font-black text-amber-600 md:flex">
              3rd Place
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
