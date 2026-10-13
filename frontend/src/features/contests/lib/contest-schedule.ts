/**
 * Wall-clock contest times are interpreted in the contest IANA timezone.
 * Stored values are absolute instants. Intl supplies the offset, including
 * daylight-saving transitions. Fixed UTC offsets are not applied by hand.
 */

export const DEFAULT_CONTEST_TIMEZONE = 'Asia/Kolkata';

export const SUBMISSION_DEADLINE_AFTER_OPENING =
  'Submission deadline must be after submission opening.';

export const VOTING_CLOSURE_AFTER_DEADLINE =
  'Voting closure must be after the submission deadline.';

export function isValidIanaTimeZone(timeZone: string): boolean {
  const trimmed = timeZone.trim();
  if (!trimmed || trimmed.length > 100) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function detectContestTimeZone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && isValidIanaTimeZone(detected)) return detected;
  } catch {
    // Browser timezone is unavailable. Fall through to the default.
  }
  return DEFAULT_CONTEST_TIMEZONE;
}

export function contestTimeZoneOptions(selected?: string): string[] {
  const preferred = [
    selected,
    detectContestTimeZone(),
    'Asia/Kolkata',
    'Asia/Colombo',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Europe/London',
    'UTC',
  ].filter((zone): zone is string => Boolean(zone));
  let discovered: string[] = [];
  try {
    discovered = Intl.supportedValuesOf('timeZone');
  } catch {
    discovered = [];
  }
  return [...new Set([...preferred, ...discovered])].sort((left, right) =>
    left.localeCompare(right)
  );
}

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function readZonedParts(date: Date, timeZone: string): WallParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function offsetMs(date: Date, timeZone: string): number {
  const parts = readZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

export function zonedWallTimeToUtc(wall: string, timeZone: string): Date | null {
  if (!isValidIanaTimeZone(timeZone)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(wall.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? '0');
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = utcGuess - offsetMs(new Date(utcGuess), timeZone);
  const adjusted = utcGuess - offsetMs(new Date(utc), timeZone);
  if (adjusted !== utc) utc = adjusted;

  const result = new Date(utc);
  const back = readZonedParts(result, timeZone);
  if (
    back.year !== year ||
    back.month !== month ||
    back.day !== day ||
    back.hour !== hour ||
    back.minute !== minute ||
    back.second !== second
  ) {
    return null;
  }
  return result;
}

export function utcToZonedWallTime(instant: Date, timeZone: string): string | null {
  if (!isValidIanaTimeZone(timeZone) || Number.isNaN(instant.getTime())) return null;
  const parts = readZonedParts(instant, timeZone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function todayDateTimeLocal(timeZone: string, now = new Date()): string {
  const zone = isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_CONTEST_TIMEZONE;
  const parts = readZonedParts(now, zone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T00:00`;
}

function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function defaultContestSchedule(timeZone: string, now = new Date()) {
  const startDate = todayDateTimeLocal(timeZone, now);
  const openDate = startDate.slice(0, 10);
  return {
    startDate,
    deadlineDate: `${addCalendarDays(openDate, 30)}T23:59`,
    votingCloseDate: `${addCalendarDays(openDate, 35)}T23:59`,
  };
}

export interface ContestScheduleFieldErrors {
  timeZone?: string;
  submissionOpen?: string;
  submissionDeadline?: string;
  votingClosure?: string;
}

export function validateContestWallSchedule(input: {
  timeZone: string;
  submissionOpen: string;
  submissionDeadline: string;
  votingClosure: string;
}): ContestScheduleFieldErrors {
  const errors: ContestScheduleFieldErrors = {};
  if (!isValidIanaTimeZone(input.timeZone)) {
    errors.timeZone = 'Choose a valid timezone.';
  }
  const open = errors.timeZone ? null : zonedWallTimeToUtc(input.submissionOpen, input.timeZone);
  const deadline = errors.timeZone
    ? null
    : zonedWallTimeToUtc(input.submissionDeadline, input.timeZone);
  const voting = errors.timeZone ? null : zonedWallTimeToUtc(input.votingClosure, input.timeZone);

  if (!input.submissionOpen || !open) {
    errors.submissionOpen = 'Enter a valid submission opening in the contest timezone.';
  }
  if (!input.submissionDeadline || !deadline) {
    errors.submissionDeadline = 'Enter a valid submission deadline in the contest timezone.';
  }
  if (!input.votingClosure || !voting) {
    errors.votingClosure = 'Enter a valid voting closure in the contest timezone.';
  }
  if (open && deadline && deadline.getTime() <= open.getTime()) {
    errors.submissionDeadline = SUBMISSION_DEADLINE_AFTER_OPENING;
  }
  if (deadline && voting && voting.getTime() <= deadline.getTime()) {
    errors.votingClosure = VOTING_CLOSURE_AFTER_DEADLINE;
  }
  return errors;
}

export function formatContestInstant(
  iso: string | null | undefined,
  timeZone: string | null | undefined
): string {
  if (!iso) return 'Not scheduled';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  const zone = timeZone && isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_CONTEST_TIMEZONE;
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
  return `${formatted} (${zone})`;
}
