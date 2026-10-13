'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Zap,
  AlertTriangle,
  XCircle,
  Inbox,
  TrendingUp,
} from 'lucide-react';
import { AdminQueueMetrics, ModerationFilterStatus } from '@/types/admin';
import { cn } from '@/lib/utils';

interface ModerationMetricsProps {
  metrics: AdminQueueMetrics;
  activeFilter: ModerationFilterStatus;
  onFilterSelect: (status: ModerationFilterStatus) => void;
  onOpenAuditLogs?: () => void;
}

export function ModerationMetrics({
  metrics,
  activeFilter,
  onFilterSelect,
  onOpenAuditLogs,
}: ModerationMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. PENDING QUEUE */}
      <div
        onClick={() => onFilterSelect('PENDING_REVIEW')}
        className={cn(
          'group relative flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md',
          activeFilter === 'PENDING_REVIEW'
            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20 ring-1 ring-primary/40'
            : 'border-border/70 bg-card/80 hover:border-primary/40 hover:bg-card'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pending Queue
          </span>
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              metrics.pendingCount > 0
                ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Inbox className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-muted-foreground">entries</span>
          </div>

          {metrics.pendingCount > 0 ? (
            <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
              Needs Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
              Queue Clear
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3 text-muted-foreground/70" />
          <span>Avg wait: &lt; 2.5 mins</span>
        </div>
      </div>

      {/* 2. APPROVED TODAY */}
      <div
        onClick={() => onFilterSelect('APPROVED')}
        className={cn(
          'group relative flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md',
          activeFilter === 'APPROVED'
            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/40'
            : 'border-border/70 bg-card/80 hover:border-emerald-500/40 hover:bg-card'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Approved Today
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30 transition-transform group-hover:scale-110">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-emerald-500 sm:text-3xl">
              {metrics.approvedToday}
            </span>
            <span className="text-xs text-muted-foreground">live</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
            <TrendingUp className="h-2.5 w-2.5" />
            +100% Valid
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Active in public voting</span>
        </div>
      </div>

      {/* 3. REJECTED TODAY */}
      <div
        onClick={() => onFilterSelect('REJECTED')}
        className={cn(
          'group relative flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md',
          activeFilter === 'REJECTED'
            ? 'border-rose-500 bg-rose-500/10 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/40'
            : 'border-border/70 bg-card/80 hover:border-rose-500/40 hover:bg-card'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Rejected Today
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30 transition-transform group-hover:scale-110">
            <XCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-rose-500 sm:text-3xl">
              {metrics.rejectedToday}
            </span>
            <span className="text-xs text-muted-foreground">rejections</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
            Feedback Sent
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Action required by creator</span>
        </div>
      </div>

      {/* 4. AVERAGE REVIEW VELOCITY */}
      <div
        onClick={onOpenAuditLogs}
        className="group relative flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-4 transition-all duration-200 hover:border-blue-500/40 hover:bg-card hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Review Velocity
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/30 transition-transform group-hover:scale-110">
            <Zap className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-blue-500 sm:text-3xl">—</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Review time is not measured</span>
        </div>
      </div>

      {/* 5. FLAGGED & SUSPICIOUS */}
      <div
        onClick={() => onFilterSelect('FLAGGED')}
        className={cn(
          'group relative col-span-2 flex cursor-pointer select-none flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:shadow-md sm:col-span-1',
          activeFilter === 'FLAGGED'
            ? 'border-warning bg-warning/10 shadow-sm shadow-warning/20 ring-1 ring-warning/40'
            : 'border-border/70 bg-card/80 hover:border-warning/40 hover:bg-card'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Flagged Items
          </span>
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              metrics.flaggedCount > 0
                ? 'animate-pulse bg-warning/15 text-warning ring-1 ring-warning/30'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-warning sm:text-3xl">
              {metrics.flaggedCount}
            </span>
            <span className="text-xs text-muted-foreground">flagged</span>
          </div>

          {metrics.flaggedCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
              <AlertTriangle className="h-2.5 w-2.5" />
              AI Risk Alert
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              0 Flags
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>Audio / Watermark triggers</span>
        </div>
      </div>
    </div>
  );
}
