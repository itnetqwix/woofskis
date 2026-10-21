import { NextResponse } from 'next/server';
import { siteConfig } from '@/config/site';
import {
  classifyThumbnailTarget,
  fetchSharePreview,
  publicLogoUrl,
} from '@/features/judging/lib/share-metadata';
import { isShareSubmissionId } from '@/features/judging/lib/share-url';

export const revalidate = 300;

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

function imageContentType(header: string | null, url: string): string | null {
  const type = header?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (type.startsWith('image/') && type !== 'image/svg+xml') return type;
  if (type !== '' && type !== 'application/octet-stream' && type !== 'binary/octet-stream') {
    return null;
  }
  let pathname = '';
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  if (/\.jpe?g$/i.test(pathname)) return 'image/jpeg';
  if (/\.png$/i.test(pathname)) return 'image/png';
  if (/\.webp$/i.test(pathname)) return 'image/webp';
  if (/\.gif$/i.test(pathname)) return 'image/gif';
  return null;
}

async function proxyThumbnail(url: string): Promise<NextResponse | null> {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok || response.status >= 300) return null;
    const contentType = imageContentType(response.headers.get('content-type'), url);
    if (!contentType) return null;
    const advertised = Number(response.headers.get('content-length'));
    if (Number.isFinite(advertised) && advertised > MAX_THUMBNAIL_BYTES) return null;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 1 || bytes.byteLength > MAX_THUMBNAIL_BYTES) return null;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return null;
  }
}

function logoRedirect(): NextResponse {
  return NextResponse.redirect(publicLogoUrl(siteConfig.url), 302);
}

/**
 * Stable public image for Open Graph crawlers.
 * The shared page points here instead of a presigned or private object URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isShareSubmissionId(params.id)) {
    return new NextResponse(null, { status: 404 });
  }
  const preview = await fetchSharePreview(params.id);
  if (!preview) return new NextResponse(null, { status: 404 });

  const target = classifyThumbnailTarget(preview.thumbnailUrl);
  if (target.kind === 'redirect') {
    return NextResponse.redirect(target.url, 302);
  }
  if (target.kind === 'proxy') {
    const proxied = await proxyThumbnail(target.url);
    if (proxied) return proxied;
  }
  return logoRedirect();
}
