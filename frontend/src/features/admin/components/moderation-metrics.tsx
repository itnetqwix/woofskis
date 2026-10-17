'use client';

import React from 'react';
import { ChevronRight, Inbox, Layers, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { AdminQueueMetrics, ModerationFilterStatus } from '@/types/admin';
import { cn } from '@/lib/utils';

interface ModerationMetricsProps {
  metrics: AdminQueueMetrics;
  activeFilter: ModerationFilterStatus;
  onFilterSelect: (status: ModerationFilterStatus) => void;
}

export function ModerationMetrics({ metrics, activeFilter, onFilterSelect }: ModerationMetricsProps) {
  const cards: {
    status: ModerationFilterStatus;
    label: string;
    value: number;
    hint: string;
    icon: React.ReactNode;
    valueClassName?: string;
    activeClassName: string;
  }[] = [
    {
      status: 'ALL',
      label: 'All Submissions',
      value: metrics.totalSubmissions,
      hint: 'Show everything',
      icon: <Layers className="h-3.5 w-3.5 text-primary" />,
      activeClassName: 'border-primary bg-primary/10',
    },
    {
      status: 'PENDING_REVIEW',
      label: 'Pending Review',
      value: metrics.pendingCount,
      hint: metrics.pendingCount > 0 ? 'Needs review' : 'Queue clear',
      icon: <Inbox className="h-3.5 w-3.5 text-amber-500" />,
      valueClassName: 'text-amber-500',
      activeClassName: 'border-amber-500 bg-amber-500/10',
    },
    {
      status: 'FLAGGED',
      label: 'Flagged',
      value: metrics.flaggedCount,
      hint: 'Show flagged',
      icon: <ShieldAlert className="h-3.5 w-3.5 text-warning" />,
      valueClassName: 'text-warning',
      activeClassName: 'border-warning bg-warning/10',
    },
    {
      status: 'APPROVED',
      label: 'Approved Today',
      value: metrics.approvedToday,
      hint: 'Show approved',
      icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />,
      valueClassName: 'text-emerald-500',
      activeClassName: 'border-emerald-500 bg-emerald-500/10',
    },
    {
      status: 'REJECTED',
      label: 'Rejected Today',
      value: metrics.rejectedToday,
      hint: 'Show rejected',
      icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
      valueClassName: 'text-rose-500',
      activeClassName: 'border-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, index) => {
        const isActive = activeFilter === card.status;
        return (
          <button
            key={card.status}
            type="button"
            onClick={() => onFilterSelect(card.status)}
            aria-pressed={isActive}
            className={cn(
              'block w-full space-y-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              index === 0 && 'col-span-2 sm:col-span-1',
              isActive
                ? card.activeClassName
                : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              {card.icon}
            </div>
            <div className={cn('font-mono text-xl font-black leading-tight', card.valueClassName)}>
              {card.value}
            </div>
            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <span className="truncate">{card.hint}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </p>
          </button>
        );
      })}
    </div>
  );
}
