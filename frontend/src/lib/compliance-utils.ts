import { TenantComplianceWarning, IssueWarningPayload, WarningDeadline } from '@/types/tenant';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export const DEFAULT_COMPLIANCE_WARNINGS: TenantComplianceWarning[] = [
  {
    id: 'warn_rip_01',
    tenantId: 'woofskis',
    brandName: 'Woofskis',
    severity: 'HIGH',
    reasonCode: 'COPYRIGHT_INFRINGEMENT',
    message:
      'Contest #rip_01 contains copyrighted audio watermark. Remove the submission within 24 hours to prevent tenant-wide payout holds.',
    deadline: '24h',
    deadlineTimestamp: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    issuedBy: 'superadmin@contestos.com',
    issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'warn_nike_01',
    tenantId: 'nike',
    brandName: 'Nike',
    severity: 'MEDIUM',
    reasonCode: 'PROHIBITED_SPONSOR',
    message:
      'Prohibited sponsor watermark detected in contest banner asset. Replace asset to comply with platform brand safety policy.',
    deadline: '48h',
    deadlineTimestamp: new Date(Date.now() + 44 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    issuedBy: 'superadmin@contestos.com',
    issuedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

export function getStoredWarnings(): TenantComplianceWarning[] {
  if (typeof window === 'undefined') return DEFAULT_COMPLIANCE_WARNINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANT_WARNINGS);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEYS.TENANT_WARNINGS,
        JSON.stringify(DEFAULT_COMPLIANCE_WARNINGS)
      );
      return DEFAULT_COMPLIANCE_WARNINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.error('Error reading tenant warnings from localStorage:', err);
  }
  return DEFAULT_COMPLIANCE_WARNINGS;
}

export function saveStoredWarnings(warnings: TenantComplianceWarning[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TENANT_WARNINGS, JSON.stringify(warnings));
  } catch (err) {
    console.error('Error saving tenant warnings to localStorage:', err);
  }
}

export function computeDeadlineTimestamp(deadline: WarningDeadline): string {
  const now = Date.now();
  switch (deadline) {
    case 'immediate':
      return new Date(now + 6 * 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now + 24 * 60 * 60 * 1000).toISOString();
    case '48h':
      return new Date(now + 48 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  }
}

export function getReasonLabel(reasonCode: string): string {
  switch (reasonCode) {
    case 'COPYRIGHT_INFRINGEMENT':
      return 'Copyright Infringement (DMCA / Audio)';
    case 'PROHIBITED_SPONSOR':
      return 'Prohibited Sponsor / Restricted Entity';
    case 'FRAUD_DETECTED':
      return 'Fraud / Bot Manipulation Detected';
    case 'TERMS_OF_SERVICE':
      return 'Platform Terms of Service Violation';
    default:
      return reasonCode.replace(/_/g, ' ');
  }
}

export function formatTimeRemaining(deadlineIsoString: string): string {
  try {
    const target = new Date(deadlineIsoString).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs <= 0) {
      return 'Deadline Expired';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days}d ${remHours}h remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  } catch {
    return 'Action Required';
  }
}

export function getSeverityStyles(severity: string) {
  switch (severity) {
    case 'HIGH':
      return {
        badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
        cardBorder: 'border-rose-500/40 bg-rose-950/20 shadow-rose-500/10',
        glow: 'from-rose-500/20 via-card to-background',
        accentText: 'text-rose-400',
        dotColor: 'bg-rose-500',
        pulseColor: 'bg-rose-400',
      };
    case 'MEDIUM':
      return {
        badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
        cardBorder: 'border-amber-500/40 bg-amber-950/20 shadow-amber-500/10',
        glow: 'from-amber-500/20 via-card to-background',
        accentText: 'text-amber-400',
        dotColor: 'bg-amber-500',
        pulseColor: 'bg-amber-400',
      };
    case 'LOW':
    default:
      return {
        badgeBg: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
        cardBorder: 'border-sky-500/40 bg-sky-950/20 shadow-sky-500/10',
        glow: 'from-sky-500/20 via-card to-background',
        accentText: 'text-sky-400',
        dotColor: 'bg-sky-500',
        pulseColor: 'bg-sky-400',
      };
  }
}
