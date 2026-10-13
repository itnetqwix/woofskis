export const DEFAULT_CONTEST_BANNER_URL =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80';

export const BANNER_CONTENT_TYPES = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/gif': 'image/gif',
} as const;

export const BANNER_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export function resolveBannerContentType(file: { type: string; name: string }): string | null {
  const type = file.type.toLowerCase();
  if (type in BANNER_CONTENT_TYPES)
    return BANNER_CONTENT_TYPES[type as keyof typeof BANNER_CONTENT_TYPES];
  const name = file.name.toLowerCase();
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  return null;
}

export function validateBannerFile(file: {
  type: string;
  name: string;
  size: number;
}): string | null {
  if (!resolveBannerContentType(file)) {
    return 'Choose a JPEG, PNG, WebP, or GIF image.';
  }
  if (file.size < 1) return 'Contest banner file is empty';
  if (file.size > BANNER_MAX_FILE_SIZE_BYTES) {
    return 'Contest banner must be 100MB or smaller';
  }
  return null;
}

export function contestBannerSrc(
  bannerUrl: string | null | undefined,
  fallback = DEFAULT_CONTEST_BANNER_URL
): string {
  const trimmed = bannerUrl?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Presentation aspect ratio of the contest banner presentation.
 * Matches the presentation card in ContestPresentation (720px width by 208px height = 45/13 ≈ 3.4615:1).
 */
export const CONTEST_BANNER_ASPECT_RATIO = 720 / 208;

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BannerCropViewport {
  zoom: number;
  offsetX: number;
  offsetY: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Checks whether an image's natural dimensions match the contest banner aspect ratio within a tolerance.
 */
export function isBannerAspectRatio(
  width: number,
  height: number,
  tolerance = 0.03,
  aspectRatio = CONTEST_BANNER_ASPECT_RATIO
): boolean {
  if (!width || !height || width <= 0 || height <= 0) return false;
  const imageRatio = width / height;
  return Math.abs(imageRatio - aspectRatio) / aspectRatio <= tolerance;
}

/**
 * Computes natural image pixel coordinates for a crop based on viewport state.
 */
export function computeBannerCropRect(
  imageWidth: number,
  imageHeight: number,
  cropState: BannerCropViewport,
  aspectRatio = CONTEST_BANNER_ASPECT_RATIO
): CropRect {
  const { zoom, offsetX, offsetY, viewportWidth, viewportHeight } = cropState;
  const safeZoom = Math.max(1, zoom);
  const imageRatio = imageWidth / imageHeight;
  const targetRatio = aspectRatio > 0 ? aspectRatio : viewportWidth / viewportHeight;

  // At zoom = 1, base displayed dimensions that cover the viewport:
  let baseWidth = viewportWidth;
  let baseHeight = viewportHeight;
  if (imageRatio >= targetRatio) {
    baseHeight = viewportHeight;
    baseWidth = viewportHeight * imageRatio;
  } else {
    baseWidth = viewportWidth;
    baseHeight = viewportWidth / imageRatio;
  }

  const dispWidth = baseWidth * safeZoom;
  const dispHeight = baseHeight * safeZoom;

  const maxOffsetX = Math.max(0, (dispWidth - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (dispHeight - viewportHeight) / 2);

  const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
  const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));

  // Scale from natural image pixels to displayed pixels:
  const scale = dispWidth / imageWidth;

  // Viewport top-left in displayed image coordinates:
  const vx = dispWidth / 2 - viewportWidth / 2 - clampedX;
  const vy = dispHeight / 2 - viewportHeight / 2 - clampedY;

  // Convert to natural pixels:
  const srcX = Math.max(0, Math.min(imageWidth, vx / scale));
  const srcY = Math.max(0, Math.min(imageHeight, vy / scale));
  const srcW = Math.max(1, Math.min(imageWidth - srcX, viewportWidth / scale));
  const srcH = Math.max(1, Math.min(imageHeight - srcY, viewportHeight / scale));

  return {
    x: Math.round(srcX),
    y: Math.round(srcY),
    width: Math.round(srcW),
    height: Math.round(srcH),
  };
}

/**
 * Creates a File from an image Blob with a safe filename and appropriate MIME type.
 */
export function createCroppedBannerFile(
  blob: Blob,
  originalFileName: string,
  contentType: string
): File {
  const extension =
    contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : '.jpg';
  const dotIndex = originalFileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? originalFileName.slice(0, dotIndex) : originalFileName;
  const fileName = `${baseName}-cropped${extension}`;
  return new File([blob], fileName, { type: contentType, lastModified: Date.now() });
}

/**
 * Client-side canvas crop helper that extracts the crop area at high resolution.
 */
export async function cropImageToBlob(
  imageSource: CanvasImageSource,
  cropRect: CropRect,
  outputType = 'image/jpeg',
  quality = 0.92
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const maxDim = 3840;
  let dstW = Math.round(cropRect.width);
  let dstH = Math.round(cropRect.height);
  if (dstW > maxDim) {
    const scale = maxDim / dstW;
    dstW = maxDim;
    dstH = Math.round(dstH * scale);
  }
  canvas.width = Math.max(1, dstW);
  canvas.height = Math.max(1, dstH);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    imageSource,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to generate cropped image'));
        } else {
          resolve(blob);
        }
      },
      outputType,
      quality
    );
  });
}
