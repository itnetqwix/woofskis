'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  X,
  Sparkles,
  Info,
  CheckCircle2,
  FileWarning,
  Flame,
  Radio,
  Building,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  TenantBrandConfig,
  WarningSeverity,
  WarningReasonCode,
  WarningDeadline,
} from '@/types/tenant';
import { cn } from '@/lib/utils';

interface IssueWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: TenantBrandConfig[];
  selectedBrandId?: string;
  onIssueWarning: (payload: {
    tenantId: string;
    brandName: string;
    severity: WarningSeverity;
    reasonCode: WarningReasonCode;
    message: string;
    deadline: WarningDeadline;
  }) => void;
}

const SEVERITY_OPTIONS: {
  value: WarningSeverity;
  label: string;
  badge: string;
  colorClass: string;
  borderClass: string;
  bgActive: string;
  desc: string;
}[] = [
  {
    value: 'LOW',
    label: 'Low Advisory',
    badge: 'LOW (Advisory)',
    colorClass: 'text-sky-400',
    borderClass: 'border-sky-500/30 hover:border-sky-500/60',
    bgActive: 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500/40',
    desc: 'Informational notice regarding non-critical metadata or minor asset recommendations.',
  },
  {
    value: 'MEDIUM',
    label: 'Medium Warning',
    badge: 'MEDIUM (Action Required)',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    bgActive: 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40',
    desc: 'Notice requiring tenant administrator remediation within 48 hours to avoid escalation.',
  },
  {
    value: 'HIGH',
    label: 'High (Urgent)',
    badge: 'HIGH (Urgent Action Required)',
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/30 hover:border-rose-500/60',
    bgActive: 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500/40',
    desc: 'Critical compliance violation. Failure to resolve will trigger tenant access suspension.',
  },
];

const REASON_OPTIONS: {
  value: WarningReasonCode;
  label: string;
  sub: string;
}[] = [
  {
    value: 'COPYRIGHT_INFRINGEMENT',
    label: 'Copyright & Audio Infringement',
    sub: 'Unlicensed music, DMCA flag, or stolen media in submissions.',
  },
  {
    value: 'PROHIBITED_SPONSOR',
    label: 'Prohibited Sponsor / Restricted Entity',
    sub: 'Unapproved betting, tobacco, or restricted commercial entity.',
  },
  {
    value: 'FRAUD_DETECTED',
    label: 'Fraud & Vote Manipulation',
    sub: 'Bot traffic, sybil voter clusters, or prize manipulation detected.',
  },
  {
    value: 'TERMS_OF_SERVICE',
    label: 'Terms of Service Violation',
    sub: 'Content safety breach, age verification failure, or policy bypass.',
  },
];

const QUICK_PRESETS: {
  label: string;
  text: string;
  reason: WarningReasonCode;
  severity: WarningSeverity;
  deadline: WarningDeadline;
}[] = [
  {
    label: 'Copyright Audio Flag',
    text: 'Contest #rip_01 contains copyrighted audio watermark. Remove the submission within 24 hours to prevent escrow payment freeze.',
    reason: 'COPYRIGHT_INFRINGEMENT',
    severity: 'HIGH',
    deadline: '24h',
  },
  {
    label: 'Prohibited Sponsor Watermark',
    text: 'Prohibited third-party commercial sponsor watermark detected in contest banner asset. Replace asset to comply with platform brand safety standards.',
    reason: 'PROHIBITED_SPONSOR',
    severity: 'MEDIUM',
    deadline: '48h',
  },
  {
    label: 'Vote Velocity Anomaly',
    text: 'Consensus engine telemetry flagged anomalous automated voting velocity in top 3 submissions. Immediate moderator review requested.',
    reason: 'FRAUD_DETECTED',
    severity: 'HIGH',
    deadline: 'immediate',
  },
  {
    label: 'Terms of Service Review',
    text: 'Contest rules description lacks mandatory age restriction clause and terms of eligibility. Update description promptly.',
    reason: 'TERMS_OF_SERVICE',
    severity: 'LOW',
    deadline: '48h',
  },
];

export function IssueWarningModal({
  open,
  onOpenChange,
  brands,
  selectedBrandId,
  onIssueWarning,
}: IssueWarningModalProps) {
  const [tenantId, setTenantId] = useState<string>(selectedBrandId || brands[0]?.id || 'woofskis');
  const [severity, setSeverity] = useState<WarningSeverity>('HIGH');
  const [reasonCode, setReasonCode] = useState<WarningReasonCode>('COPYRIGHT_INFRINGEMENT');
  const [message, setMessage] = useState<string>(
    'Contest #rip_01 contains copyrighted audio watermark. Remove the submission within 24 hours to avoid tenant suspension.'
  );
  const [deadline, setDeadline] = useState<WarningDeadline>('24h');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync selected brand when modal opens
  useEffect(() => {
    if (selectedBrandId) {
      setTenantId(selectedBrandId);
    } else if (brands.length > 0 && !tenantId) {
      setTenantId(brands[0].id);
    }
  }, [selectedBrandId, brands, tenantId, open]);

  const currentBrand = brands.find((b) => b.id === tenantId || b.slug === tenantId) || brands[0];

  const handleApplyPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    setMessage(preset.text);
    setReasonCode(preset.reason);
    setSeverity(preset.severity);
    setDeadline(preset.deadline);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      setValidationError('Please provide a specific warning message (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      onIssueWarning({
        tenantId,
        brandName: currentBrand?.name || tenantId,
        severity,
        reasonCode,
        message: message.trim(),
        deadline,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-rose-500/30 bg-card/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl">
        {/* TOP ACCENT HEADER */}
        <div className="relative border-b border-rose-500/20 bg-rose-500/10 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-400 shadow-md shadow-rose-500/20">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight text-foreground">
                Issue Compliance Warning Notice
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Super Admin cross-tenant governance: Dispatch official regulatory warning directly
                to Brand Admin dashboard.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
          {/* 1. TARGET BRAND SELECTION */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Building className="h-3.5 w-3.5 text-primary" />
              <span>Target Brand Tenant</span>
            </label>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {brands.map((b) => {
                const isSelected = b.id === tenantId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setTenantId(b.id);
                      setValidationError(null);
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                      isSelected
                        ? 'shadow-xs border-rose-500/60 bg-rose-500/10 ring-1 ring-rose-500/40'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40'
                    )}
                  >
                    <div
                      className="h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-white/20"
                      style={{ backgroundColor: b.colors.primary }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png'}
                        alt={b.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <span
                        className={cn(
                          'block truncate text-xs font-bold',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {b.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        {b.customDomain}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SEVERITY LEVEL */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Severity Level</span>
            </label>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={cn(
                      'space-y-1 rounded-xl border p-3 text-left transition-all',
                      isSelected
                        ? opt.bgActive
                        : cn('border-border/60 bg-muted/20 text-muted-foreground', opt.borderClass)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-bold', opt.colorClass)}>{opt.label}</span>
                      {isSelected && <CheckCircle2 className={cn('h-3.5 w-3.5', opt.colorClass)} />}
                    </div>
                    <p className="text-[10px] leading-tight text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. REASON CODE */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <FileWarning className="h-3.5 w-3.5 text-amber-400" />
              <span>Violation Reason Code</span>
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REASON_OPTIONS.map((r) => {
                const isSelected = reasonCode === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReasonCode(r.value)}
                    className={cn(
                      'rounded-xl border p-2.5 text-left transition-all',
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border'
                    )}
                  >
                    <span
                      className={cn(
                        'block text-xs font-bold',
                        isSelected ? 'text-amber-400' : 'text-foreground'
                      )}
                    >
                      {r.label}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {r.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK TEMPLATE CHIPS */}
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Quick Template Presets:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-primary"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. CUSTOM MESSAGE TEXTAREA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Compliance Notice Message
              </label>
              <span className="font-mono text-[10px] text-muted-foreground">
                {message.length} characters
              </span>
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Contest #rip_01 contains copyrighted audio watermark. Remove the submission within 24 hours."
              className={cn(
                'w-full resize-none rounded-xl border bg-background/80 p-3 text-xs text-foreground transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/50',
                validationError ? 'border-rose-500/80 ring-1 ring-rose-500' : 'border-border/70'
              )}
            />
            {validationError && (
              <p className="text-[11px] font-bold text-rose-400 animate-in fade-in">
                {validationError}
              </p>
            )}
          </div>

          {/* 5. ACTION DEADLINE */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Remediation Action Deadline</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '24h', label: '24 Hours', sub: 'Standard Remedy Window' },
                { value: '48h', label: '48 Hours', sub: 'Extended Grace Period' },
                { value: 'immediate', label: 'Immediate (6h)', sub: 'Urgent Intervention' },
              ].map((d) => {
                const isSelected = deadline === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDeadline(d.value as WarningDeadline)}
                    className={cn(
                      'rounded-xl border p-2.5 text-center transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary/40'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border'
                    )}
                  >
                    <span className="block text-xs font-bold">{d.label}</span>
                    <span className="block text-[9px] text-muted-foreground">{d.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3 border-t border-border/60 pt-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 bg-destructive text-xs font-bold text-white shadow-lg shadow-destructive/25 hover:bg-destructive/90"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Dispatch Warning Notice</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
