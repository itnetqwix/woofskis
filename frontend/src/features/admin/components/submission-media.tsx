'use client';

import React, { useEffect, useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { mimeTypeFromMediaUrl } from '@/features/submissions/lib/video-constraints';
import { cn } from '@/lib/utils';

export function SubmissionThumbnail({
  title,
  thumbnailUrl,
  videoUrl,
  className,
}: {
  title?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const label = title?.trim() || 'Creator video';
  const imageSrc = thumbnailUrl?.trim() || '';

  useEffect(() => {
    setImageFailed(false);
    setFrameFailed(false);
  }, [imageSrc, videoUrl]);

  const showImage = Boolean(imageSrc) && !imageFailed;
  const showFrame = !showImage && Boolean(videoUrl) && !frameFailed;

  return (
    <div
      className={cn(
        'relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-32 sm:w-24',
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={label}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : showFrame ? (
        <video
          src={videoUrl ?? undefined}
          muted
          playsInline
          preload="metadata"
          className="pointer-events-none h-full w-full object-cover"
          onLoadedData={(event) => {
            const element = event.currentTarget;
            if (element.currentTime < 0.1) {
              try {
                element.currentTime = 0.1;
              } catch {
                setFrameFailed(true);
              }
            }
          }}
          onError={() => setFrameFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-primary/25 to-muted px-1 text-center">
          <Film className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="line-clamp-3 text-[9px] font-bold uppercase leading-tight tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

export function SubmissionVideoModal({
  videoId,
  videoUrl,
  onClose,
}: {
  videoId: string;
  videoUrl: string;
  onClose: () => void;
}) {
  const mimeType = mimeTypeFromMediaUrl(videoUrl);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-black">
        <video
          key={videoId}
          src={mimeType ? undefined : videoUrl}
          controls
          autoPlay
          playsInline
          preload="metadata"
          className="max-h-[70dvh] w-full rounded-t-2xl bg-black object-contain"
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = false;
            event.currentTarget.volume = 1;
          }}
        >
          {mimeType ? <source src={videoUrl} type={mimeType} /> : null}
        </video>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-background py-3 text-xs font-bold text-foreground"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function DeleteSubmissionDialog({
  title,
  description,
  isPending,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: React.ReactNode;
  isPending: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close delete confirmation"
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />
      <form
        className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onConfirm(trimmed);
        }}
      >
        <h3 className="text-base font-black">Delete “{title}”?</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-foreground">
            Reason for deletion <span className="text-destructive">*</span>
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={1000}
            rows={3}
            autoFocus
            className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
            placeholder="Explain why this video is being deleted"
          />
          <span className="block text-[11px] text-muted-foreground">
            The creator will be notified and will see this reason.
          </span>
        </label>
        {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-border px-3 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !trimmed}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-destructive px-3 text-xs font-bold text-white disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Delete and notify creator
          </button>
        </div>
      </form>
    </div>
  );
}
