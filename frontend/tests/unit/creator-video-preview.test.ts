import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const thumbCardSource = readFileSync(
  new URL('../../src/components/common/video-thumbnail-card.tsx', import.meta.url),
  'utf8'
);

const submissionsTableSource = readFileSync(
  new URL('../../src/features/submissions/components/submissions-table.tsx', import.meta.url),
  'utf8'
);

const leaderboardTableSource = readFileSync(
  new URL('../../src/features/leaderboard/components/leaderboard-table.tsx', import.meta.url),
  'utf8'
);

const videoModalSource = readFileSync(
  new URL('../../src/features/submissions/components/video-preview-modal.tsx', import.meta.url),
  'utf8'
);

describe('Creator Dashboard video preview behavior & shared components', () => {
  it('1. VideoThumbnailCard supports intersection-observed muted autoPlay video playback', () => {
    assert.match(thumbCardSource, /IntersectionObserver/);
    assert.match(thumbCardSource, /muted/);
    assert.match(thumbCardSource, /autoPlay/);
    assert.match(thumbCardSource, /loop/);
    assert.match(thumbCardSource, /playsInline/);
    assert.match(thumbCardSource, /preload="metadata"/);
    assert.match(thumbCardSource, /onError=\{.+setVideoFailed/);
  });

  it('2. VideoThumbnailCard falls back gracefully to thumbnail poster or gradient placeholder', () => {
    assert.match(thumbCardSource, /poster=/);
    assert.match(thumbCardSource, /onError=\{.+setThumbFailed/);
    assert.match(thumbCardSource, /Film className=/);
  });

  it('3. SubmissionsTable reuses VideoThumbnailCard for table and grid views', () => {
    assert.match(submissionsTableSource, /VideoThumbnailCard/);
    // Table view usage
    assert.match(submissionsTableSource, /<VideoThumbnailCard[\s\S]*?className="h-16 w-11"/);
    // Grid view usage
    assert.match(
      submissionsTableSource,
      /<VideoThumbnailCard[\s\S]*?className="h-24 w-16 rounded-xl"/
    );
  });

  it('4. LeaderboardTable reuses shared VideoThumbnailCard component', () => {
    assert.match(leaderboardTableSource, /VideoThumbnailCard/);
    assert.match(leaderboardTableSource, /<VideoThumbnailCard[\s\S]*?className="h-14 w-10"/);
  });

  it('5. VideoPreviewModal includes standard player controls (play/pause, seek scrubber, volume/mute, fullscreen)', () => {
    // Play / Pause
    assert.match(videoModalSource, /togglePlay/);
    assert.match(videoModalSource, /Pause/);
    // Seek Scrubber
    assert.match(videoModalSource, /progressBarRef/);
    assert.match(videoModalSource, /handleScrub/);
    assert.match(videoModalSource, /progressPercent/);
    // Volume / Mute
    assert.match(videoModalSource, /toggleMute/);
    assert.match(videoModalSource, /Volume2/);
    assert.match(videoModalSource, /VolumeX/);
    // Fullscreen
    assert.match(videoModalSource, /toggleFullscreen/);
    assert.match(videoModalSource, /Maximize2/);
    assert.match(videoModalSource, /Minimize2/);
    // Proper pause and cleanup on close / unmount
    assert.match(videoModalSource, /video\.pause\(\)/);
    // Escape and close support
    assert.match(videoModalSource, /onOpenChange/);
  });

  it('6. VideoPreviewModal gracefully handles playback errors and unavailable streams', () => {
    assert.match(videoModalSource, /videoError/);
    assert.match(videoModalSource, /Video Stream Unavailable/);
  });
});
