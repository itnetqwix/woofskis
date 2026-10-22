import { NextResponse } from 'next/server';
import { siteConfig } from '@/config/site';
import { SHARE_PREVIEW_CRAWLER_HEADER } from '@/features/judging/lib/share-crawler';
import { fetchSharePreview, renderSharePreviewDocument } from '@/features/judging/lib/share-metadata';
import { buildVideoShareUrl, canonicalShareOrigin, isShareSubmissionId } from '@/features/judging/lib/share-url';

export const revalidate = 300;

function requestOrigin(request: Request): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  if (!host) return null;
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto || new URL(request.url).protocol.replace(':', '');
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

/**
 * Server-rendered link-preview document for one video.
 * People who open this path are sent to the canonical judging URL.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isShareSubmissionId(params.id)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const origin = canonicalShareOrigin(requestOrigin(request));
  if (request.headers.get(SHARE_PREVIEW_CRAWLER_HEADER) !== '1') {
    return NextResponse.redirect(buildVideoShareUrl(origin, params.id), 302);
  }

  const preview = await fetchSharePreview(params.id);
  if (!preview) {
    return new NextResponse('Not found', { status: 404 });
  }

  const html = renderSharePreviewDocument(origin, siteConfig.name, preview);
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      Vary: 'User-Agent',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
