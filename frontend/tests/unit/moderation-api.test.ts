import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AxiosAdapter } from 'axios';
import { mapAuditLog, mapQueueSubmission } from '../../src/features/admin/lib/map-moderation';
import { apiClient } from '../../src/lib/axios';
import {
  MODERATION_API_PATHS,
  approveModerationSubmission,
  listModerationAuditLogs,
  listModerationQueue,
  rejectModerationSubmission,
  type ApiAuditLog,
  type ApiModerationSubmission,
} from '../../src/services/moderation-api';

const queueRow: ApiModerationSubmission = {
  id: 'dddddddd-dddd-4ddd-8ddd-000000000001',
  contestId: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
  creatorId: 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000aa',
  title: 'Sketch',
  description: 'A bit',
  videoUrl: 'https://bucket.example/sketch.mp4',
  objectKey: 'org/a/contests/b/creators/c/d.mp4',
  thumbnailUrl: null,
  durationSeconds: 20,
  status: 'PENDING_REVIEW',
  rejectionReason: null,
  moderatedById: null,
  moderatedAt: null,
  tags: ['sketch'],
  communityScore: 0,
  totalVotes: 0,
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
  contest: {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
    title: 'Woofskis Open',
    status: 'ACTIVE',
    category: { id: 'cat-1', name: 'Sketch', slug: 'sketch' },
  },
  creator: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-0000000000aa', name: 'Ada Creator' },
};

describe('M07 moderation API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('loads the queue and audit logs from the documented paths', async () => {
    const urls: string[] = [];
    apiClient.defaults.adapter = (async (config) => {
      urls.push(config.url || '');
      const isQueue = config.url === MODERATION_API_PATHS.queue;
      return {
        data: {
          success: true,
          message: isQueue
            ? 'Moderation queue retrieved successfully'
            : 'Audit logs retrieved successfully',
          data: isQueue ? [queueRow] : [],
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const queue = await listModerationQueue();
    const logs = await listModerationAuditLogs();
    assert.deepEqual(urls, [MODERATION_API_PATHS.queue, MODERATION_API_PATHS.auditLogs]);
    assert.equal(queue.success, true);
    assert.equal(queue.data?.[0].status, 'PENDING_REVIEW');
    assert.equal(logs.success, true);
  });

  it('posts approve and reject without sending video bytes', async () => {
    const captured: Array<{ url?: string; data?: string }> = [];
    apiClient.defaults.adapter = (async (config) => {
      captured.push({ url: config.url, data: config.data });
      return {
        data: {
          success: true,
          message: 'ok',
          data: { ...queueRow, status: config.url?.includes('reject') ? 'REJECTED' : 'APPROVED' },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    await approveModerationSubmission(queueRow.id);
    await rejectModerationSubmission(queueRow.id, {
      reason: 'Watermark remains visible',
      reasonCode: 'WATERMARK',
    });

    assert.equal(captured[0].url, MODERATION_API_PATHS.approve(queueRow.id));
    assert.equal(JSON.parse(captured[0].data || '{}').file, undefined);
    const rejectBody = JSON.parse(captured[1].data || '{}');
    assert.equal(rejectBody.reason, 'Watermark remains visible');
    assert.equal(rejectBody.reasonCode, 'WATERMARK');
    assert.equal(rejectBody.video, undefined);
  });

  it('maps queue and audit records without mock media metadata', () => {
    const item = mapQueueSubmission(queueRow);
    assert.equal(item.creatorName, 'Ada Creator');
    assert.equal(item.contestName, 'Woofskis Open');
    assert.equal(item.videoUrl, queueRow.videoUrl);
    assert.equal(item.resolution, '');
    assert.equal(item.complianceChecks.durationCompliant, true);
    assert.equal(item.resolution, '');

    const audit: ApiAuditLog = {
      id: 'audit-1',
      submissionId: queueRow.id,
      actorId: 'cccccccc-cccc-4ccc-8ccc-0000000000aa',
      action: 'REJECT',
      reason: 'Watermark remains visible',
      metadata: {
        previousStatus: 'PENDING_REVIEW',
        newStatus: 'REJECTED',
        reasonCode: 'WATERMARK',
      },
      createdAt: '2026-10-05T12:00:00.000Z',
      actor: { id: 'cccccccc-cccc-4ccc-8ccc-0000000000aa', name: 'Moderator' },
      submission: { id: queueRow.id, title: 'Sketch', creatorName: 'Ada Creator' },
    };
    const mapped = mapAuditLog(audit);
    assert.equal(mapped.action, 'REJECTED');
    assert.equal(mapped.moderatorName, 'Moderator');
    assert.equal(mapped.reasonNote, 'Watermark remains visible');
    assert.equal(mapped.previousStatus, 'PENDING_REVIEW');
    assert.equal(mapped.newStatus, 'REJECTED');
  });
});
