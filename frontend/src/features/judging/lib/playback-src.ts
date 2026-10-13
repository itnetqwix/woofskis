const REFRESH_BEFORE_MS = 120_000;

const AMZ_DATE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

/** Path identity. Signature and cache-buster queries are not part of it. */
export function mediaAssetIdentity(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function presignedExpiryEpochMs(url: string): number | null {
  try {
    const parsed = new URL(url);
    const date = parsed.searchParams.get('X-Amz-Date');
    const expires = parsed.searchParams.get('X-Amz-Expires');
    if (!date || !expires) return null;
    const match = AMZ_DATE.exec(date);
    if (!match) return null;
    const issued = Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    );
    const ttlSeconds = Number(expires);
    if (!Number.isFinite(issued) || !Number.isFinite(ttlSeconds)) return null;
    return issued + ttlSeconds * 1000;
  } catch {
    return null;
  }
}

/**
 * Keep the URL already attached to a video element when a queue refresh
 * only minted a new signature for the same object.
 * A CDN URL has no signature, so it stays until the object identity changes.
 * A presigned URL is replaced shortly before it expires.
 */
export function retainPlaybackUrl(current: string, incoming: string, now = Date.now()): string {
  if (!current) return incoming;
  if (!incoming) return current;
  if (mediaAssetIdentity(current) !== mediaAssetIdentity(incoming)) return incoming;
  const expiry = presignedExpiryEpochMs(current);
  if (expiry === null) return current;
  if (expiry - now <= REFRESH_BEFORE_MS) return incoming;
  return current;
}
