import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SubmissionStatus } from '@/types/creator';
import { cn } from '@/lib/utils';

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SubmissionStatusBadge({
  status,
  size = 'default',
  showIcon = true,
  className,
  onClick,
}: SubmissionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'In Contest (Live)',
          icon: CheckCircle2,
          wrapperClass: 'border-success/30 bg-success/10 text-success shadow-sm shadow-success/5',
          dotClass: 'bg-success animate-pulse',
        };
      case 'PENDING_REVIEW':
        return {
          label: 'Pending Moderation',
          icon: Clock,
          wrapperClass: 'border-warning/30 bg-warning/10 text-warning shadow-sm shadow-warning/5',
          dotClass: 'bg-warning animate-ping',
        };
      case 'REJECTED':
        return {
          label: 'Action Required',
          icon: AlertCircle,
          wrapperClass:
            'border-destructive/30 bg-destructive/10 text-destructive shadow-sm shadow-destructive/5',
          dotClass: 'bg-destructive',
        };
      default:
        return {
          label: status,
          icon: Clock,
          wrapperClass: 'border-muted-foreground/30 bg-muted text-muted-foreground',
          dotClass: 'bg-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    default: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex select-none items-center rounded-full border font-medium transition-colors',
        config.wrapperClass,
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-85',
        className
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', iconSizes[size])} />}
      <span>{config.label}</span>
    </span>
  );
}
