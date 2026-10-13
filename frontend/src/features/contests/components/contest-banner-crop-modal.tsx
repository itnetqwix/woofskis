'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Crop as CropIcon,
  RotateCcw,
  Sparkles,
  Eye,
  Loader2,
  Check,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CONTEST_BANNER_ASPECT_RATIO,
  isBannerAspectRatio,
  createCroppedBannerFile,
  resolveBannerContentType,
  validateBannerFile,
} from '@/features/contests/lib/contest-banner';

export interface ContestBannerCropModalProps {
  open: boolean;
  file: File | null;
  onApplyCrop: (croppedFile: File) => void | Promise<void>;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 95,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ContestBannerCropModal({
  open,
  file,
  onApplyCrop,
  onCancel,
}: ContestBannerCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Manage object URL for file
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      setNaturalDimensions(null);
      setCrop(undefined);
      setCompletedCrop(null);
      setHasInteracted(false);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop(undefined);
    setCompletedCrop(null);
    setCropError(null);
    setHasInteracted(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Check whether natural image matches presentation aspect ratio
  const matchesRatio = useMemo(() => {
    if (!naturalDimensions) return false;
    return isBannerAspectRatio(naturalDimensions.width, naturalDimensions.height);
  }, [naturalDimensions]);

  // When image loads inside ReactCrop
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });

    const initialCrop = centerAspectCrop(img.width, img.height, CONTEST_BANNER_ASPECT_RATIO);
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, img.width, img.height));
  }, []);

  // Reset crop back to center
  const handleReset = useCallback(() => {
    if (!imgRef.current) return;
    const initialCrop = centerAspectCrop(
      imgRef.current.width,
      imgRef.current.height,
      CONTEST_BANNER_ASPECT_RATIO
    );
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, imgRef.current.width, imgRef.current.height));
    setHasInteracted(false);
  }, []);

  // Update live preview canvas whenever completedCrop changes
  useEffect(() => {
    if (
      !completedCrop ||
      !completedCrop.width ||
      !completedCrop.height ||
      !imgRef.current ||
      !previewCanvasRef.current
    ) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const pixelCrop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Use high resolution for preview canvas
    const previewWidth = 720;
    const previewHeight = Math.round(previewWidth / CONTEST_BANNER_ASPECT_RATIO);

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      previewWidth,
      previewHeight
    );
  }, [completedCrop]);

  // Apply crop client-side
  const handleApply = async () => {
    if (!file || !imgRef.current) return;

    // If the image already matches the banner aspect ratio and user hasn't edited crop,
    // accept the original file directly without unnecessary re-encoding.
    if (matchesRatio && !hasInteracted) {
      await onApplyCrop(file);
      return;
    }

    const image = imgRef.current;
    const pixelCrop = completedCrop;
    if (!pixelCrop || pixelCrop.width === 0 || pixelCrop.height === 0) {
      setCropError('Please select a valid crop area.');
      return;
    }

    setIsProcessing(true);
    setCropError(null);

    try {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const sourceX = Math.max(0, Math.round(pixelCrop.x * scaleX));
      const sourceY = Math.max(0, Math.round(pixelCrop.y * scaleY));
      const sourceWidth = Math.min(
        image.naturalWidth - sourceX,
        Math.round(pixelCrop.width * scaleX)
      );
      const sourceHeight = Math.min(
        image.naturalHeight - sourceY,
        Math.round(pixelCrop.height * scaleY)
      );

      const canvas = document.createElement('canvas');
      const maxDim = 3840;
      let dstW = sourceWidth;
      let dstH = sourceHeight;
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
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const contentType = resolveBannerContentType(file) || 'image/jpeg';
      const outputMime = contentType === 'image/gif' ? 'image/png' : contentType;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) reject(new Error('Failed to generate cropped image'));
            else resolve(b);
          },
          outputMime,
          0.92
        );
      });

      const croppedFile = createCroppedBannerFile(blob, file.name, outputMime);
      const validationError = validateBannerFile(croppedFile);
      if (validationError) {
        throw new Error(validationError);
      }

      await onApplyCrop(croppedFile);
    } catch (err) {
      setCropError(err instanceof Error ? err.message : 'Failed to crop banner image');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onCancel() : null)}>
      <DialogContent
        className={cn(
          'z-[70] flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col overflow-hidden bg-white p-0 text-slate-900 shadow-2xl dark:bg-card dark:text-foreground sm:rounded-3xl',
          'border border-border/80'
        )}
      >
        {/* MODAL HEADER */}
        <DialogHeader className="shrink-0 border-b border-border/70 bg-white px-6 py-4 dark:bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shadow-xs flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <CropIcon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                  Crop Contest Banner
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Position and resize the crop area to fit the banner presentation.
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-muted/60 px-3 py-1 font-mono text-xs font-semibold text-foreground">
                3.46:1 presentation ratio
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* MODAL BODY */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 dark:bg-muted/10 sm:p-6">
          {/* Ratio Match Notice */}
          {matchesRatio && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                <strong>Image matches banner ratio.</strong> This image already fits the contest
                presentation format. You can click <strong>Apply Crop</strong> directly to accept it
                without unnecessary cropping, or adjust the framing below.
              </span>
            </div>
          )}

          {/* CROP WORKSPACE */}
          <div className="shadow-xs rounded-2xl border border-border/80 bg-white p-4 dark:bg-card sm:p-6">
            <div className="flex flex-col items-center justify-center">
              {imageSrc ? (
                <div className="flex w-full items-center justify-center overflow-hidden">
                  <ReactCrop
                    crop={crop}
                    onChange={(pixelCrop, percentCrop) => {
                      setCrop(percentCrop);
                      setHasInteracted(true);
                    }}
                    onComplete={(pixelCrop) => {
                      setCompletedCrop(pixelCrop);
                    }}
                    aspect={CONTEST_BANNER_ASPECT_RATIO}
                    keepSelection
                    ruleOfThirds
                    className="max-h-[380px] max-w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Contest banner crop workspace"
                      onLoad={onImageLoad}
                      className="shadow-xs max-h-[380px] w-auto max-w-full select-none rounded-lg object-contain"
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>
              ) : (
                <div className="flex h-56 w-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2">Loading image…</span>
                </div>
              )}
            </div>

            {/* Instruction & Reset Action */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
              <p className="text-muted-foreground">
                Drag the crop window to frame your image. Pull the handles to resize.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Crop</span>
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {cropError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cropError}</span>
            </div>
          )}

          {/* LIVE BANNER PREVIEW */}
          <div className="shadow-xs rounded-2xl border border-border/80 bg-white p-4 dark:bg-card sm:p-5">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Live Banner Presentation Preview</span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                As displayed to creators & guests
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-muted/40 shadow-inner">
              <div
                className="relative w-full overflow-hidden bg-slate-900"
                style={{ aspectRatio: CONTEST_BANNER_ASPECT_RATIO }}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="h-full w-full object-cover"
                  style={{ aspectRatio: CONTEST_BANNER_ASPECT_RATIO }}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="rounded-full border border-primary/30 bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    DRAFT
                  </span>
                  <span className="text-xs font-bold text-white drop-shadow">
                    Contest Presentation Banner
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <DialogFooter className="flex w-full shrink-0 flex-row items-center justify-between gap-3 border-t border-border/70 bg-white px-6 py-4 dark:bg-card">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-xl px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={isProcessing || !completedCrop}
            className="gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary-hover"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Applying Crop…</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Apply Crop</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
