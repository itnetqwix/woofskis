import React from 'react';
import {
  Video,
  CheckCircle2,
  Clock,
  Star,
  Trophy,
  TrendingUp,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { CreatorMetrics } from '@/types/creator';
import { cn } from '@/lib/utils';

interface CreatorMetricsCardsProps {
  metrics: CreatorMetrics;
  onFilterStatusSelect?: (status: 'ALL' | 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED') => void;
  className?: string;
}

export function CreatorMetricsCards({
  metrics,
  onFilterStatusSelect,
  className,
}: CreatorMetricsCardsProps) {
  const cards = [
    {
      id: 'total',
      label: 'Total Submissions',
      value: metrics.totalSubmissions,
      subtext: `${metrics.approvedCount} approved · ${metrics.pendingCount} pending`,
      icon: Video,
      gradient: 'from-primary/20 via-primary/5 to-transparent',
      borderColor: 'group-hover:border-primary/50',
      iconBg: 'bg-primary/10 text-primary',
      action: () => onFilterStatusSelect?.('ALL'),
    },
    {
      id: 'approved',
      label: 'Live in Contest',
      value: metrics.approvedCount,
      subtext: `${metrics.approvalRate}% approval rate`,
      icon: CheckCircle2,
      badge: 'Live',
      badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
      action: () => onFilterStatusSelect?.('APPROVED'),
    },
    {
      id: 'pending',
      label: 'Pending Moderation',
      value: metrics.pendingCount,
      subtext: 'Est. turnaround: 2-4 hrs',
      icon: Clock,
      badge: metrics.pendingCount > 0 ? 'Reviewing' : undefined,
      badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
      action: () => onFilterStatusSelect?.('PENDING_REVIEW'),
    },
    {
      id: 'score',
      label: 'Avg Community Score',
      value: metrics.averageScore > 0 ? `${metrics.averageScore.toFixed(1)} / 10` : 'N/A',
      subtext: `${metrics.totalVotesReceived} total community votes`,
      icon: Star,
      gradient: 'from-yellow-500/20 via-amber-500/5 to-transparent',
      borderColor: 'group-hover:border-yellow-500/50',
      iconBg: 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400',
      action: () => onFilterStatusSelect?.('APPROVED'),
    },
    {
      id: 'rank',
      label: 'Active Best Rank',
      value: metrics.bestRank ? `#${metrics.bestRank}` : 'Top 10%',
      subtext: metrics.bestRank ? 'Comedy & Short Challenge' : 'Pending more votes',
      icon: Trophy,
      badge: metrics.bestRank && metrics.bestRank <= 5 ? 'Top 5' : undefined,
      badgeClass: 'bg-primary/15 text-primary border-primary/30',
      gradient: 'from-accent/20 via-primary/10 to-transparent',
      borderColor: 'group-hover:border-accent/50',
      iconBg: 'bg-accent/15 text-foreground dark:text-accent',
      action: undefined,
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5', className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.action}
            role={card.action ? 'button' : undefined}
            tabIndex={card.action ? 0 : undefined}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all duration-300',
              'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
              card.action && 'cursor-pointer'
            )}
          >
            {/* Top glowing ambient gradient */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-40 transition-opacity duration-300 group-hover:opacity-80',
                card.gradient
              )}
            />

            <div className="relative z-10 flex h-full flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.iconBg)}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {card.badge && (
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      card.badgeClass
                    )}
                  >
                    {card.badge}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                  {card.subtext}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
