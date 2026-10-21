import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { FastifyInstance } from 'fastify';
import { ContestStatus, Role } from '@prisma/client';
import { buildApp } from '../../src/app.js';
import { CategoryRecord } from '../../src/repositories/category.repository.js';
import { ContestRecord, ContestRepository } from '../../src/repositories/contest.repository.js';
import { ContestTransitionService } from '../../src/services/contest-transition.service.js';
import {
  SUBMISSION_OPEN_BEFORE_TODAY,
  SUBMISSION_OPEN_BEFORE_NOW,
  assertSubmissionOpenSchedule,
} from '../../src/services/contest-schedule.js';

interface Memory {
  categories: Map<string, CategoryRecord>;
  contests: Map<string, ContestRecord>;
  seq: number;
}

function createMemory(): Memory {
  return { categories: new Map(), contests: new Map(), seq: 1 };
}

describe('Contest Admin Flows & Lifecycle Requirements', () => {
  let app: FastifyInstance;
  let memory: Memory;

  function token(role: Role): string {
    return app.jwt.sign({
      id: '00000000-0000-4000-8000-000000000001',
      role,
      tokenVersion: 0,
      accountStatus: 'ACTIVE',
    });
  }

  before(async () => {
    app = await buildApp();

    ContestRepository.create = async (data) => {
      const id = `cccccccc-cccc-4ccc-8ccc-${memory.seq.toString(16).padStart(12, '0')}`;
      memory.seq += 1;
      const record: ContestRecord = {
        id,
        categoryId: data.categoryId ?? null,
        title: data.title,
        description: data.description,
        tagline: data.tagline ?? null,
        bannerUrl: data.bannerUrl ?? null,
        bannerObjectKey: data.bannerObjectKey ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        timezone: data.timezone,
        startDate: data.startDate,
        endDate: data.endDate,
        votingClosesAt: data.votingClosesAt ?? null,
        scheduledJudgingAt: data.scheduledJudgingAt ?? null,
        originalTagline: data.originalTagline ?? null,
        prizeSummary: data.prizeSummary ?? null,
        rules: data.rules ?? null,
        status: ContestStatus.DRAFT,
        autoAdvanceDelayMs: data.autoAdvanceDelayMs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memory.contests.set(id, record);
      return record;
    };

    ContestRepository.findById = async (id) => memory.contests.get(id) ?? null;

    ContestRepository.update = async (id, data) => {
      const existing = memory.contests.get(id);
      if (!existing) throw new Error('Not found');
      const updated: ContestRecord = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      memory.contests.set(id, updated);
      return updated;
    };

    ContestRepository.deleteById = async (id) => {
      memory.contests.delete(id);
    };

    ContestRepository.findDueScheduledTransitions = async (now) => {
      const results: ContestRecord[] = [];
      for (const contest of memory.contests.values()) {
        if (
          contest.status === ContestStatus.ACTIVE &&
          contest.scheduledJudgingAt &&
          contest.scheduledJudgingAt <= now
        ) {
          results.push(contest);
        }
      }
      return results;
    };

    ContestRepository.transitionDueToJudging = async (id, now) => {
      const contest = memory.contests.get(id);
      if (
        contest &&
        contest.status === ContestStatus.ACTIVE &&
        contest.scheduledJudgingAt &&
        contest.scheduledJudgingAt <= now
      ) {
        contest.status = ContestStatus.JUDGING;
        contest.votingClosesAt = now;
        contest.endDate = now;
        contest.scheduledJudgingAt = null;
        contest.updatedAt = new Date();
        return 1;
      }
      return 0;
    };
  });

  after(async () => {
    await app.close();
  });

  const validBannerKey =
    'contest-banners/00000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.png';

  const baseCreatePayload = {
    title: 'Top Dog Tricks 2026',
    description: 'Show us your best pup agility and tricks.',
    tagline: 'Best pup of the season wins big',
    bannerObjectKey: validBannerKey,
    timezone: 'America/New_York',
    startDate: '2026-11-01T12:00:00.000Z',
    endDate: '2026-11-20T12:00:00.000Z',
    votingClosesAt: '2026-11-25T12:00:00.000Z',
  };

  it('1. Mandatory Banner: rejects contest creation without a custom banner and accepts valid banner', async () => {
    memory = createMemory();
    const adminHeaders = { authorization: `Bearer ${token(Role.ADMIN)}` };

    // Missing banner
    const noBannerRes = await app.inject({
      method: 'POST',
      url: '/api/v1/contests',
      headers: adminHeaders,
      payload: {
        ...baseCreatePayload,
        bannerObjectKey: undefined,
        bannerUrl: undefined,
      },
    });
    assert.equal(noBannerRes.statusCode, 400);
    const noBannerBody = JSON.parse(noBannerRes.payload);
    assert.match(JSON.stringify(noBannerBody), /banner/i);

    // Valid banner upload
    const validRes = await app.inject({
      method: 'POST',
      url: '/api/v1/contests',
      headers: adminHeaders,
      payload: baseCreatePayload,
    });
    assert.equal(validRes.statusCode, 201);
    const contest = JSON.parse(validRes.payload).data;
    assert.equal(contest.title, 'Top Dog Tricks 2026');
    assert.equal(contest.status, 'DRAFT');
  });

  it('2. Timeline Validation: authoritative submission open validation against current time in contest timezone', () => {
    const timeZone = 'America/New_York';
    // Reference instant: 2026-10-21 12:00 EDT (16:00 UTC)
    const now = new Date('2026-10-21T16:00:00.000Z');

    // Date before today (e.g. 2026-10-20)
    assert.throws(
      () =>
        assertSubmissionOpenSchedule(
          new Date('2026-10-20T16:00:00.000Z'),
          timeZone,
          now,
        ),
      (err: any) => err.message === SUBMISSION_OPEN_BEFORE_TODAY,
    );

    // Today but earlier than current time (e.g. 10:00 EDT on 2026-10-21)
    assert.throws(
      () =>
        assertSubmissionOpenSchedule(
          new Date('2026-10-21T14:00:00.000Z'), // 10:00 EDT
          timeZone,
          now,
        ),
      (err: any) => err.message === SUBMISSION_OPEN_BEFORE_NOW,
    );

    // Today at current time or later: allowed
    assert.doesNotThrow(() =>
      assertSubmissionOpenSchedule(
        new Date('2026-10-21T16:00:00.000Z'), // 12:00 EDT (same as now)
        timeZone,
        now,
      ),
    );
    assert.doesNotThrow(() =>
      assertSubmissionOpenSchedule(
        new Date('2026-10-21T18:00:00.000Z'), // 14:00 EDT (later today)
        timeZone,
        now,
      ),
    );

    // Future date: allowed
    assert.doesNotThrow(() =>
      assertSubmissionOpenSchedule(
        new Date('2026-11-01T12:00:00.000Z'),
        timeZone,
        now,
      ),
    );
  });

  it('3. Draft Contest Activation: activates DRAFT contest; blocks activating non-DRAFT contests', async () => {
    memory = createMemory();
    const adminHeaders = { authorization: `Bearer ${token(Role.ADMIN)}` };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/contests',
      headers: adminHeaders,
      payload: baseCreatePayload,
    });
    const contest = JSON.parse(createRes.payload).data;
    assert.equal(contest.status, 'DRAFT');

    // Activate from DRAFT -> ACTIVE
    const activateRes = await app.inject({
      method: 'PATCH',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
      payload: { status: 'ACTIVE' },
    });
    assert.equal(activateRes.statusCode, 200);
    assert.equal(JSON.parse(activateRes.payload).data.status, 'ACTIVE');

    // Move to COMPLETED in memory
    memory.contests.get(contest.id)!.status = ContestStatus.COMPLETED;

    // Activating from COMPLETED -> ACTIVE is blocked
    const invalidActivate = await app.inject({
      method: 'PATCH',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
      payload: { status: 'ACTIVE' },
    });
    assert.equal(invalidActivate.statusCode, 409);
  });

  it('4. Active Contest Deletion: active contest cannot be deleted', async () => {
    memory = createMemory();
    const adminHeaders = { authorization: `Bearer ${token(Role.ADMIN)}` };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/contests',
      headers: adminHeaders,
      payload: baseCreatePayload,
    });
    const contest = JSON.parse(createRes.payload).data;

    // Activate contest
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
      payload: { status: 'ACTIVE' },
    });

    // Attempt delete
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
    });
    assert.equal(deleteRes.statusCode, 409);
    assert.match(JSON.parse(deleteRes.payload).message, /Active contests cannot be deleted/);
    assert.ok(memory.contests.has(contest.id));
  });

  it('5. Active -> Judging 3-Day Delayed Transition and Idempotent Scheduler', async () => {
    memory = createMemory();
    const adminHeaders = { authorization: `Bearer ${token(Role.ADMIN)}` };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/contests',
      headers: adminHeaders,
      payload: baseCreatePayload,
    });
    const contest = JSON.parse(createRes.payload).data;

    // Activate
    await app.inject({
      method: 'PATCH',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
      payload: { status: 'ACTIVE' },
    });

    // 5a. Direct PATCH to JUDGING is blocked
    const directPatch = await app.inject({
      method: 'PATCH',
      url: `/api/v1/contests/${contest.id}`,
      headers: adminHeaders,
      payload: { status: 'JUDGING' },
    });
    assert.equal(directPatch.statusCode, 409);
    assert.match(
      JSON.parse(directPatch.payload).message,
      /Active contests cannot be moved to JUDGING immediately/,
    );

    // 5b. schedule-judging requires exact tagline confirmation
    const wrongTaglineRes = await app.inject({
      method: 'POST',
      url: `/api/v1/contests/${contest.id}/schedule-judging`,
      headers: adminHeaders,
      payload: { taglineConfirmation: 'wrong tagline' },
    });
    assert.equal(wrongTaglineRes.statusCode, 400);

    // 5c. Correct tagline confirmation schedules transition for 3 days
    const beforeAction = Date.now();
    const scheduleRes = await app.inject({
      method: 'POST',
      url: `/api/v1/contests/${contest.id}/schedule-judging`,
      headers: adminHeaders,
      payload: { taglineConfirmation: 'Best pup of the season wins big' },
    });
    assert.equal(scheduleRes.statusCode, 200);
    const scheduledView = JSON.parse(scheduleRes.payload).data;

    // Tagline updated to notify community
    assert.equal(scheduledView.tagline, 'Submissions and voting close in 3 days');
    assert.equal(scheduledView.originalTagline, 'Best pup of the season wins big');
    assert.ok(scheduledView.scheduledJudgingAt);

    const scheduledDate = new Date(scheduledView.scheduledJudgingAt).getTime();
    const expectedThreeDays = beforeAction + 3 * 24 * 60 * 60 * 1000;
    // Within 5 seconds tolerance
    assert.ok(Math.abs(scheduledDate - expectedThreeDays) < 5000);

    // 5d. Duplicate schedule call is blocked
    const duplicateRes = await app.inject({
      method: 'POST',
      url: `/api/v1/contests/${contest.id}/schedule-judging`,
      headers: adminHeaders,
      payload: { taglineConfirmation: 'Submissions and voting close in 3 days' },
    });
    assert.equal(duplicateRes.statusCode, 409);

    // 5e. Scheduler test: before scheduled time arrives
    const twoDaysLater = new Date(beforeAction + 2 * 24 * 60 * 60 * 1000);
    const earlyTransitions = await ContestTransitionService.processDueTransitions(twoDaysLater);
    assert.equal(earlyTransitions, 0);
    assert.equal(memory.contests.get(contest.id)!.status, ContestStatus.ACTIVE);

    // 5f. At or after scheduled time: transitions to JUDGING exactly once
    const threeDaysLater = new Date(scheduledDate + 1000);
    const dueTransitions = await ContestTransitionService.processDueTransitions(threeDaysLater);
    assert.equal(dueTransitions, 1);
    assert.equal(memory.contests.get(contest.id)!.status, ContestStatus.JUDGING);

    // Repeated run is idempotent (0 additional transitions)
    const repeated = await ContestTransitionService.processDueTransitions(threeDaysLater);
    assert.equal(repeated, 0);
    assert.equal(memory.contests.get(contest.id)!.status, ContestStatus.JUDGING);
  });
});
