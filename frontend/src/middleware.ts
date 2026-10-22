import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  SHARE_PREVIEW_CRAWLER_HEADER,
  shouldServeSharePreviewDocument,
} from '@/features/judging/lib/share-crawler';
import { isShareSubmissionId } from '@/features/judging/lib/share-url';

/**
 * Link-preview crawlers receive a finished HTML document for `/?v=<id>`.
 * Everyone else keeps the judging app. The rewrite does not change the public URL.
 */
export function middleware(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next();
  if (request.nextUrl.pathname !== '/') return NextResponse.next();
  const videoId = request.nextUrl.searchParams.get('v') ?? '';
  if (!isShareSubmissionId(videoId)) return NextResponse.next();
  if (!shouldServeSharePreviewDocument(request.headers.get('user-agent'))) return NextResponse.next();

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/media/submissions/${videoId}/preview`;
  rewriteUrl.search = '';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SHARE_PREVIEW_CRAWLER_HEADER, '1');
  return NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/'],
};
