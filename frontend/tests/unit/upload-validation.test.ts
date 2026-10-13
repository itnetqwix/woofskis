import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_FILE_SIZE_BYTES,
  resolveVideoContentType,
  validateVideoDuration,
  validateVideoFile,
} from '../../src/features/submissions/lib/video-constraints';

describe('M06-P04 client video validation', () => {
  it('accepts MP4/WebM/MOV under 100MB and rejects other formats and oversize', () => {
    const mp4 = new File([new Uint8Array(32)], 'clip.mp4', { type: 'video/mp4' });
    const webm = new File([new Uint8Array(32)], 'clip.webm', { type: 'video/webm' });
    const mov = new File([new Uint8Array(32)], 'clip.mov', { type: 'video/quicktime' });
    const movByName = new File([new Uint8Array(32)], 'clip.MOV', { type: '' });
    const avi = new File([new Uint8Array(32)], 'clip.avi', { type: 'video/x-msvideo' });
    const huge = new File([new Uint8Array(8)], 'huge.mp4', { type: 'video/mp4' });
    Object.defineProperty(huge, 'size', { value: MAX_VIDEO_FILE_SIZE_BYTES + 1 });

    assert.equal(validateVideoFile(mp4), null);
    assert.equal(validateVideoFile(webm), null);
    assert.equal(validateVideoFile(mov), null);
    assert.equal(validateVideoFile(movByName), null);
    assert.equal(resolveVideoContentType(mp4), 'video/mp4');
    assert.equal(resolveVideoContentType(webm), 'video/webm');
    assert.equal(resolveVideoContentType(mov), 'video/quicktime');
    assert.equal(resolveVideoContentType(movByName), 'video/quicktime');
    assert.match(validateVideoFile(avi) ?? '', /MP4\/WebM\/MOV/);
    assert.match(validateVideoFile(huge) ?? '', /100MB/);
  });

  it('enforces duration between 1 and 60 seconds', () => {
    assert.equal(validateVideoDuration(1), null);
    assert.equal(validateVideoDuration(MAX_VIDEO_DURATION_SECONDS), null);
    assert.match(validateVideoDuration(0) ?? '', /60/);
    assert.match(validateVideoDuration(61) ?? '', /60/);
  });
});
