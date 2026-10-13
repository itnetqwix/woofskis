export type BackgroundStylePreset =
  'midnight' | 'cyber-black' | 'deep-slate' | 'oceanic' | 'clean-light' | 'custom';

export interface ThemeColors {
  primary: string; // Hex (e.g., "#f97316")
  primaryHsl: string; // HSL Triplet (e.g., "24.6 95% 53.1%")
  primaryForeground?: string; // HSL Triplet (e.g., "0 0% 100%")
  accent: string; // Hex (e.g., "#fbbf24")
  accentHsl: string; // HSL Triplet (e.g., "43 96% 56%")
  accentForeground?: string; // HSL Triplet
  backgroundStyle: BackgroundStylePreset;
  customBackgroundHex?: string;
  customBackgroundHsl?: string;
}

export type TenantStatus = 'ACTIVE' | 'SUSPENDED';

export type WarningSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type WarningReasonCode =
  'COPYRIGHT_INFRINGEMENT' | 'PROHIBITED_SPONSOR' | 'FRAUD_DETECTED' | 'TERMS_OF_SERVICE';

export type WarningDeadline = 'immediate' | '24h' | '48h';

export type WarningStatus = 'ACTIVE' | 'RESOLVED' | 'DISMISSED';

export interface TenantComplianceWarning {
  id: string;
  tenantId: string; // e.g., "woofskis"
  brandName: string;
  severity: WarningSeverity;
  reasonCode: WarningReasonCode;
  message: string;
  deadline: WarningDeadline;
  deadlineTimestamp: string; // ISO String
  status: WarningStatus;
  issuedBy: string; // e.g., "superadmin@contestos.com"
  issuedAt: string; // ISO String
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface IssueWarningPayload {
  tenantId: string;
  brandName?: string;
  severity: WarningSeverity;
  reasonCode: WarningReasonCode;
  message: string;
  deadline: WarningDeadline;
}

export interface TenantBrandConfig {
  id: string; // e.g., "woofskis", "talentskis", "gameskis"
  /**
   * Backend Organization.id (UUID) when branding was loaded from the API.
   * Distinct from prototype `id`, which may be a slug. M04 PUT uses this value.
   */
  organizationId?: string;
  name: string; // e.g., "Woofskis"
  slug: string; // e.g., "woofskis"
  subdomain: string; // e.g., "woofskis.contestos.com"
  customDomain: string; // e.g., "woofskis.com"
  logoUrl: string;
  faviconUrl?: string;
  tagline: string;
  description: string;
  colors: ThemeColors;
  activeContestId?: string;
  isDefault?: boolean;
  status?: TenantStatus; // 'ACTIVE' | 'SUSPENDED'
  suspensionReason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  dnsStatus?: 'active' | 'pending' | 'verifying';
  sslStatus?: 'secured' | 'provisioning';
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin contest badges use the backend ContestStatus values.
 * PUBLISHED, PAUSED, and CLOSED remain so existing localStorage prototypes
 * (creator, leaderboard, moderation) still type-check until those modules
 * leave `cos_contests_v1`. They are not sent to the contest API.
 */
export type ContestLifecycleStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'JUDGING'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'CLOSED';

export interface PrizeDistributionItem {
  id: string;
  rank: string; // e.g., "1st Place", "2nd Place", "3rd Place", "Community Mention"
  label: string;
  percentage: number; // e.g., 50 (for 50%)
  amount: number; // e.g., 12500
  badgeColor?: string;
  iconName?: 'Crown' | 'Medal' | 'Award' | 'Sparkles' | 'Star';
  description?: string;
}

export interface MediaConstraintsConfig {
  maxDurationSeconds: number; // Default 60s
  minDurationSeconds?: number; // Default 5s
  aspectRatio: '9:16' | '16:9' | '1:1' | 'all';
  maxFileSizeMb: number; // Default 100MB
  allowedFormats: string[]; // ['mp4', 'mov', 'webm']
  resolutionRecommendation?: string; // e.g. "1080x1920 (9:16 FHD)"
}

export interface ContestConfigItem {
  id: string;
  /** Organization slug used by the existing brand filter. */
  tenantId: string;
  /** Backend Organization.id when the row came from GET /contests. */
  organizationId?: string;
  /** Organization name from the contest payload. */
  organizationName?: string;
  title: string;
  tagline?: string;
  description: string;
  bannerUrl?: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl?: string;
  timezone?: string;
  categories: string[];
  rules: string;
  startDate: string; // ISO String
  deadlineDate: string; // ISO String (Submission closure)
  votingCloseDate: string; // ISO String (Voting closure)
  mediaConstraints: MediaConstraintsConfig;
  prizePool: {
    total: number;
    currency: string; // "USD", "EUR", "GBP", "CAD", etc.
    distribution: PrizeDistributionItem[];
  };
  status: ContestLifecycleStatus;
  entriesCount: number;
  votesCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContestFormValues {
  tenantId: string;
  title: string;
  tagline: string;
  description: string;
  bannerUrl: string;
  thumbnailUrl: string;
  categories: string[];
  rules: string;
  startDate: string;
  deadlineDate: string;
  votingCloseDate: string;
  maxDurationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | 'all';
  maxFileSizeMb: number;
  totalPrizePool: number;
  currency: string;
  distribution: PrizeDistributionItem[];
  status: ContestLifecycleStatus;
}
