import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { buildVideoShareUrl, isShareSubmissionId } from './share-url';

export interface SharePreview {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
}

export type ThumbnailTarget =
  { kind: 'redirect'; url: string } | { kind: 'proxy'; url: string } | { kind: 'fallback' };

const FALLBACK_IMAGE_PATH = '/logo/woofskis_logo_with_dog.png';
const DESCRIPTION_MAX = 200;
const VIDEO_PATH = /\.(mp4|webm|mov|m4v)(?:$|\?)/i;

function isSignedQueryKey(key: string): boolean {
  return (
    /^X-Amz-/i.test(key) ||
    /^X-Goog-(Signature|Algorithm|Credential)$/i.test(key) ||
    /^AWSAccessKeyId$/i.test(key) ||
    /^Signature$/i.test(key)
  );
}

export function shareThumbnailPageUrl(origin: string, submissionId: string): string {
  return new URL(`/media/submissions/${submissionId}/thumbnail`, origin).toString();
}

export function publicLogoUrl(origin: string): string {
  return new URL(FALLBACK_IMAGE_PATH, origin).toString();
}

function isBlockedThumbnailHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (host === '0.0.0.0' || host === '::1') return true;
  if (host.includes(':')) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((part) => part > 255)) return true;
  const [a, b] = octets;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/**
 * How a share-preview thumbnail may be shown to a link crawler.
 * Stable public https images can be redirected to. Expiring signatures are
 * proxied so the page never publishes them. Keys, private buckets, video
 * files, and non-public hosts fall back to the site logo.
 */
export function classifyThumbnailTarget(value: string | null | undefined): ThumbnailTarget {
  const trimmed = value?.trim();
  if (!trimmed) return { kind: 'fallback' };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: 'fallback' };
  }
  if (parsed.username || parsed.password) return { kind: 'fallback' };
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { kind: 'fallback' };
  if (isBlockedThumbnailHost(parsed.hostname)) return { kind: 'fallback' };
  if (VIDEO_PATH.test(parsed.pathname) || VIDEO_PATH.test(trimmed)) return { kind: 'fallback' };

  let signed = false;
  for (const key of parsed.searchParams.keys()) {
    if (isSignedQueryKey(key)) signed = true;
  }
  const host = parsed.hostname.toLowerCase();
  const objectStorage =
    host.endsWith('.amazonaws.com') ||
    host.endsWith('.cloudflarestorage.com') ||
    host.includes('.s3.') ||
    host.includes('.s3-');
  if (objectStorage && !signed) return { kind: 'fallback' };
  if (signed) {
    if (parsed.protocol !== 'https:') return { kind: 'fallback' };
    return { kind: 'proxy', url: parsed.toString() };
  }
  if (parsed.protocol !== 'https:') return { kind: 'fallback' };
  return { kind: 'redirect', url: parsed.toString() };
}

export async function fetchSharePreview(submissionId: string): Promise<SharePreview | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBase || !/^https?:\/\//i.test(apiBase)) return null;
  try {
    const response = await fetch(
      `${apiBase}/submissions/${encodeURIComponent(submissionId)}/share-preview`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) }
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: SharePreview };
    return body.data ?? null;
  } catch {
    return null;
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Open Graph and Twitter tags for a shared `/?v=<submissionId>` link.
 * Returns null when the id is not a public approved video, so the page
 * keeps its default metadata.
 */
export function videoShareMetadataFromPreview(
  origin: string,
  siteName: string,
  preview: SharePreview
): Metadata {
  const pageUrl = buildVideoShareUrl(origin, preview.id);
  const image = shareThumbnailPageUrl(origin, preview.id);
  const title = preview.creatorName ? `${preview.title} by ${preview.creatorName}` : preview.title;
  const description = truncate(
    preview.description?.trim() || `Watch and rate this video on ${siteName}.`,
    DESCRIPTION_MAX
  );

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      siteName,
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: image,
          ...(image.startsWith('https:') ? { secureUrl: image } : {}),
          alt: preview.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export async function buildVideoShareMetadata(
  submissionId: string | undefined
): Promise<Metadata | null> {
  if (!submissionId || !isShareSubmissionId(submissionId)) return null;
  const preview = await fetchSharePreview(submissionId);
  if (!preview) return null;
  return videoShareMetadataFromPreview(siteConfig.url, siteConfig.name, preview);
}
