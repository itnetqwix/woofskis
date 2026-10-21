import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const creatorPage = readFileSync(
  new URL('../../src/app/(dashboard)/creator/page.tsx', import.meta.url),
  'utf8'
);
const contestBoard = readFileSync(
  new URL('../../src/features/submissions/components/creator-contest-board.tsx', import.meta.url),
  'utf8'
);
const shareSheet = readFileSync(
  new URL('../../src/features/judging/components/share-sheet.tsx', import.meta.url),
  'utf8'
);

describe('creator studio tabs and contest cards', () => {
  it('shows one studio section at a time and defaults to metrics', () => {
    assert.match(creatorPage, /useState<CreatorStudioTab>\('metrics'\)/);
    assert.match(creatorPage, /Performance Overview & Metrics/);
    assert.match(creatorPage, /label: 'Contests'/);
    assert.match(creatorPage, /label: 'Your Submissions'/);
    assert.match(creatorPage, /role="tablist"/);
    assert.match(creatorPage, /hidden=\{tab !== 'metrics'\}/);
    assert.match(creatorPage, /hidden=\{tab !== 'contests'\}/);
    assert.match(creatorPage, /hidden=\{tab !== 'submissions'\}/);
    assert.match(creatorPage, /setTab\('submissions'\)/);
  });

  it('opens contest details in a dialog and reuses the existing presentation', () => {
    assert.match(contestBoard, /contestBannerSrc/);
    assert.match(contestBoard, /<ContestPresentation/);
    assert.match(contestBoard, /aria-haspopup="dialog"/);
    assert.match(contestBoard, /<Dialog /);
    assert.match(contestBoard, /Submit entry/);
    assert.match(contestBoard, /Uploads are accepted only while the contest status is ACTIVE/);
    assert.match(creatorPage, /onSubmitEntry=\{handleSubmitToContest\}/);
  });
});

describe('video message share', () => {
  it('adds Message and only shares a public page url', () => {
    assert.match(shareSheet, /label: 'Message'/);
    assert.match(shareSheet, /shareWithNativeTarget/);
    assert.match(shareSheet, /shouldUseDesktopShareFallback/);
    assert.match(shareSheet, /buildSmsShareHref/);
    assert.match(shareSheet, /isPublicSharePageUrl/);
    assert.match(shareSheet, /label: 'Copy Link'|label: copied \? 'Copied' : 'Copy Link'/);
    assert.match(shareSheet, /label: 'WhatsApp'/);
    assert.match(shareSheet, /label: 'Email'/);
    assert.match(shareSheet, /label: 'Facebook'/);
  });
});
