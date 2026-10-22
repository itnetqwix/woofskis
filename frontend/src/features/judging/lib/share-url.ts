import { siteConfig } from '@/config/site';

const SHARE_SUBMISSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRIVATE_SHARE_URL =
  /X-Amz-|AWSAccessKeyId|X-Goog-Signature|amazonaws\.com|cloudflarestorage\.com/i;

const VIDEO_PATH = /\.(mp4|webm|mov|m4v)(?:$|\?)/i;

export function isShareSubmissionId(value: string): boolean {
  return SHARE_SUBMISSION_ID.test(value);
}

const LOCAL_SHARE_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/**
 * Public origin used in shared links and Open Graph `og:url`.
 * A configured public `NEXT_PUBLIC_APP_URL` wins over the tab the viewer
 * happens to have open. Local development keeps the browser origin.
 */
export function canonicalShareOrigin(
  browserOrigin?: string | null,
  configuredOrigin: string = siteConfig.url,
): string {
  try {
    const parsed = new URL(configuredOrigin);
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      !LOCAL_SHARE_HOSTS.has(host)
    ) {
      return parsed.origin;
    }
  } catch {
    // Fall through to the browser origin.
  }
  if (browserOrigin) {
    try {
      return new URL(browserOrigin).origin;
    } catch {
      // Fall through to the configured value.
    }
  }
  return configuredOrigin;
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

export interface VideoShareCopy {
  creatorName?: string | null;
  description?: string | null;
}

const SHARE_DESCRIPTION_MAX = 200;

function compactShareText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function shortShareDescription(description: string | null | undefined): string {
  const compact = compactShareText(description);
  if (!compact) return 'Watch and rate this video on Woofskis.';
  if (compact.length <= SHARE_DESCRIPTION_MAX) return compact;
  return `${compact.slice(0, SHARE_DESCRIPTION_MAX - 1).trimEnd()}…`;
}

/**
 * Message body for a shared video: title, creator, and a short description.
 * The public page URL is added by `buildVideoShareMessage`.
 */
export function buildVideoShareText(title: string, copy?: VideoShareCopy): string {
  const trimmed = compactShareText(title);
  const creator = compactShareText(copy?.creatorName);
  const subject = trimmed
    ? creator
      ? `"${trimmed}" by ${creator}`
      : `"${trimmed}"`
    : 'this video';
  return `Watch ${subject} on Woofskis\n${shortShareDescription(copy?.description)}`;
}

/** SMS, WhatsApp, email, and desktop paste body. Uses the public page URL, never a storage URL. */
export function buildVideoShareMessage(title: string, url: string, copy?: VideoShareCopy): string {
  return `${buildVideoShareText(title, copy)}\n${url}`.trim();
}

export function buildSmsShareHref(message: string): string {
  return `sms:?&body=${encodeURIComponent(message)}`;
}

export function buildScoreboardPath(contestId: string): string {
  return `/leaderboard?contest=${encodeURIComponent(contestId)}`;
}
