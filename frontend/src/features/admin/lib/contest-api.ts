import type { ContestConfigItem, MediaConstraintsConfig } from '@/types/tenant';
import type {
  ApiContest,
  CreateContestRequest,
  UpdateContestRequest,
} from '@/services/contests-api';

/**
 * Maps the contest admin form onto the M05 API and back.
 *
 * Sent when present: tagline, bannerUrl, bannerObjectKey, thumbnailUrl, timezone, votingClosesAt.
 * Not sent, because they are not Contest columns:
 * prize distribution, media constraints, entries, votes, featured.
 * Multiple categories per contest are NOT SPECIFIED (one optional category).
 * Only the first category name is sent.
 * startDate is submission opening and endDate is the submission deadline.
 * Both are absolute instants. votingClosesAt is stored separately.
 * entriesCount and votesCount stay 0 until M06/M08.
 */

const DISPLAY_MEDIA: MediaConstraintsConfig = {
  maxDurationSeconds: 60,
  minDurationSeconds: 5,
  aspectRatio: '9:16',
  maxFileSizeMb: 100,
  allowedFormats: ['mp4', 'webm'],
};

export interface ContestFormSource {
  organizationId?: string;
  tenantId: string;
  title: string;
  tagline?: string;
  description: string;
  bannerUrl?: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl?: string;
  timezone?: string;
  categories: string[];
  rules: string;
  startDate: string;
  deadlineDate: string;
  votingCloseDate?: string;
  prizePool: { total: number; currency: string };
}

export function prizeSummaryFromPool(total: number, currency: string): string {
  return `${total} ${currency}`;
}

export function prizePoolFromSummary(summary: string | null | undefined): {
  total: number;
  currency: string;
} {
  if (!summary) return { total: 0, currency: 'USD' };
  const match = /^(\d+(?:\.\d+)?)\s+([A-Za-z]{3})$/.exec(summary.trim());
  if (!match) return { total: 0, currency: 'USD' };
  return { total: Number(match[1]), currency: match[2] };
}

export function rulesToText(rules: ApiContest['rules']): string {
  if (typeof rules === 'string') return rules;
  if (Array.isArray(rules)) return rules.join('\n');
  return '';
}

export function apiContestToConfigItem(contest: ApiContest): ContestConfigItem {
  const prize = prizePoolFromSummary(contest.prizeSummary);
  return {
    id: contest.id,
    organizationName: 'Woofskis',
    tenantId: 'woofskis',
    title: contest.title,
    tagline: contest.tagline ?? undefined,
    description: contest.description,
    bannerUrl: contest.bannerUrl ?? undefined,
    bannerObjectKey: contest.bannerObjectKey ?? null,
    thumbnailUrl: contest.thumbnailUrl ?? undefined,
    timezone: contest.timezone || 'Asia/Kolkata',
    categories: contest.category ? [contest.category.name] : [],
    rules: rulesToText(contest.rules),
    startDate: contest.startDate,
    deadlineDate: contest.endDate,
    votingCloseDate: contest.votingClosesAt || '',
    mediaConstraints: DISPLAY_MEDIA,
    prizePool: {
      total: prize.total,
      currency: prize.currency,
      distribution: [],
    },
    status: contest.status,
    entriesCount: 0,
    votesCount: 0,
    createdAt: contest.createdAt,
    updatedAt: contest.updatedAt,
  };
}

function firstCategory(categories: string[]): { name: string } | undefined {
  const name = categories.find((item) => item.trim().length > 0)?.trim();
  return name ? { name } : undefined;
}

export function toCreateContestRequest(input: ContestFormSource): CreateContestRequest {
  const category = firstCategory(input.categories);
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    tagline: input.tagline?.trim() || null,
    bannerUrl: input.bannerObjectKey ? null : input.bannerUrl?.trim() || null,
    bannerObjectKey: input.bannerObjectKey ?? null,
    thumbnailUrl: input.thumbnailUrl?.trim() || null,
    timezone: input.timezone,
    startDate: input.startDate,
    endDate: input.deadlineDate,
    votingClosesAt: input.votingCloseDate || null,
    prizeSummary: prizeSummaryFromPool(input.prizePool.total, input.prizePool.currency),
    rules: input.rules,
    ...(category ? { category } : {}),
  };
}

export function toUpdateContestRequest(input: ContestFormSource): UpdateContestRequest {
  const category = firstCategory(input.categories);
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    tagline: input.tagline?.trim() || null,
    bannerUrl: input.bannerObjectKey ? null : input.bannerUrl?.trim() || null,
    bannerObjectKey: input.bannerObjectKey ?? null,
    thumbnailUrl: input.thumbnailUrl?.trim() || null,
    timezone: input.timezone,
    startDate: input.startDate,
    endDate: input.deadlineDate,
    votingClosesAt: input.votingCloseDate || null,
    prizeSummary: prizeSummaryFromPool(input.prizePool.total, input.prizePool.currency),
    rules: input.rules,
    ...(category ? { category } : {}),
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
