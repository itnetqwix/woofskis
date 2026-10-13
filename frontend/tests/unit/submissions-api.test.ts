import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '../../src/lib/axios';
import {
  SUBMISSION_API_PATHS,
  completeSubmission,
  listMySubmissions,
  presignSubmission,
} from '../../src/services/submissions-api';

describe('M06-P04 submissions API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('POST /submissions/presign sends metadata only', async () => {
    let captured: { url?: string; method?: string; data?: string } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return {
        data: {
          success: true,
          message: 'Presigned upload URL created',
          data: {
            uploadUrl: 'https://bucket.s3.amazonaws.com/key?sig=1',
            objectKey: 'org/a/contests/b/creators/c/d.mp4',
            headers: { 'Content-Type': 'video/mp4' },
            expiresInSeconds: 900,
            method: 'PUT',
          },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const result = await presignSubmission({
      contestId: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
      contentType: 'video/mp4',
      fileSizeBytes: 2048,
      durationSeconds: 20,
    });

    assert.equal(captured.method, 'post');
    assert.equal(captured.url, SUBMISSION_API_PATHS.presign);
    const sent = JSON.parse(captured.data ?? '{}');
    assert.equal(sent.file, undefined);
    assert.equal(sent.contentType, 'video/mp4');
    assert.equal(result.success, true);
  });

  it('POST /submissions/complete and GET /submissions/me return the envelope', async () => {
    apiClient.defaults.adapter = (async (config) => {
      const isComplete = config.url === SUBMISSION_API_PATHS.complete;
      return {
        data: {
          success: true,
          message: isComplete
            ? 'Submission created successfully'
            : 'Submissions retrieved successfully',
          data: isComplete
            ? { id: 'sub-1', status: 'PENDING_REVIEW', title: 'Skit' }
            : [{ id: 'sub-1', status: 'PENDING_REVIEW' }],
          errors: null,
        },
        status: isComplete ? 201 : 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const complete = await completeSubmission({
      contestId: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
      objectKey: 'org/a/contests/b/creators/c/d.mp4',
      title: 'Skit',
      durationSeconds: 20,
    });
    assert.equal(complete.success, true);
    if (complete.success && complete.data) {
      assert.equal(complete.data.status, 'PENDING_REVIEW');
    }

    const mine = await listMySubmissions();
    assert.equal(mine.success, true);
    if (mine.success && mine.data) {
      assert.equal(mine.data.length, 1);
    }
  });
});
