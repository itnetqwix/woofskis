import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiContestToConfigItem,
  prizePoolFromSummary,
  toCreateContestRequest,
  toUpdateContestRequest,
} from '../../src/features/admin/lib/contest-api';
import type { ApiContest } from '../../src/services/contests-api';

const contest: ApiContest = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
  categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  category: {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
    name: 'Comedy Skits',
    slug: 'comedy-skits',
    description: null,
  },
  title: 'Summer Comedy Slam',
  description: 'Short comedy entries.',
  tagline: 'Funniest minute',
  bannerUrl: 'https://images.example.com/banner.jpg',
  thumbnailUrl: 'https://images.example.com/thumb.jpg',
  status: 'ACTIVE',
  startDate: '2026-10-01T00:00:00.000Z',
  endDate: '2026-10-31T00:00:00.000Z',
  prizeSummary: '25000 USD',
  rules: ['Be original'],
  autoAdvanceDelayMs: 1800,
  createdAt: '2026-10-02T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
};

describe('M05 contest view mapping', () => {
  it('maps API contests onto the admin table shape using ContestStatus', () => {
    const item = apiContestToConfigItem(contest);
    assert.equal(item.status, 'ACTIVE');
    assert.equal(item.tenantId, 'woofskis');
    assert.equal(item.organizationName, 'Woofskis');
    assert.deepEqual(item.categories, ['Comedy Skits']);
    assert.equal(item.deadlineDate, contest.endDate);
    assert.equal(item.prizePool.total, 25000);
    assert.equal(item.prizePool.currency, 'USD');
    assert.equal(item.entriesCount, 0);
    assert.equal(item.votesCount, 0);
    assert.equal(item.rules, 'Be original');
    assert.equal(item.thumbnailUrl, contest.thumbnailUrl);
    assert.equal(item.bannerUrl, contest.bannerUrl);
    assert.equal(item.tagline, 'Funniest minute');
    assert.equal(item.timezone, 'Asia/Kolkata');
    assert.equal(item.votingCloseDate, '');
  });

  it('round-trips a custom banner key, timezone, and voting closure', () => {
    const body = toCreateContestRequest({
      tenantId: 'woofskis',
      title: 'Summer Comedy Slam',
      description: 'Short comedy entries.',
      categories: ['Comedy Skits'],
      rules: 'Be original',
      startDate: '2026-10-10T18:30:00.000Z',
      deadlineDate: '2026-10-20T18:30:00.000Z',
      votingCloseDate: '2026-10-25T18:30:00.000Z',
      timezone: 'Asia/Kolkata',
      bannerObjectKey:
        'contest-banners/cccccccc-cccc-4ccc-8ccc-0000000000aa/bbbbbbbb-bbbb-4bbb-8bbb-0000000000bb.png',
      bannerUrl: 'https://signed.example/expired',
      prizePool: { total: 25000, currency: 'USD' },
    });
    assert.equal(body.timezone, 'Asia/Kolkata');
    assert.equal(body.votingClosesAt, '2026-10-25T18:30:00.000Z');
    assert.equal(body.bannerUrl, null);
    assert.match(body.bannerObjectKey || '', /^contest-banners\//);

    const mapped = apiContestToConfigItem({
      ...contest,
      timezone: 'America/New_York',
      votingClosesAt: '2026-11-02T00:00:00.000Z',
      bannerObjectKey: body.bannerObjectKey,
      bannerUrl: null,
    });
    assert.equal(mapped.timezone, 'America/New_York');
    assert.equal(mapped.votingCloseDate, '2026-11-02T00:00:00.000Z');
    assert.equal(mapped.bannerObjectKey, body.bannerObjectKey);
  });

  it('sends one category and a prize summary, and does not send a create status', () => {
    const body = toCreateContestRequest({
      tenantId: 'woofskis',
      title: 'Summer Comedy Slam',
      description: 'Short comedy entries.',
      categories: ['Comedy Skits', 'Pets'],
      rules: 'Be original',
      startDate: '2026-10-01T00:00:00.000Z',
      deadlineDate: '2026-10-31T00:00:00.000Z',
      prizePool: { total: 25000, currency: 'USD' },
    });
    assert.equal('organizationId' in body, false);
    assert.deepEqual(body.category, { name: 'Comedy Skits' });
    assert.equal(body.endDate, '2026-10-31T00:00:00.000Z');
    assert.equal(body.prizeSummary, '25000 USD');
    assert.equal('status' in body, false);

    const patch = toUpdateContestRequest({
      tenantId: 'woofskis',
      title: 'Renamed',
      description: 'Updated',
      categories: ['Comedy Skits'],
      rules: 'Still original',
      startDate: '2026-10-01T00:00:00.000Z',
      deadlineDate: '2026-11-01T00:00:00.000Z',
      prizePool: { total: 1000, currency: 'USD' },
    });
    assert.equal(patch.status, undefined);
    assert.equal(patch.title, 'Renamed');
    assert.equal(prizePoolFromSummary('1000 USD').total, 1000);
    assert.equal(prizePoolFromSummary('not a prize').total, 0);
  });
});
