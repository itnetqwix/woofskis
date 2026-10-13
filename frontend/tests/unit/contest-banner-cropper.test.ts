import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTEST_BANNER_ASPECT_RATIO,
  isBannerAspectRatio,
  computeBannerCropRect,
  createCroppedBannerFile,
  validateBannerFile,
} from '../../src/features/contests/lib/contest-banner';

describe('contest banner crop calculations', () => {
  it('defines contest banner aspect ratio matching presentation card', () => {
    assert.equal(CONTEST_BANNER_ASPECT_RATIO, 720 / 208);
    assert.ok(CONTEST_BANNER_ASPECT_RATIO > 3.4 && CONTEST_BANNER_ASPECT_RATIO < 3.5);
  });

  it('detects images that already match the contest banner aspect ratio', () => {
    // Exact multiples of 720x208
    assert.equal(isBannerAspectRatio(720, 208), true);
    assert.equal(isBannerAspectRatio(1440, 416), true);
    assert.equal(isBannerAspectRatio(2160, 624), true);

    // Within standard 3% tolerance
    assert.equal(isBannerAspectRatio(346, 100), true);

    // Square, landscape 16:9, vertical 9:16, standard 4:3 do not match
    assert.equal(isBannerAspectRatio(1000, 1000), false); // 1:1
    assert.equal(isBannerAspectRatio(1920, 1080), false); // 16:9
    assert.equal(isBannerAspectRatio(1080, 1920), false); // 9:16
    assert.equal(isBannerAspectRatio(1600, 1200), false); // 4:3

    // Invalid dimensions
    assert.equal(isBannerAspectRatio(0, 100), false);
    assert.equal(isBannerAspectRatio(100, 0), false);
    assert.equal(isBannerAspectRatio(-720, 208), false);
  });

  it('computes full image crop for matching aspect ratio at default zoom and center', () => {
    const crop = computeBannerCropRect(1440, 416, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      viewportWidth: 720,
      viewportHeight: 208,
    });

    assert.equal(crop.x, 0);
    assert.equal(crop.y, 0);
    assert.equal(crop.width, 1440);
    assert.equal(crop.height, 416);
  });

  it('centers crop vertically on a taller 4:3 image at zoom 1', () => {
    // 1600 x 1200 image in a 720x208 viewport
    const crop = computeBannerCropRect(1600, 1200, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      viewportWidth: 720,
      viewportHeight: 208,
    });

    // Width should span the full image (1600)
    assert.equal(crop.x, 0);
    assert.equal(crop.width, 1600);

    // Expected height: 1600 / (720/208) = 462.22 -> 462
    assert.equal(crop.height, Math.round(1600 / CONTEST_BANNER_ASPECT_RATIO));

    // Y should be centered: (1200 - 462) / 2 = 369
    const expectedY = Math.round((1200 - 1600 / CONTEST_BANNER_ASPECT_RATIO) / 2);
    assert.equal(crop.y, expectedY);
    assert.ok(crop.y > 0);
    assert.ok(crop.y + crop.height <= 1200);
  });

  it('repositions crop when offset is applied and clamps within boundaries', () => {
    // Pan up / down
    const cropUp = computeBannerCropRect(1600, 1200, {
      zoom: 1,
      offsetX: 0,
      offsetY: 500, // Large pan offset
      viewportWidth: 720,
      viewportHeight: 208,
    });

    // Offset clamped to top or bottom
    assert.ok(cropUp.y >= 0);
    assert.ok(cropUp.y + cropUp.height <= 1200);

    const cropDown = computeBannerCropRect(1600, 1200, {
      zoom: 1,
      offsetX: 0,
      offsetY: -500,
      viewportWidth: 720,
      viewportHeight: 208,
    });
    assert.ok(cropDown.y >= 0);
    assert.ok(cropDown.y + cropDown.height <= 1200);
  });

  it('scales crop rect inversely with zoom level', () => {
    const crop1x = computeBannerCropRect(1440, 416, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      viewportWidth: 720,
      viewportHeight: 208,
    });
    const crop2x = computeBannerCropRect(1440, 416, {
      zoom: 2,
      offsetX: 0,
      offsetY: 0,
      viewportWidth: 720,
      viewportHeight: 208,
    });

    assert.equal(crop2x.width, Math.round(crop1x.width / 2));
    assert.equal(crop2x.height, Math.round(crop1x.height / 2));
    assert.ok(crop2x.x > 0);
    assert.ok(crop2x.y > 0);
  });

  it('creates cropped banner File object with valid attributes', () => {
    const fakeBlob = new Blob(['sample-image-data'], { type: 'image/png' });
    const file = createCroppedBannerFile(fakeBlob, 'my-event.png', 'image/png');

    assert.equal(file.name, 'my-event-cropped.png');
    assert.equal(file.type, 'image/png');
    assert.equal(file.size, fakeBlob.size);
    assert.equal(validateBannerFile(file), null);

    const jpegFile = createCroppedBannerFile(fakeBlob, 'photo.jpeg', 'image/jpeg');
    assert.equal(jpegFile.name, 'photo-cropped.jpg');
    assert.equal(jpegFile.type, 'image/jpeg');
    assert.equal(validateBannerFile(jpegFile), null);
  });
});
