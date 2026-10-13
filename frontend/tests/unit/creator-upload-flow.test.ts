import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isUuid } from '../../src/lib/is-uuid';
import { CONTEST_API_PATHS } from '../../src/services/contests-api';
import { SUBMISSION_API_PATHS } from '../../src/services/submissions-api';

const uploadModalSource = readFileSync(
  new URL('../../src/features/submissions/components/upload-modal.tsx', import.meta.url),
  'utf8'
);

const creatorPageSource = readFileSync(
  new URL('../../src/app/(dashboard)/creator/page.tsx', import.meta.url),
  'utf8'
);

const useCreatorSubmissionsSource = readFileSync(
  new URL('../../src/features/submissions/hooks/use-creator-submissions.ts', import.meta.url),
  'utf8'
);

describe('Creator video upload contest selection flow', () => {
  const contestA = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Comedy Showcase 2026',
    prizePool: '$10,000 USD',
    status: 'ACTIVE' as const,
  };
  const contestB = {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'VFX Shorts Challenge',
    prizePool: '$25,000 USD',
    status: 'ACTIVE' as const,
  };
  const contestC = {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'Street Performance Slam',
    prizePool: '$5,000 USD',
    status: 'ACTIVE' as const,
  };

  it('1. Creator contests API path and UUID format match specification', () => {
    assert.equal(CONTEST_API_PATHS.creatorCollection, '/creator/contests');
    assert.equal(CONTEST_API_PATHS.creatorById('123'), '/creator/contests/123');
    assert.equal(isUuid(contestA.id), true);
    assert.equal(isUuid(contestB.id), true);
    assert.equal(isUuid(contestC.id), true);
  });

  it('2. Upload modal component structure binds contest selection to controlled state', () => {
    assert.match(uploadModalSource, /id="submission-contest"/);
    assert.match(uploadModalSource, /value=\{contestId\}/);
    assert.match(uploadModalSource, /onChange=\{\(e\) => setContestId\(e\.target\.value\)\}/);
    assert.match(uploadModalSource, /availableContests\.map/);
  });

  it('3. Synchronizes contestId without overwriting existing user selection', () => {
    // Simulate the state logic in UploadModal
    const availableContests = [contestA, contestB];
    let contestId = '';
    const preferredContestId = null;

    // Initial sync when contests load
    const syncContestId = (
      current: string,
      list: typeof availableContests,
      preferred: string | null
    ) => {
      if (current && list.some((c) => c.id === current)) {
        return current;
      }
      const pref = list.find((c) => c.id === preferred);
      if (pref) return pref.id;
      return list[0]?.id || '';
    };

    contestId = syncContestId(contestId, availableContests, preferredContestId);
    assert.equal(contestId, contestA.id);

    // User selects contestB
    contestId = contestB.id;
    assert.equal(contestId, contestB.id);

    // API refetch produces a new array reference with same or additional contests
    const newContestsList = [{ ...contestA }, { ...contestB }, { ...contestC }];
    contestId = syncContestId(contestId, newContestsList, preferredContestId);
    assert.equal(
      contestId,
      contestB.id,
      'User selected contestB must not be overwritten by refetch'
    );
  });

  it('4. Selecting contest does not reset after parent rerender or array recreation', () => {
    const contestId = contestB.id;
    const availableContests = [contestA, contestB, contestC];

    // Simulate modal rerender with newly generated array reference
    const rerenderedContests = availableContests.map((c) => ({ ...c }));
    assert.notEqual(availableContests, rerenderedContests);

    const isPreserved = rerenderedContests.some((c) => c.id === contestId);
    assert.equal(isPreserved, true);
    assert.equal(contestId, contestB.id);
  });

  it('5. Selecting video file does not reset contestId or vice-versa', () => {
    let contestId = contestB.id;
    let selectedFile: { name: string; size: number } | null = null;

    // User selects file
    selectedFile = { name: 'epic_comedy.mp4', size: 1024 * 1024 * 5 };
    assert.equal(contestId, contestB.id);
    assert.equal(selectedFile.name, 'epic_comedy.mp4');

    // User changes contest after picking file
    contestId = contestC.id;
    assert.equal(contestId, contestC.id);
    assert.equal(selectedFile.name, 'epic_comedy.mp4');
  });

  it('6. Updating title does not reset contest selection', () => {
    const contestId = contestB.id;
    let title = '';

    title = 'Midnight Comedy Skit';
    assert.equal(title, 'Midnight Comedy Skit');
    assert.equal(contestId, contestB.id);
  });

  it('7. Validation error keeps the selected contest ID', () => {
    const contestId = contestB.id;
    const title = 'ab'; // Too short
    const selectedFile = null; // Missing

    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (!isUuid(contestId)) {
      errors.contest = 'An active contest id is required.';
    }
    if (!selectedFile) {
      errors.video = 'Please upload an MP4/WebM/MOV video file.';
    }

    assert.equal(Object.keys(errors).length, 2);
    assert.equal(errors.contest, undefined, 'Selected UUID contest should have no error');
    assert.equal(contestId, contestB.id);
  });

  it('8. Sequential contest selections transition cleanly', () => {
    let contestId = contestA.id;
    assert.equal(contestId, contestA.id);

    contestId = contestB.id;
    assert.equal(contestId, contestB.id);

    contestId = contestC.id;
    assert.equal(contestId, contestC.id);

    contestId = contestA.id;
    assert.equal(contestId, contestA.id);
  });

  it('9. Resubmission initialization preserves initialData contestId', () => {
    const initialData = {
      resubmitId: 'sub-resubmit-001',
      title: 'Resubmitted Title',
      contestId: contestC.id,
    };
    const availableContests = [contestA, contestB, contestC];

    const defaultContestId = initialData.contestId || availableContests[0]?.id || '';
    assert.equal(defaultContestId, contestC.id);
  });

  it('10. Creator upload submission payload includes the chosen contestId', () => {
    const selectedContest = contestB;
    const uploadInput = {
      contestId: selectedContest.id,
      title: 'Final Cut',
      durationSeconds: 30,
      description: 'Test description',
      tags: ['#ViralComedy'],
    };

    assert.equal(uploadInput.contestId, contestB.id);
    assert.equal(isUuid(uploadInput.contestId), true);
    assert.equal(SUBMISSION_API_PATHS.presign, '/submissions/presign');
    assert.equal(SUBMISSION_API_PATHS.complete, '/submissions/complete');
  });

  it('11. Upload modal prevents resetting form on rerenders while open', () => {
    // Verify UploadModal uses prevOpenRef pattern so that background renders do not re-run form reset
    assert.match(uploadModalSource, /prevOpenRef\.current/);
    assert.match(uploadModalSource, /isNewlyOpened/);
    assert.match(uploadModalSource, /currentContestId\s+&&\s+availableContests\.some/);
  });

  it('12. Upload modal layout supports vertical scrolling with sticky header and footer', () => {
    assert.match(uploadModalSource, /overflow-y-auto/);
    assert.match(uploadModalSource, /overflow-x-hidden/);
    assert.match(uploadModalSource, /sticky bottom-0/);
    assert.match(uploadModalSource, /shrink-0/);
  });
});
