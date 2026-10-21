import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBMISSION_DEADLINE_AFTER_OPENING,
  VOTING_CLOSURE_AFTER_DEADLINE,
  SUBMISSION_OPEN_BEFORE_TODAY,
  SUBMISSION_OPEN_BEFORE_NOW,
  defaultContestSchedule,
  todayDateTimeLocal,
  utcToZonedWallTime,
  validateContestWallSchedule,
  validateSubmissionOpenAgainstNow,
  zonedWallTimeToUtc,
} from '../../src/features/contests/lib/contest-schedule';
import {
  contestBannerSrc,
  validateBannerFile,
} from '../../src/features/contests/lib/contest-banner';
import { contestPresentationFromFields } from '../../src/features/contests/lib/contest-presentation';
import { buildContestMetadata } from '../../src/features/leaderboard/lib/leaderboard-flow';

const NOW = new Date('2026-10-11T03:30:00.000Z');

describe('contest schedule defaults and ordering', () => {
  it('defaults submission opening to today in the selected timezone', () => {
    assert.equal(todayDateTimeLocal('Asia/Kolkata', NOW), '2026-10-11T00:00');
    assert.equal(todayDateTimeLocal('Asia/Colombo', NOW), '2026-10-11T00:00');
    assert.equal(todayDateTimeLocal('America/New_York', NOW), '2026-10-10T00:00');
    assert.equal(defaultContestSchedule('Asia/Kolkata', NOW).startDate, '2026-10-11T00:00');
    const again = defaultContestSchedule('Asia/Kolkata', NOW);
    assert.equal(again.deadlineDate > again.startDate, true);
    assert.equal(again.votingCloseDate > again.deadlineDate, true);
  });

  it('converts Kolkata, Colombo, and New York including daylight saving', () => {
    assert.equal(
      zonedWallTimeToUtc('2026-10-11T00:00', 'Asia/Kolkata')?.toISOString(),
      '2026-10-10T18:30:00.000Z'
    );
    assert.equal(
      zonedWallTimeToUtc('2026-10-11T00:00', 'Asia/Colombo')?.toISOString(),
      '2026-10-10T18:30:00.000Z'
    );
    assert.equal(
      zonedWallTimeToUtc('2026-01-15T12:00', 'America/New_York')?.toISOString(),
      '2026-01-15T17:00:00.000Z'
    );
    const summer = zonedWallTimeToUtc('2026-07-15T12:00', 'America/New_York');
    assert.equal(summer?.toISOString(), '2026-07-15T16:00:00.000Z');
    assert.equal(utcToZonedWallTime(summer!, 'America/New_York'), '2026-07-15T12:00');
    assert.equal(zonedWallTimeToUtc('2026-03-08T02:30', 'America/New_York'), null);
  });

  it('rejects equal timestamps with field-specific messages', () => {
    const equal = validateContestWallSchedule({
      timeZone: 'Asia/Kolkata',
      submissionOpen: '2026-10-11T00:00',
      submissionDeadline: '2026-10-11T00:00',
      votingClosure: '2026-10-12T00:00',
    });
    assert.equal(equal.submissionDeadline, SUBMISSION_DEADLINE_AFTER_OPENING);

    const voting = validateContestWallSchedule({
      timeZone: 'America/New_York',
      submissionOpen: '2026-07-15T12:00',
      submissionDeadline: '2026-07-16T12:00',
      votingClosure: '2026-07-16T12:00',
    });
    assert.equal(voting.votingClosure, VOTING_CLOSURE_AFTER_DEADLINE);
    assert.equal(voting.submissionDeadline, undefined);

    const valid = validateContestWallSchedule({
      timeZone: 'Asia/Colombo',
      submissionOpen: '2026-10-11T00:00',
      submissionDeadline: '2026-10-12T00:00',
      votingClosure: '2026-10-13T00:00',
    });
    assert.deepEqual(valid, {});
  });

  it('validates submission open against the current time in the selected timezone', () => {
    // Current time: 2026-10-21 14:30 EDT (18:30 UTC) in America/New_York
    const now = new Date('2026-10-21T18:30:00.000Z');
    const timeZone = 'America/New_York';

    // A date before today (2026-10-20): reject with clear alert
    assert.equal(
      validateSubmissionOpenAgainstNow('2026-10-20T14:30', timeZone, now),
      SUBMISSION_OPEN_BEFORE_TODAY
    );

    // Today earlier than current time (14:00 < 14:30): reject
    assert.equal(
      validateSubmissionOpenAgainstNow('2026-10-21T14:00', timeZone, now),
      SUBMISSION_OPEN_BEFORE_NOW
    );

    // Today at current time (14:30): allow
    assert.equal(
      validateSubmissionOpenAgainstNow('2026-10-21T14:30', timeZone, now),
      null
    );

    // Today after current time (15:00): allow
    assert.equal(
      validateSubmissionOpenAgainstNow('2026-10-21T15:00', timeZone, now),
      null
    );

    // Future date: allow
    assert.equal(
      validateSubmissionOpenAgainstNow('2026-10-25T10:00', timeZone, now),
      null
    );

    // Integrated into validateContestWallSchedule when option enabled
    const beforeTodaySchedule = validateContestWallSchedule(
      {
        timeZone,
        submissionOpen: '2026-10-20T14:30',
        submissionDeadline: '2026-10-22T14:30',
        votingClosure: '2026-10-23T14:30',
      },
      { checkSubmissionOpenAgainstNow: true, now }
    );
    assert.equal(beforeTodaySchedule.submissionOpen, SUBMISSION_OPEN_BEFORE_TODAY);
  });
});

describe('contest banner presentation', () => {
  it('falls back when a banner is missing and keeps a custom banner', () => {
    assert.match(contestBannerSrc(null), /unsplash\.com/);
    assert.equal(
      contestBannerSrc('https://cdn.example/banner.jpg'),
      'https://cdn.example/banner.jpg'
    );
    const missing = contestPresentationFromFields({
      title: 'Legacy',
      timezone: '',
      bannerUrl: null,
      votingClosesAt: null,
    });
    assert.equal(missing.timezone, 'Asia/Kolkata');
    assert.match(missing.bannerSrc, /unsplash\.com/);
    assert.equal(missing.votingClosesAt, null);

    const custom = contestPresentationFromFields({
      title: 'Custom',
      bannerUrl: 'https://cdn.example/a.jpg',
      timezone: 'America/New_York',
    });
    assert.equal(custom.bannerSrc, 'https://cdn.example/a.jpg');
    assert.equal(custom.timezone, 'America/New_York');
  });

  it('rejects an unsupported or oversized banner file', () => {
    assert.match(
      validateBannerFile({ name: 'clip.mp4', type: 'video/mp4', size: 10 }) || '',
      /JPEG/
    );
    assert.match(
      validateBannerFile({ name: 'big.png', type: 'image/png', size: 100 * 1024 * 1024 + 1 }) || '',
      /100MB/
    );
    assert.equal(validateBannerFile({ name: 'ok.png', type: 'image/png', size: 2048 }), null);
  });

  it('maps the leaderboard contest banner instead of another contest', () => {
    const first = buildContestMetadata({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'First',
      status: 'ACTIVE',
      bannerUrl: 'https://cdn.example/first.jpg',
      timezone: 'Asia/Colombo',
      startDate: '2026-10-10T18:30:00.000Z',
      endDate: '2026-10-20T18:30:00.000Z',
      votingClosesAt: '2026-10-25T18:30:00.000Z',
      description: 'First description',
      prizeSummary: '1000 USD',
    });
    const second = buildContestMetadata({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Second',
      status: 'JUDGING',
      bannerUrl: 'https://cdn.example/second.jpg',
    });
    assert.equal(first.bannerUrl, 'https://cdn.example/first.jpg');
    assert.equal(first.timezone, 'Asia/Colombo');
    assert.equal(first.votingClosesAt, '2026-10-25T18:30:00.000Z');
    assert.equal(first.description, 'First description');
    assert.equal(second.bannerUrl, 'https://cdn.example/second.jpg');
    assert.notEqual(first.bannerUrl, second.bannerUrl);
    assert.equal(second.timezone, 'Asia/Kolkata');
  });
});
