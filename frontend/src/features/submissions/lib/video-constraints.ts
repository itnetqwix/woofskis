export const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 60;
export const MIN_VIDEO_DURATION_SECONDS = 1;
export const ALLOWED_VIDEO_CONTENT_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export type AllowedVideoContentType = (typeof ALLOWED_VIDEO_CONTENT_TYPES)[number];

export function isAllowedVideoFile(file: File): boolean {
  if ((ALLOWED_VIDEO_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return true;
  }
  return /\.(mp4|webm|mov)$/i.test(file.name);
}

export function mimeTypeFromMediaUrl(url?: string | null): AllowedVideoContentType | undefined {
  if (!url) return undefined;
  const path = url.split('?')[0]?.split('#')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.webm')) return 'video/webm';
  if (path.endsWith('.mov')) return 'video/quicktime';
  if (path.endsWith('.mp4')) return 'video/mp4';
  return undefined;
}

export function resolveVideoContentType(file: File): AllowedVideoContentType | null {
  if (/\.mov$/i.test(file.name) || file.type === 'video/quicktime') {
    return 'video/quicktime';
  }
  if (file.type === 'video/mp4' || file.type === 'video/webm') {
    return file.type;
  }
  if (/\.mp4$/i.test(file.name)) return 'video/mp4';
  if (/\.webm$/i.test(file.name)) return 'video/webm';
  return null;
}

export function validateVideoFile(file: File): string | null {
  if (!isAllowedVideoFile(file)) {
    return 'Unsupported video format. Please upload MP4/WebM/MOV.';
  }
  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    const sizeMb = file.size / (1024 * 1024);
    return `File is too large (${sizeMb.toFixed(1)}MB). Max allowed size is 100MB.`;
  }
  return null;
}

export function validateVideoDuration(durationSeconds: number): string | null {
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < MIN_VIDEO_DURATION_SECONDS ||
    durationSeconds > MAX_VIDEO_DURATION_SECONDS
  ) {
    return `Video duration must be between ${MIN_VIDEO_DURATION_SECONDS} and ${MAX_VIDEO_DURATION_SECONDS} seconds.`;
  }
  return null;
}
