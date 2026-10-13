'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileWarning,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  X,
  MessageSquare,
} from 'lucide-react';
import { useTenantCompliance } from '@/features/admin/hooks/use-tenant-compliance';
import { useAuthSession } from '@/features/auth/hooks/use-auth-session';
import { useTenantTheme } from '@/features/admin/hooks/use-tenant-theme';
import { getReasonLabel, formatTimeRemaining, getSeverityStyles } from '@/lib/compliance-utils';
import { TenantComplianceWarning } from '@/types/tenant';
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

interface BrandComplianceBannerProps {
  tenantId?: string;
  className?: string;
}

export function BrandComplianceBanner({
  tenantId: propTenantId,
  className,
}: BrandComplianceBannerProps) {
  const { user } = useAuthSession();
  const { activeBrand } = useTenantTheme();

  // Determine effective tenant context: prop > user tenantId > activeBrand.id
  const effectiveTenantId =
    propTenantId ||
    (user?.role === 'PLATFORM_ADMIN' ? activeBrand?.id : user?.tenantId || activeBrand?.id);

  const { activeWarnings, resolveWarning } = useTenantCompliance(effectiveTenantId);

  // Selected warning for resolution dialog
  const [resolvingWarning, setResolvingWarning] = useState<TenantComplianceWarning | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());

  // Update ticker every minute for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!activeWarnings || activeWarnings.length === 0) {
    return null;
  }

  // Display the highest priority warning first (HIGH > MEDIUM > LOW)
  const sortedWarnings = [...activeWarnings].sort((a, b) => {
    const order: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (order[b.severity] || 0) - (order[a.severity] || 0);
  });

  const primaryWarning = sortedWarnings[0];
  const severityStyles = getSeverityStyles(primaryWarning.severity);
  const timeRemaining = formatTimeRemaining(primaryWarning.deadlineTimestamp);

  const handleOpenResolve = (warning: TenantComplianceWarning) => {
    setResolvingWarning(warning);
    setResolutionNotes(
      'Offending asset removed and submission queue re-verified against compliance standards.'
    );
  };

  const handleConfirmResolve = () => {
    if (!resolvingWarning) return;

    resolveWarning(resolvingWarning.id, resolutionNotes, user?.email || 'admin@brand.com');

    setResolvingWarning(null);
    setToastMessage(
      `Compliance notice #${resolvingWarning.id.slice(-6)} marked as resolved. Super Admin governance updated.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <>
      {/* SUCCESS TOAST FEEDBACK */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-400 shadow-lg backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400/80 hover:text-emerald-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* PROMINENT GLASSMORPHIC ALERT BANNER */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all sm:p-5',
          severityStyles.cardBorder,
          className
        )}
      >
        {/* Glowing Background Radial */}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl',
            severityStyles.glow
          )}
        />

        <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          {/* LEFT: ICON + BADGES + MESSAGE */}
          <div className="flex max-w-3xl items-start gap-3.5">
            <div className="relative mt-0.5 shrink-0">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border shadow-md',
                  severityStyles.badgeBg
                )}
              >
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </span>
              <span
                className={cn(
                  'absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full',
                  severityStyles.pulseColor
                )}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                    severityStyles.badgeBg
                  )}
                >
                  {primaryWarning.severity} SEVERITY NOTICE
                </span>

                <span className="flex items-center gap-1 rounded-full border border-border/80 bg-background/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  <FileWarning className="h-3 w-3 text-amber-400" />
                  <span>{getReasonLabel(primaryWarning.reasonCode)}</span>
                </span>

                <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  <Clock className="h-3 w-3" />
                  <span>{timeRemaining}</span>
                </span>

                {activeWarnings.length > 1 && (
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    +{activeWarnings.length - 1} more notice
                  </span>
                )}
              </div>

              {/* Warning Content */}
              <p className="text-xs font-semibold leading-relaxed text-foreground sm:text-sm">
                {primaryWarning.message}
              </p>

              {/* Sub-meta */}
              <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <span>Issued by Super Admin ({primaryWarning.issuedBy})</span>
                <span>•</span>
                <span>Tenant: {primaryWarning.brandName}</span>
                <span>•</span>
                <span>ID: #{primaryWarning.id.slice(-6)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: RESOLUTION ACTION BUTTON */}
          <div className="flex shrink-0 items-center gap-2.5 self-start lg:self-center">
            <Button
              size="sm"
              onClick={() => handleOpenResolve(primaryWarning)}
              className={cn(
                'h-9 gap-1.5 text-xs font-bold shadow-md transition-all',
                primaryWarning.severity === 'HIGH'
                  ? 'bg-destructive text-white shadow-destructive/25 hover:bg-destructive/90'
                  : 'bg-warning text-foreground shadow-warning/25 hover:bg-warning/90'
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Acknowledge & Mark Resolved</span>
            </Button>
          </div>
        </div>
      </div>

      {/* RESOLUTION CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(resolvingWarning)}
        onOpenChange={(open) => !open && setResolvingWarning(null)}
      >
        <DialogContent className="max-w-md border-border bg-card text-foreground shadow-2xl backdrop-blur-2xl">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-black">
                Confirm Compliance Remediation
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Acknowledge this compliance warning and log resolution notes for the Super Admin
              governance audit trail.
            </DialogDescription>
          </DialogHeader>

          {resolvingWarning && (
            <div className="space-y-3.5 py-2">
              <div className="space-y-1 rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-muted-foreground">Violation Code:</span>
                  <span className="font-bold text-amber-400">{resolvingWarning.reasonCode}</span>
                </div>
                <div className="line-clamp-2 text-[11px] text-muted-foreground">
                  {resolvingWarning.message}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Resolution & Remedy Notes</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe corrective steps taken (e.g. video removed, sponsor watermark cropped)..."
                  className="w-full resize-none rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResolvingWarning(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResolve}
              className="gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Submit Resolution</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
