import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { buildVideoShareUrl } from './share-url';

interface SharePreview {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_IMAGE_PATH = '/logo/woofskis_logo_with_dog.png';
const DESCRIPTION_MAX = 200;

async function fetchSharePreview(submissionId: string): Promise<SharePreview | null> {
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
export async function buildVideoShareMetadata(
  submissionId: string | undefined
): Promise<Metadata | null> {
  if (!submissionId || !UUID_PATTERN.test(submissionId)) return null;
  const preview = await fetchSharePreview(submissionId);
  if (!preview) return null;

  const pageUrl = buildVideoShareUrl(siteConfig.url, preview.id);
  const thumbnail = preview.thumbnailUrl?.trim();
  const image =
    thumbnail && /^https:\/\//i.test(thumbnail)
      ? thumbnail
      : new URL(FALLBACK_IMAGE_PATH, siteConfig.url).toString();
  const title = preview.creatorName
    ? `${preview.title} by ${preview.creatorName}`
    : preview.title;
  const description = truncate(
    preview.description?.trim() || `Watch and rate this video on ${siteConfig.name}.`,
    DESCRIPTION_MAX
  );

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      url: pageUrl,
      title,
      description,
      images: [{ url: image, alt: preview.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
