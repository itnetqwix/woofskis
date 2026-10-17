import { displaySubmissionCategory } from '@/features/categories/lib/display-submission-category';
import type { ApiAuditLog, ApiModerationSubmission } from '@/services/moderation-api';
import type {
  AdminSubmissionItem,
  ModerationAuditLogItem,
  RejectionReasonCode,
} from '@/types/admin';
import type { SubmissionStatus } from '@/types/creator';

const UI_ACTIONS: Record<string, ModerationAuditLogItem['action']> = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  FLAG: 'FLAGGED',
};

function asStatus(value: string | undefined, fallback: SubmissionStatus): SubmissionStatus {
  if (
    value === 'PENDING_REVIEW' ||
    value === 'APPROVED' ||
    value === 'REJECTED' ||
    value === 'FLAGGED'
  ) {
    return value;
  }
  return fallback;
}

/**
 * Queue rows are PENDING_REVIEW from the API.
 * Resolution, aspect, audio, and policy are not stored. Those checklist
 * booleans start as local inspector defaults and are not server measurements.
 * Duration uses the documented 1–60 second constraint.
 */
export function mapQueueSubmission(row: ApiModerationSubmission): AdminSubmissionItem {
  const durationCompliant = row.durationSeconds >= 1 && row.durationSeconds <= 60;
  return {
    id: row.id,
    title: row.title,
    contestId: row.contestId,
    contestName: row.contest?.title || 'Contest',
    category: displaySubmissionCategory({
      videoCategory: row.videoCategory,
      otherCategoryLabel: row.otherCategoryLabel,
      contestCategoryName: row.contest?.category?.name,
      tags: row.tags,
    }),
    videoUrl: row.videoUrl,
    thumbnailUrl: row.thumbnailUrl || '',
    durationSeconds: row.durationSeconds,
    status: row.status,
    rejectionReason: row.rejectionReason || undefined,
    communityScore: row.communityScore,
    totalVotes: row.totalVotes,
    submittedAt: row.createdAt,
    description: row.description || '',
    tags: row.tags,
    creatorName: row.creator?.name || 'Creator',
    creatorHandle: '',
    creatorAvatarUrl: '',
    isFlagged: row.status === 'FLAGGED',
    reviewedAt: row.moderatedAt || undefined,
    reviewedBy: row.moderatedById || undefined,
    resolution: '',
    fps: 0,
    audioBitrate: '',
    complianceChecks: {
      resolutionPass: true,
      aspectRatioPass: true,
      audioCleared: true,
      policyCompliant: true,
      durationCompliant,
    },
  };
}

export function mapAuditLog(entry: ApiAuditLog): ModerationAuditLogItem {
  const newStatus = asStatus(entry.metadata?.newStatus, 'PENDING_REVIEW');
  const previousStatus = asStatus(entry.metadata?.previousStatus, 'PENDING_REVIEW');
  return {
    id: entry.id,
    submissionId: entry.submissionId || '',
    submissionTitle: entry.submission?.title || 'Submission',
    creatorName: entry.submission?.creatorName || 'Creator',
    action: UI_ACTIONS[entry.action] ?? (entry.action as ModerationAuditLogItem['action']),
    moderatorId: entry.actorId,
    moderatorName: entry.actor?.name || 'Moderator',
    reasonCode: entry.metadata?.reasonCode as RejectionReasonCode | undefined,
    reasonNote: entry.reason || undefined,
    timestamp: entry.createdAt,
    previousStatus,
    newStatus,
  };
}
