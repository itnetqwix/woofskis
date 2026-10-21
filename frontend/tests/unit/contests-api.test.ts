import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '../../src/lib/axios';
import {
  CONTEST_API_PATHS,
  createContest,
  listContests,
  nextContestStatus,
  updateContest,
} from '../../src/services/contests-api';

describe('M05-P04 contests API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('GET /contests sends status and category filters and returns the envelope', async () => {
    let captured: { url?: string; method?: string; params?: unknown } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, params: config.params };
      return {
        data: {
          success: true,
          message: 'Contests retrieved successfully',
          data: [],
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const result = await listContests({ status: 'ACTIVE', category: 'comedy-skits' });
    assert.equal(captured.method, 'get');
    assert.equal(captured.url, CONTEST_API_PATHS.collection);
    assert.deepEqual(captured.params, { status: 'ACTIVE', category: 'comedy-skits' });
    assert.equal(result.success, true);
    if (result.success && result.data) {
      assert.deepEqual(result.data, []);
    }
  });

  it('POST /contests sends a DRAFT create body without a status field', async () => {
    let captured: { url?: string; method?: string; data?: string } = {};
    const body = {
      title: 'Summer Comedy Slam',
      description: 'Short comedy entries.',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T00:00:00.000Z',
      category: { name: 'Comedy Skits' },
      rules: 'Be original',
      prizeSummary: '25000 USD',
    };

    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return {
        data: {
          success: true,
          message: 'Contest created successfully',
          data: { id: 'contest-1', status: 'DRAFT', ...body },
          errors: null,
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const result = await createContest(body);
    assert.equal(captured.method, 'post');
    assert.equal(captured.url, CONTEST_API_PATHS.collection);
    const sent = JSON.parse(captured.data ?? '{}');
    assert.equal(sent.status, undefined);
    assert.equal(sent.title, 'Summer Comedy Slam');
    assert.equal(result.success, true);
  });

  it('PATCH /contests/:id sends only the next status', async () => {
    let captured: { url?: string; method?: string; data?: string } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return {
        data: {
          success: true,
          message: 'Contest updated successfully',
          data: { id: 'contest-1', status: 'SCHEDULED' },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    await updateContest('contest-1', { status: 'SCHEDULED' });
    assert.equal(captured.method, 'patch');
    assert.equal(captured.url, CONTEST_API_PATHS.byId('contest-1'));
    assert.deepEqual(JSON.parse(captured.data ?? '{}'), { status: 'SCHEDULED' });
    assert.equal(nextContestStatus('DRAFT'), 'ACTIVE');
    assert.equal(nextContestStatus('ACTIVE'), 'JUDGING');
    assert.equal(nextContestStatus('ARCHIVED'), null);
    assert.equal(nextContestStatus('PAUSED'), null);
  });

  it('GET /creator/contests calls the creator collection path and returns the envelope', async () => {
    let captured: { url?: string; method?: string } = {};
    const mockContests = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Contest Alpha',
        status: 'ACTIVE',
        prizeSummary: '10,000 USD',
        tagline: 'Alpha tagline',
        bannerUrl: 'https://example.com/banner.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Contest Beta',
        status: 'ACTIVE',
        prizeSummary: '20,000 USD',
        tagline: 'Beta tagline',
        bannerUrl: null,
        thumbnailUrl: null,
      },
    ];

    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method };
      return {
        data: {
          success: true,
          message: 'Contests retrieved successfully',
          data: mockContests,
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const result = await (await import('../../src/services/contests-api')).listCreatorContests();
    assert.equal(captured.method, 'get');
    assert.equal(captured.url, CONTEST_API_PATHS.creatorCollection);
    assert.equal(result.success, true);
    assert.equal(Array.isArray(result.data), true);
    if (result.success && result.data) {
      assert.equal(result.data.length, 2);
      assert.equal(result.data[0].id, '11111111-1111-4111-8111-111111111111');
      assert.equal(result.data[0].title, 'Contest Alpha');
      assert.equal(result.data[0].prizeSummary, '10,000 USD');
      assert.equal(result.data[1].id, '22222222-2222-4222-8222-222222222222');
    }
  });
});
