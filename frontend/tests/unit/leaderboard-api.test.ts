import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { http } from '../../src/services/api-client';
import {
  getLeaderboard,
  LEADERBOARD_API_PATHS,
  ApiLeaderboardData,
} from '../../src/services/leaderboard-api';

const CONTEST_ID = '11111111-1111-4111-8111-111111111111';

describe('M09 leaderboard API client', () => {
  it('loads the ranked leaderboard from the contest path', async () => {
    let requestedUrl = '';
    const origGet = http.get;
    try {
      http.get = (async <T>(url: string) => {
        requestedUrl = url;
        return {
          success: true,
          message: 'Leaderboard retrieved successfully',
          data: {
            contest: {
              id: CONTEST_ID,
              title: 'Woofskis Open',
              status: 'ACTIVE',
              category: { id: 'cat-1', name: 'Comedy Skit', slug: 'comedy-skit' },
            },
            totalEntries: 2,
            totalVotes: 150,
            averageScore: 4.8,
            items: [
              {
                rank: 1,
                id: 'sub-1',
                contestId: CONTEST_ID,
                contestTitle: 'Woofskis Open',
                title: 'Funny Video',
                description: 'A great video',
                videoUrl: 'https://example.com/v1.mp4',
                thumbnailUrl: 'https://example.com/t1.jpg',
                durationSeconds: 15,
                tags: ['comedy-skit'],
                communityScore: 4.9,
                totalVotes: 100,
                createdAt: '2026-09-02T10:00:00.000Z',
                creator: { id: 'c-1', name: 'Kai Tanaka' },
              },
              {
                rank: 2,
                id: 'sub-2',
                contestId: CONTEST_ID,
                contestTitle: 'Woofskis Open',
                title: 'Runner Up Video',
                description: null,
                videoUrl: 'https://example.com/v2.mp4',
                thumbnailUrl: null,
                durationSeconds: 20,
                tags: ['comedy-skit'],
                communityScore: 4.7,
                totalVotes: 50,
                createdAt: '2026-09-02T11:00:00.000Z',
                creator: { id: 'c-2', name: 'Alex Rivera' },
              },
            ],
            podium: [],
          } as unknown as T,
          errors: null,
        };
      }) as typeof http.get;

      const envelope = await getLeaderboard(CONTEST_ID);
      assert.equal(requestedUrl, LEADERBOARD_API_PATHS.leaderboard(CONTEST_ID));
      assert.equal(envelope.success, true);
      assert.equal(envelope.data?.totalEntries, 2);
      assert.equal(envelope.data?.items[0].id, 'sub-1');
      assert.equal(envelope.data?.items[0].communityScore, 4.9);
      assert.equal(envelope.data?.items[1].id, 'sub-2');
    } finally {
      http.get = origGet;
    }
  });

  it('constructs category and timeframe query parameters correctly', async () => {
    let requestedUrl = '';
    const origGet = http.get;
    try {
      http.get = (async <T>(url: string) => {
        requestedUrl = url;
        return {
          success: true,
          message: 'Leaderboard retrieved successfully',
          data: {
            contest: {
              id: CONTEST_ID,
              title: 'Woofskis Open',
              status: 'ACTIVE',
            },
            totalEntries: 0,
            totalVotes: 0,
            averageScore: 0,
            items: [],
            podium: [],
          } as unknown as T,
          errors: null,
        };
      }) as typeof http.get;

      await getLeaderboard(CONTEST_ID, { category: 'vfx-skit', timeframe: 'WEEKLY' });
      assert.ok(requestedUrl.includes('category=vfx-skit'));
      assert.ok(requestedUrl.includes('timeframe=WEEKLY'));

      // Ignored default parameters
      await getLeaderboard(CONTEST_ID, { category: 'ALL', timeframe: 'ALL_TIME' });
      assert.equal(requestedUrl, LEADERBOARD_API_PATHS.leaderboard(CONTEST_ID));
    } finally {
      http.get = origGet;
    }
  });
});
