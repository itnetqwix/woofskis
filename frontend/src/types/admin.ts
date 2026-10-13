import { CreatorSubmissionItem, SubmissionStatus } from './creator';

export type ModerationAction =
  'APPROVE' | 'REJECT' | 'FLAG' | 'UNFLAG' | 'BATCH_APPROVE' | 'BATCH_REJECT' | 'NOTE';

export type RejectionReasonCode =
  | 'WATERMARK'
  | 'COPYRIGHT_AUDIO'
  | 'DURATION_LIMIT'
  | 'COMMUNITY_GUIDELINES'
  | 'LOW_QUALITY'
  | 'OTHER';

export interface RejectionPreset {
  code: RejectionReasonCode;
  title: string;
  description: string;
  defaultFeedback: string;
  badgeColor: string;
  iconName: string;
}

export interface ModerationAuditLogItem {
  id: string;
  submissionId: string;
  submissionTitle: string;
  creatorName: string;
  action:
    | 'APPROVED'
    | 'REJECTED'
    | 'FLAGGED'
    | 'UNFLAGGED'
    | 'RESTORED'
    | 'ISSUE_WARNING'
    | 'SUSPEND_CREATOR';
  moderatorId: string;
  moderatorName: string;
  reasonCode?: RejectionReasonCode;
  reasonNote?: string;
  timestamp: string; // ISO format
  previousStatus: SubmissionStatus;
  newStatus: SubmissionStatus;
}

export interface ValidationChecklistState {
  resolutionPass: boolean;
  aspectRatioPass: boolean;
  audioCleared: boolean;
  policyCompliant: boolean;
  durationCompliant: boolean;
}

export interface AdminSubmissionItem extends CreatorSubmissionItem {
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl: string;
  creatorVerified?: boolean;
  creatorSubmissionsCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  flagScore?: number; // 0-100 risk score
  reviewedAt?: string;
  reviewedBy?: string;
  reviewDurationSeconds?: number;
  resolution: string;
  fps: number;
  audioBitrate: string;
  audioTrackName?: string;
  codec?: string;
  complianceChecks: ValidationChecklistState;
}

export interface AdminQueueMetrics {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  flaggedCount: number;
  avgReviewTimeSec: number;
  totalSubmissions: number;
  approvalVelocityPerHour: number;
  compliancePassRate: number;
}

export type ContestLifecycleState = 'ACTIVE' | 'PENDING_RESULTS' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';

export type ModerationFilterStatus = 'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export type ModerationViewMode = 'split' | 'table';

export type ModerationSortOption = 'newest' | 'oldest' | 'urgency' | 'creator';

export interface ModerationHotKeyInfo {
  key: string;
  label: string;
  description: string;
  action: string;
}
