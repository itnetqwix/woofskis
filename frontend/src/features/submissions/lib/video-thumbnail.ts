const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.82;
const TIMEOUT_MS = 10000;

/** Roughly a quarter in, so the frame is past fade-ins but early in the clip. */
function representativeTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(Math.max(duration * 0.25, 0.1), Math.max(duration - 0.1, 0));
}

/**
 * Captures one JPEG frame from a local video file in the browser.
 * Resolves null when the browser cannot decode the file (for example some
 * MOV codecs), so the upload continues without a thumbnail.
 */
export function captureVideoThumbnail(file: Blob): Promise<Blob | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    let settled = false;

    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
      resolve(blob);
    };
    const timer = window.setTimeout(() => finish(null), TIMEOUT_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onerror = () => finish(null);
    video.onloadedmetadata = () => {
      video.currentTime = representativeTime(video.duration);
    };
    video.onseeked = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return finish(null);
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext('2d');
      if (!context) return finish(null);
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), 'image/jpeg', JPEG_QUALITY);
      } catch {
        finish(null);
      }
    };
    video.src = objectUrl;
  });
}
