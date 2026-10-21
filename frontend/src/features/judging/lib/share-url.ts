const SHARE_SUBMISSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRIVATE_SHARE_URL =
  /X-Amz-|AWSAccessKeyId|X-Goog-Signature|amazonaws\.com|cloudflarestorage\.com/i;

const VIDEO_PATH = /\.(mp4|webm|mov|m4v)(?:$|\?)/i;

export function isShareSubmissionId(value: string): boolean {
  return SHARE_SUBMISSION_ID.test(value);
}

/** Share link for one submission on the live judging route. */
export function buildVideoShareUrl(origin: string, submissionId: string): string {
  const url = new URL('/', origin);
  url.searchParams.set('v', submissionId);
  return url.toString();
}

/**
 * True when the URL is the public judging page for one submission.
 * Presigned downloads, object-storage hosts, and video files are rejected.
 */
export function isPublicSharePageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.pathname !== '/' && parsed.pathname !== '') return false;
  const submissionId = parsed.searchParams.get('v') ?? '';
  if (!isShareSubmissionId(submissionId)) return false;
  if (PRIVATE_SHARE_URL.test(parsed.toString())) return false;
  if (VIDEO_PATH.test(parsed.pathname)) return false;
  return true;
}

/** Short line included with a shared video. The public URL is passed separately. */
export function buildVideoShareText(title: string): string {
  const trimmed = title.trim();
  return trimmed ? `Watch "${trimmed}" on Woofskis` : 'Watch this video on Woofskis';
}

/** SMS and desktop paste body. Uses the public page URL, never a storage URL. */
export function buildVideoShareMessage(title: string, url: string): string {
  return `${buildVideoShareText(title)} ${url}`.trim();
}

export function buildSmsShareHref(message: string): string {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

export function buildScoreboardPath(contestId: string): string {
  return `/leaderboard?contest=${encodeURIComponent(contestId)}`;
}
