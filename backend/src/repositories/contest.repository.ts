import { ContestStatus, Prisma, SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/database.js';

const contestInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  },
} satisfies Prisma.ContestInclude;

export type ContestRecord = Prisma.ContestGetPayload<{
  include: typeof contestInclude;
}>;

export interface ContestListFilters {
  status?: ContestStatus;
  statuses?: ContestStatus[];
  categorySlug?: string;
  includeDeleted?: boolean;
}

export interface CreateContestData {
  categoryId: string | null;
  title: string;
  description: string;
  tagline: string | null;
  bannerUrl: string | null;
  bannerObjectKey: string | null;
  thumbnailUrl: string | null;
  timezone: string;
  startDate: Date;
  endDate: Date;
  votingClosesAt: Date | null;
  scheduledJudgingAt?: Date | null;
  originalTagline?: string | null;
  prizeSummary: string | null;
  rules: Prisma.InputJsonValue | null;
  autoAdvanceDelayMs: number;
}

export type UpdateContestData = {
  categoryId?: string | null;
  title?: string;
  description?: string;
  tagline?: string | null;
  bannerUrl?: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl?: string | null;
  status?: ContestStatus;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
  votingClosesAt?: Date | null;
  scheduledJudgingAt?: Date | null;
  originalTagline?: string | null;
  prizeSummary?: string | null;
  rules?: Prisma.InputJsonValue | null;
  autoAdvanceDelayMs?: number;
  deletedAt?: Date | null;
};

/**
 * Contest persistence (M05-P02-T01).
 * List filters are organization, status, and category slug.
 * No submission, upload, or judging queries (M06+).
 */
export class ContestRepository {
  static async create(data: CreateContestData): Promise<ContestRecord> {
    return prisma.contest.create({
      data: {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        tagline: data.tagline,
        bannerUrl: data.bannerUrl,
        bannerObjectKey: data.bannerObjectKey,
        thumbnailUrl: data.thumbnailUrl,
        timezone: data.timezone,
        startDate: data.startDate,
        endDate: data.endDate,
        votingClosesAt: data.votingClosesAt,
        scheduledJudgingAt: data.scheduledJudgingAt ?? null,
        originalTagline: data.originalTagline ?? null,
        prizeSummary: data.prizeSummary,
        rules: data.rules === null ? Prisma.JsonNull : data.rules,
        autoAdvanceDelayMs: data.autoAdvanceDelayMs,
        status: ContestStatus.DRAFT,
      },
      include: contestInclude,
    });
  }

  static async findById(id: string): Promise<ContestRecord | null> {
    return prisma.contest.findUnique({
      where: { id },
      include: contestInclude,
    });
  }

  static async list(filters: ContestListFilters): Promise<ContestRecord[]> {
    return prisma.contest.findMany({
      where: {
        status: filters.statuses ? { in: filters.statuses } : filters.status,
        category: filters.categorySlug ? { slug: filters.categorySlug } : undefined,
        ...(filters.includeDeleted ? {} : { deletedAt: null }),
      },
      include: contestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(id: string, data: UpdateContestData): Promise<ContestRecord> {
    return prisma.contest.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        tagline: data.tagline,
        bannerUrl: data.bannerUrl,
        bannerObjectKey: data.bannerObjectKey,
        thumbnailUrl: data.thumbnailUrl,
        status: data.status,
        timezone: data.timezone,
        startDate: data.startDate,
        endDate: data.endDate,
        votingClosesAt: data.votingClosesAt,
        scheduledJudgingAt: data.scheduledJudgingAt,
        originalTagline: data.originalTagline,
        prizeSummary: data.prizeSummary,
        rules:
          data.rules === undefined
            ? undefined
            : data.rules === null
              ? Prisma.JsonNull
              : data.rules,
        autoAdvanceDelayMs: data.autoAdvanceDelayMs,
      },
      include: contestInclude,
    });
  }

  /**
   * Atomically transitions an ACTIVE contest to JUDGING if its scheduledJudgingAt is due.
   * Ensures exactly-once transition across workers/retries.
   */
  static async transitionDueToJudging(id: string, now: Date): Promise<boolean> {
    const result = await prisma.contest.updateMany({
      where: {
        id,
        status: ContestStatus.ACTIVE,
        scheduledJudgingAt: { lte: now },
      },
      data: {
        status: ContestStatus.JUDGING,
        scheduledJudgingAt: null,
        votingClosesAt: now,
        endDate: now,
      },
    });
    return result.count > 0;
  }

  /**
   * Finds all ACTIVE contests that have a scheduledJudgingAt instant in the past or present.
   */
  static async findDueScheduledTransitions(now: Date): Promise<ContestRecord[]> {
    return prisma.contest.findMany({
      where: {
        status: ContestStatus.ACTIVE,
        scheduledJudgingAt: { lte: now },
      },
      include: contestInclude,
    });
  }

  /**
   * Soft-delete. Marks the contest as deleted without cascade-deleting
   * video submissions, ratings, or media records.
   */
  static async deleteById(id: string): Promise<void> {
    await prisma.contest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Contests viewable in the Videos section.
   * Includes active contests as well as any contest (completed, judging, draft,
   * archived, or deleted) that contains uploaded video submissions.
   */
  static async listViewable(): Promise<ContestRecord[]> {
    return prisma.contest.findMany({
      where: {
        OR: [
          { status: ContestStatus.ACTIVE, deletedAt: null },
          {
            submissions: {
              some: {
                status: SubmissionStatus.APPROVED,
                deletedAt: null,
              },
            },
          },
        ],
      },
      include: contestInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findTitlesByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.contest.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true },
    });
  }
}
