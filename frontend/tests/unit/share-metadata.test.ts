import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyThumbnailTarget,
  shareThumbnailPageUrl,
  videoShareMetadataFromPreview,
} from '../../src/features/judging/lib/share-metadata';

const SUBMISSION_ID = '22222222-2222-4222-8222-222222222221';
const ORIGIN = 'https://woofskis.example';

describe('share preview metadata', () => {
  it('points Open Graph and Twitter images at the stable public thumbnail route', () => {
    const metadata = videoShareMetadataFromPreview(ORIGIN, 'Woofskis', {
      id: SUBMISSION_ID,
      title: 'Park zoomies',
      description: 'A very good dog.',
      thumbnailUrl:
        'https://bucket.s3.us-east-2.amazonaws.com/contests/a/creators/b/c.jpg?X-Amz-Signature=abc&X-Amz-Expires=900',
      creatorName: 'Ada',
    });
    const image = shareThumbnailPageUrl(ORIGIN, SUBMISSION_ID);
    assert.deepEqual(metadata.openGraph?.images, [
      { url: image, secureUrl: image, alt: 'Park zoomies' },
    ]);
    assert.equal(JSON.stringify(metadata).includes('X-Amz-'), false);
    assert.equal(JSON.stringify(metadata).includes('amazonaws.com'), false);
    assert.deepEqual(
      metadata.twitter && 'images' in metadata.twitter ? metadata.twitter.images : null,
      [image]
    );
    assert.equal(metadata.alternates?.canonical, `${ORIGIN}/?v=${SUBMISSION_ID}`);
  });

  it('classifies stable images, presigned downloads, and private keys', () => {
    assert.deepEqual(
      classifyThumbnailTarget('https://media.woofskis.example/v1/contests/a/creators/b/c.jpg'),
      {
        kind: 'redirect',
        url: 'https://media.woofskis.example/v1/contests/a/creators/b/c.jpg',
      }
    );
    const signed =
      'https://bucket.s3.us-east-2.amazonaws.com/contests/a/creators/b/c.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc';
    assert.deepEqual(classifyThumbnailTarget(signed), { kind: 'proxy', url: signed });
    assert.equal(classifyThumbnailTarget('contests/a/creators/b/c.jpg').kind, 'fallback');
    assert.equal(
      classifyThumbnailTarget('https://bucket.s3.amazonaws.com/contests/a/creators/b/c.jpg').kind,
      'fallback'
    );
    assert.equal(
      classifyThumbnailTarget(
        'https://bucket.s3.amazonaws.com/contests/a/creators/b/c.mp4?X-Amz-Signature=abc'
      ).kind,
      'fallback'
    );
    assert.equal(classifyThumbnailTarget('http://127.0.0.1/thumb.jpg').kind, 'fallback');
    assert.equal(classifyThumbnailTarget(null).kind, 'fallback');
  });
});
