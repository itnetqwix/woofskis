import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '../../src/lib/axios';
import {
  JUDGING_API_PATHS,
  getJudgingQueue,
  rateSubmission,
  type ApiJudgingQueue,
  type ApiRateResult,
} from '../../src/services/judging-api';
import { VIEWER_MUTE_STORAGE_KEY } from '../../src/features/judging/lib/judging-flow';

const contestId = '11111111-1111-4111-8111-111111111111';
const videoId = '22222222-2222-4222-8222-222222222221';

const queue: ApiJudgingQueue = {
  contestId,
  status: 'ACTIVE',
  ratingOpen: true,
  autoAdvanceDelayMs: 1800,
  items: [
    {
      id: videoId,
      title: 'Sketch',
      description: 'A bit',
      videoUrl: 'https://bucket.example/sketch.mp4',
      thumbnailUrl: null,
      durationSeconds: 20,
      tags: ['sketch'],
      communityScore: 0,
      totalVotes: 0,
      status: 'APPROVED',
      category: 'Sketch',
      creator: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000aa', name: 'Ada Creator' },
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ],
};

describe('M08 judging API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('loads the approved queue from the contest path', async () => {
    apiClient.defaults.adapter = (async (config) => {
      assert.equal(config.url, JUDGING_API_PATHS.queue(contestId));
      assert.equal(config.method, 'get');
      return {
        data: {
          success: true,
          message: 'Judging queue retrieved successfully',
          data: queue,
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const envelope = await getJudgingQueue(contestId);
    assert.equal(envelope.success, true);
    assert.equal(envelope.data?.items[0].status, 'APPROVED');
    assert.equal(envelope.data?.autoAdvanceDelayMs, 1800);
    assert.equal(JSON.stringify(envelope).includes('passwordHash'), false);
  });

  it('posts a rating and returns the server score fields', async () => {
    const result: ApiRateResult = {
      previousScore: 4.7,
      newScore: 4.1,
      delta: -0.6,
      totalVotes: 3,
    };
    let sent = '';
    apiClient.defaults.adapter = (async (config) => {
      assert.equal(config.url, JUDGING_API_PATHS.rate(contestId, videoId));
      assert.equal(config.method, 'post');
      sent = String(config.data);
      return {
        data: {
          success: true,
          message: 'Rating recorded',
          data: result,
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const envelope = await rateSubmission(contestId, videoId, { rating: 3 });
    assert.equal(sent.includes(VIEWER_MUTE_STORAGE_KEY), false);
    assert.deepEqual(JSON.parse(sent), { rating: 3 });
    assert.equal(envelope.data?.newScore, 4.1);
    assert.equal(envelope.data?.delta, -0.6);
    assert.equal(envelope.data?.totalVotes, 3);
  });
});
