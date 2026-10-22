import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyThumbnailTarget,
  renderSharePreviewDocument,
  shareThumbnailPageUrl,
  thumbnailDelivery,
  videoShareMetadataFromPreview,
} from '../../src/features/judging/lib/share-metadata';
import {
  isLinkPreviewCrawler,
  shouldServeSharePreviewDocument,
} from '../../src/features/judging/lib/share-crawler';

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
    assert.equal(metadata.openGraph?.type, 'website');
    assert.equal(metadata.openGraph?.url, `${ORIGIN}/?v=${SUBMISSION_ID}`);
    assert.equal(metadata.openGraph?.title, 'Park zoomies by Ada');
    assert.equal(metadata.openGraph?.description, 'A very good dog.');
    assert.equal(
      metadata.twitter && 'card' in metadata.twitter ? metadata.twitter.card : null,
      'summary_large_image',
    );
  });

  it('builds distinct tags for each video and falls back without a thumbnail url', () => {
    const videos = [
      {
        id: SUBMISSION_ID,
        title: 'Park zoomies',
        description: 'A very good dog.',
        thumbnailUrl: null,
        creatorName: 'Ada',
      },
      {
        id: '33333333-3333-4333-8333-333333333331',
        title: 'Couch patrol',
        description: 'Night shift on the sofa.',
        thumbnailUrl: 'https://media.woofskis.example/v1/contests/a/creators/b/c.jpg',
        creatorName: 'Bea',
      },
    ];
    const documents = videos.map((video) => {
      const metadata = videoShareMetadataFromPreview(ORIGIN, 'Woofskis', video);
      const image = shareThumbnailPageUrl(ORIGIN, video.id);
      const html = renderSharePreviewDocument(ORIGIN, 'Woofskis', video);
      assert.equal(metadata.openGraph?.title, `${video.title} by ${video.creatorName}`);
      assert.equal(metadata.openGraph?.description, video.description);
      assert.equal(metadata.openGraph?.url, `${ORIGIN}/?v=${video.id}`);
      assert.equal(metadata.openGraph?.type, 'website');
      assert.deepEqual(metadata.openGraph?.images, [
        { url: image, secureUrl: image, alt: video.title },
      ]);
      assert.match(html, new RegExp(`<meta property="og:title" content="${video.title} by ${video.creatorName}">`));
      assert.match(html, new RegExp(`<meta property="og:description" content="${video.description}">`));
      assert.match(html, /<meta property="og:type" content="website">/);
      assert.match(html, new RegExp(`<meta property="og:image" content="${image}">`));
      assert.match(html, new RegExp(`<meta property="og:url" content="${ORIGIN}/\\?v=${video.id}">`));
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
      assert.match(html, new RegExp(`<meta name="twitter:image" content="${image}">`));
      assert.equal(html.includes('X-Amz-'), false);
      assert.equal(html.includes('amazonaws.com'), false);
      return html;
    });
    assert.equal(documents[0].includes('Couch patrol'), false);
    assert.equal(documents[1].includes('Park zoomies'), false);
  });

  it('escapes video text inside the crawler document', () => {
    const html = renderSharePreviewDocument(ORIGIN, 'Woofskis', {
      id: SUBMISSION_ID,
      title: 'Tom & <Jerry>',
      description: 'Quotes "welcome"',
      thumbnailUrl: null,
      creatorName: 'Ada',
    });
    assert.match(html, /content="Tom &amp; &lt;Jerry&gt; by Ada"/);
    assert.equal(html.includes('<Jerry>'), false);
  });

  it('proxies images and never redirects a signed download', () => {
    const signed = {
      kind: 'proxy' as const,
      url: 'https://bucket.s3.amazonaws.com/a.jpg?X-Amz-Signature=abc',
    };
    const pub = { kind: 'redirect' as const, url: 'https://media.woofskis.example/v1/a.jpg' };
    assert.equal(thumbnailDelivery(signed, true), 'proxy');
    assert.equal(thumbnailDelivery(signed, false), 'logo');
    assert.equal(thumbnailDelivery(pub, true), 'proxy');
    assert.equal(thumbnailDelivery(pub, false), 'redirect');
    assert.equal(thumbnailDelivery({ kind: 'fallback' }, false), 'logo');
  });

  it('recognizes link-preview crawlers and ignores normal browsers', () => {
    const bots = [
      'WhatsApp/2.23.20.0',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Twitterbot/1.0',
      'TelegramBot (like TwitterBot)',
      'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
      'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      'LinkedInBot/1.0 (compatible; Mozilla/5.0; Jakarta Commons-HttpClient/3.1 +http://www.linkedin.com)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1)',
    ];
    for (const ua of bots) assert.equal(isLinkPreviewCrawler(ua), true, ua);
    assert.equal(shouldServeSharePreviewDocument('WhatsApp/2.23.20.0'), false);
    assert.equal(shouldServeSharePreviewDocument(bots[1]), true);
    assert.equal(
      isLinkPreviewCrawler(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
      false,
    );
    assert.equal(isLinkPreviewCrawler(''), false);
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
