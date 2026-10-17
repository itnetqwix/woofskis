import { displaySubmissionCategory } from '@/features/categories/lib/display-submission-category';
import type { ApiSubmission } from '@/services/submissions-api';
import type { CreatorSubmissionItem } from '@/types/creator';

export function mapApiSubmission(row: ApiSubmission): CreatorSubmissionItem {
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
    reviewedAt: row.moderatedAt || undefined,
    communityScore: row.communityScore,
    totalVotes: row.totalVotes,
    submittedAt: row.createdAt,
    description: row.description || '',
    tags: row.tags,
  };
}
