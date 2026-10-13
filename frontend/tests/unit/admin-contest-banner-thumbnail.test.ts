import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contestBannerSrc,
  DEFAULT_CONTEST_BANNER_URL,
} from '../../src/features/contests/lib/contest-banner';

const root = fileURLToPath(new URL('../..', import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('admin contest list banner thumbnail', () => {
  const tableSource = source('src/features/admin/components/contests-management-table.tsx');
  const thumbnailSource = source('src/features/contests/components/contest-banner-thumbnail.tsx');

  it('uses contestBannerSrc to resolve signed S3 or custom banner URLs, falling back to default', () => {
    assert.equal(contestBannerSrc(null), DEFAULT_CONTEST_BANNER_URL);
    assert.equal(contestBannerSrc(undefined), DEFAULT_CONTEST_BANNER_URL);
    assert.equal(contestBannerSrc(''), DEFAULT_CONTEST_BANNER_URL);
    assert.equal(contestBannerSrc('   '), DEFAULT_CONTEST_BANNER_URL);

    const signedUrl =
      'https://cos-private-bucket.s3.amazonaws.com/contest-banners/1/2.png?X-Amz-Signature=abc';
    assert.equal(contestBannerSrc(signedUrl), signedUrl);

    const customUrl = 'https://cdn.example.com/custom-banner.jpg';
    assert.equal(contestBannerSrc(customUrl), customUrl);
  });

  it('renders ContestBannerThumbnail beside the contest title in the admin table', () => {
    assert.match(tableSource, /import\s*\{\s*ContestBannerThumbnail\s*\}\s*from/);
    assert.match(tableSource, /<ContestBannerThumbnail/);
    assert.match(tableSource, /bannerUrl=\{contest\.bannerUrl\}/);
    assert.match(tableSource, /title=\{contest\.title\}/);
  });

  it('handles image error fallback to the default banner', () => {
    assert.match(thumbnailSource, /onError/);
    assert.match(thumbnailSource, /DEFAULT_CONTEST_BANNER_URL/);
    assert.match(thumbnailSource, /contestBannerSrc/);
  });
});
