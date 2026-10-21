export interface NativeSharePayload {
  title: string;
  text: string;
  url: string;
}

export type NativeShareResult = 'shared' | 'aborted' | 'unavailable';

export function isShareAbort(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  );
}

function canShareData(data: ShareData): boolean {
  if (typeof navigator.canShare !== 'function') return true;
  try {
    return navigator.canShare(data);
  } catch {
    return false;
  }
}

/**
 * Web Share API when the browser supports it (Messages and other native targets).
 * A cancelled sheet is `aborted`. Callers use SMS or a copied message otherwise.
 */
export async function shareWithNativeTarget(data: NativeSharePayload): Promise<NativeShareResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unavailable';
  }
  const candidates: ShareData[] = [data, { title: data.title, url: data.url }, { url: data.url }];
  for (const candidate of candidates) {
    if (!canShareData(candidate)) continue;
    try {
      await navigator.share(candidate);
      return 'shared';
    } catch (error) {
      if (isShareAbort(error)) return 'aborted';
    }
  }
  return 'unavailable';
}

/** Desktop browsers without a touch-first pointer use the paste fallback. */
export function shouldUseDesktopShareFallback(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
